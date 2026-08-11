import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import { recomputeCapabilityScore } from '@/lib/scoring/capability-engine';

// POST /api/actions/[actionId]/evaluations
//
// The evaluation-submission endpoint — blocked pending the R1 contradiction
// (Cyprian escalated 30 July; resolved by André, in writing, built against
// DEV Handover v1.10 / Action Flow Spec v10; see schema-v5 migration header).
//
// R6: the Evaluator rates EVERY selected Skill on the action atomically, in
// one sitting — one evaluations row per Skill, all sharing one session_id.
// evaluator_role/evaluator_relationship/difficulty_confirmed are declared
// ONCE per submission (not per skill); score/evidence_quality/comment are
// PER skill.
//
// Body shape:
// {
//   evaluator_role: 'PROFESSOR' | 'COMPANY' | 'MENTOR' | 'CLIENT' | 'PEER',
//   evaluator_relationship: 'MANAGER' | 'PEER' | 'DIRECT_REPORT' | 'EXTERNAL' | 'OTHER',
//   difficulty_confirmed: 'FOUNDATIONAL' | 'INTERMEDIATE' | 'ADVANCED' | 'EXCEPTIONAL',
//   ratings: [
//     { skill_id: string, score: 0-5, evidence_quality: 0-5, comment?: string }
//   ]
// }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ actionId: string }> }
) {
  const { actionId: action_id } = await params;

  try {
    const body = await request.json();
    const { evaluator_role, evaluator_relationship, difficulty_confirmed, ratings } = body;

    if (!evaluator_role || !evaluator_relationship || !difficulty_confirmed) {
      return NextResponse.json(
        { error: 'Missing evaluator_role, evaluator_relationship, or difficulty_confirmed' },
        { status: 400 }
      );
    }

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json({ error: 'ratings must be a non-empty array' }, { status: 400 });
    }

    // R6: comment mandatory at score 0, 1, or 5 — validated here for a clean
    // 400 with the offending skill_id; the DB CHECK constraint
    // (comment_required_at_extremes) is the actual source of truth and will
    // reject this regardless if this check is ever bypassed.
    for (const r of ratings) {
      if (
        typeof r.skill_id !== 'string' ||
        typeof r.score !== 'number' ||
        typeof r.evidence_quality !== 'number'
      ) {
        return NextResponse.json(
          { error: 'Each rating needs skill_id, score, and evidence_quality' },
          { status: 400 }
        );
      }
      if ([0, 1, 5].includes(r.score) && !(r.comment && r.comment.trim().length > 0)) {
        return NextResponse.json(
          { error: `Comment required for skill ${r.skill_id} (score ${r.score} — R6)` },
          { status: 400 }
        );
      }
    }

    // Identify the evaluator from the session — evaluations.evaluator_id is
    // NEVER nullable (R12), no token-only evaluation path.
    const sessionSupabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Only Skills actually selected on this action may be rated — resolve
    // capability_id from action_skills.capability_id_resolved, the R4
    // snapshot taken at selection time. Never re-derive live from `skills`.
    const { data: actionSkills, error: actionSkillsError } = await supabase
      .from('action_skills')
      .select('skill_id, capability_id_resolved')
      .eq('action_id', action_id);

    if (actionSkillsError) {
      console.error('Error loading action_skills:', actionSkillsError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const resolvedByskill = new Map(
      (actionSkills ?? []).map((s) => [s.skill_id, s.capability_id_resolved])
    );

    const unknownSkill = ratings.find((r: { skill_id: string }) => !resolvedByskill.has(r.skill_id));
    if (unknownSkill) {
      return NextResponse.json(
        { error: `Skill ${unknownSkill.skill_id} was not selected on this action` },
        { status: 400 }
      );
    }

    // R6: one evaluation per evaluator per action — a second submission
    // attempt for this action by this evaluator is rejected outright rather
    // than silently accepted (the 10-min-cooldown language in R6 describes
    // the same intent; the practical enforcement here is "once, ever" per
    // evaluator per action, backed by the unique_evaluator_action_skill
    // constraint at the DB layer as a second line of defense).
    const { data: existing, error: existingError } = await supabase
      .from('evaluations')
      .select('evaluation_id')
      .eq('action_id', action_id)
      .eq('evaluator_id', user.id)
      .limit(1);

    if (existingError) {
      console.error('Error checking existing evaluations:', existingError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'You have already submitted an evaluation for this action' },
        { status: 409 }
      );
    }

    // Fetch the rubric_version currently attached to each affected capability
    // — stored on every row for reproducibility (handover §1).
    const capabilityIds = [...new Set(ratings.map((r: { skill_id: string }) => resolvedByskill.get(r.skill_id)!))];
    const { data: rubricRows, error: rubricError } = await supabase
      .from('rubrics')
      .select('capability_id, rubric_version')
      .in('capability_id', capabilityIds);

    if (rubricError) {
      console.error('Error loading rubric versions:', rubricError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const rubricVersionByCapability = new Map(
      (rubricRows ?? []).map((r) => [r.capability_id, r.rubric_version])
    );

    // TODO(Cyprian): scoring_version should come from a single source of
    // truth (a release/version table or env var), not a literal — flagging
    // rather than inventing one. Using a placeholder that is at least
    // consistent across this submission.
    const scoringVersion = process.env.SCORING_VERSION ?? 'v1.10-unconfirmed';

    const sessionId = crypto.randomUUID();

    const rowsToInsert = ratings.map((r: { skill_id: string; score: number; evidence_quality: number; comment?: string }) => ({
      action_id,
      session_id: sessionId,
      evaluator_id: user.id,
      evaluator_role,
      evaluator_relationship,
      skill_id: r.skill_id,
      capability_id: resolvedByskill.get(r.skill_id)!,
      score: r.score,
      evidence_quality: r.evidence_quality,
      difficulty_confirmed,
      comment: r.comment ?? null,
      rubric_version: rubricVersionByCapability.get(resolvedByskill.get(r.skill_id)!) ?? null,
      scoring_version: scoringVersion,
    }));

    // R6: all Skill-scores for this action submitted together, atomically.
    const { error: insertError } = await supabase.from('evaluations').insert(rowsToInsert);

    if (insertError) {
      // R6 no-self-evaluation trigger, or the unique_evaluator_action_skill
      // constraint, surface here as a DB error rather than the pre-checks
      // above if something raced between the check and the insert.
      console.error('Error inserting evaluations:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    // Recompute profile_capability_scores for each distinct capability
    // touched by this session (R9) — once per capability, not once per skill
    // row, since multiple rated Skills commonly resolve to the same
    // Capability within one session.
    const { data: actionRow, error: actionRowError } = await supabase
      .from('actions')
      .select('creator_profile_id')
      .eq('action_id', action_id)
      .single();

    if (actionRowError || !actionRow) {
      console.error('Error loading action for recompute:', actionRowError);
      // Evaluation rows are already committed at this point — surface a 207
      // so the client knows the submission succeeded but scores may lag,
      // rather than implying the whole submission failed.
      return NextResponse.json(
        { message: 'Evaluation submitted; capability score recompute failed and will need a manual retry', session_id: sessionId },
        { status: 207 }
      );
    }

    try {
      await Promise.all(
        capabilityIds.map((capId) =>
          recomputeCapabilityScore(actionRow.creator_profile_id, capId, scoringVersion)
        )
      );
    } catch (recomputeErr) {
      console.error('Capability score recompute failed:', recomputeErr);
      return NextResponse.json(
        { message: 'Evaluation submitted; capability score recompute failed and will need a manual retry', session_id: sessionId },
        { status: 207 }
      );
    }

    return NextResponse.json({ message: 'Evaluation submitted', session_id: sessionId }, { status: 201 });
  } catch (err) {
    console.error('Evaluation submission API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
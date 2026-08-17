import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/actions — list + filter
// Supports filters per Week 2 spec: capability, status, contributor, evaluator.
// Status values: 7 total per the current action_status enum (Draft,
// Proposed, Locked, Declined, Submitted, Evaluated, Verified) — the earlier
// "CONFIRMED 20 July: Draft/Submitted/Evaluated/Verified" comment here was
// stale; it predated Path B's Proposed/Locked/Declined states added by the
// later v6/v10 spec revisions. This route still accepts whatever string is
// passed through and lets the DB CHECK/enum constraint reject invalid
// values, rather than hardcoding a duplicate list here — that part was
// already right.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const capabilityId = searchParams.get('capability_id');
  const status = searchParams.get('status');
  const contributorId = searchParams.get('contributor_id');
  const evaluatorId = searchParams.get('evaluator_id');

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase
    .from('actions')
    .select(`
      action_id, creator_profile_id, action_title, description, expected_outcome,
      ai_involvement, difficulty_declared, org_visibility, status, due_date, created_at,
      action_skills ( id, skill_id, capability_id_resolved )
    `);

  if (status) {
    query = query.eq('status', status);
  }

  if (contributorId) {
    query = query.eq('creator_profile_id', contributorId);
  }

  if (capabilityId) {
    // Filter to actions that have at least one action_skills row resolving
    // to this capability. Supabase/PostgREST doesn't support a clean nested
    // filter here, so this uses a subquery via .in() on a pre-fetched id list.
    const { data: matchingActionSkills } = await supabase
      .from('action_skills')
      .select('action_id')
      .eq('capability_id_resolved', capabilityId);
    const actionIds = (matchingActionSkills || []).map((row) => row.action_id);
    if (actionIds.length === 0) {
      return NextResponse.json({ actions: [] }, { status: 200 });
    }
    query = query.in('action_id', actionIds);
  }

  if (evaluatorId) {
    // Filter to actions where this evaluator has an assignment.
    const { data: matchingAssignments } = await supabase
      .from('evaluator_assignments')
      .select('action_id')
      .eq('evaluator_profile_id', evaluatorId);
    const actionIds = (matchingAssignments || []).map((row) => row.action_id);
    if (actionIds.length === 0) {
      return NextResponse.json({ actions: [] }, { status: 200 });
    }
    query = query.in('action_id', actionIds);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ actions: data }, { status: 200 });
}

// POST /api/actions — create
//
// Creates the action shell only — status always 'Draft'. Skill selection
// (R4 snapshot) is a separate call to POST /api/actions/[actionId]/skills;
// evaluator invitation (which also drives the Draft -> Proposed/Submitted
// transition, see evaluators/route.ts) is a separate call to
// POST /api/actions/[actionId]/evaluators. Not folding those into this
// endpoint keeps the three concerns independently callable/retriable,
// matching the separation already established for evaluators/skills.
//
// R12 account gate: added here — the previous version checked only for an
// auth session, not a completed rudimentary profile. A Supabase auth
// session can exist without a profiles row (auth.users is created at
// Supabase Auth signup; profiles is created separately by
// /api/auth/signup) — those are genuinely two different things, and R12
// requires the latter before anyone can create an action.
//
// Evidence fields added — optional at creation (Path A step 4 / Path B-5b
// evidence comes later at submission, so these are nullable either way).
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  if (!profile) {
    // R12: nothing is written to profiles until rudimentary signup fully
    // completes — reject rather than silently create one here, since that's
    // /api/auth/signup's job, not this endpoint's.
    return NextResponse.json(
      { error: 'Rudimentary profile required before creating an action (R12)' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    action_title,
    description,
    expected_outcome,
    ai_involvement,
    difficulty_declared,
    org_visibility,
    due_date,
    evidence_note,
    evidence_link,
    evidence_files,
    evidence_storage_mode,
  } = body;

  if (!action_title) {
    return NextResponse.json({ error: 'action_title is required' }, { status: 400 });
  }
  if (!ai_involvement) {
    // R5: every action requires ai_involvement at creation, no exceptions.
    return NextResponse.json({ error: 'ai_involvement is required (R5)' }, { status: 400 });
  }
  if (!org_visibility) {
    // R10: consent must be an explicit choice made by the individual, not a
    // silent default — reject rather than assume.
    return NextResponse.json({ error: 'org_visibility is required (R10) — must be an explicit consent choice' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('actions')
    .insert({
      creator_profile_id: user.id,
      action_title,
      description: description ?? null,
      expected_outcome: expected_outcome ?? null,
      ai_involvement,
      difficulty_declared: difficulty_declared ?? null,   // creator-declared only; never used in scoring (R9)
      org_visibility,
      due_date: due_date ?? null,
      evidence_note: evidence_note ?? null,
      evidence_link: evidence_link ?? null,
      evidence_files: evidence_files ?? null,
      evidence_storage_mode: evidence_storage_mode ?? 'external_reference',
      status: 'Draft', // Confirmed initial status per resolved action_status enum
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action: data }, { status: 201 });
}

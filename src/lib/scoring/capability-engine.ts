import { createClient as createServiceClient } from '@supabase/supabase-js';

// Capability Engine — R9's deterministic scoring formula.
//
// capability_score = sum(score * w) / sum(w)
//   w = difficulty_weight * confidence_weight
//   confidence_weight = 0.5 + 0.1 * evidence_quality
//   difficulty_weight comes from scoring_policy, keyed by
//   evaluations.difficulty_confirmed (never actions.difficulty_declared —
//   R9's anti-gaming rule).
//
// The formula itself is unchanged by the v1.10 skill-scoping change — it now
// simply sums over more, finer-grained rows (one per rated Skill instead of
// one per Capability).
//
// RESOLVED (confirmed with André): the Provisional -> Confirmed threshold
// (R9: ">=3 skill-level evaluations rows resolving to a Capability") counts
// a raw ROW COUNT, session and evaluator irrelevant — v1.10. His emailed
// clarification had cited Handover v1.9's distinct-sessions rule, but the
// v1.10 documents were sent AFTER that email and supersede it — confirmed
// this is the correct read, not a stale attachment. Kept as a named
// constant (rather than inlined) because this exact line reversed three
// times before landing here (v1.8 rows -> v1.9 distinct sessions -> v1.10
// rows again) — if it ever needs to flip again, one line, not a rewrite.
const CONFIRMED_THRESHOLD_MODE: 'row_count' | 'distinct_sessions' = 'row_count';
const CONFIRMED_THRESHOLD_COUNT = 3;

interface EvaluationRow {
  score: number;
  evidence_quality: number;
  difficulty_confirmed: 'FOUNDATIONAL' | 'INTERMEDIATE' | 'ADVANCED' | 'EXCEPTIONAL';
  session_id: string;
  scoring_version: string;
}

interface ScoringPolicyConfig {
  difficultyWeight: Record<string, number>;
}

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// scoring_policy is a flat parameter/value table (R9, section 3/10: "load as
// config, never hardcode"). The exact parameter key naming isn't given in
// the handover text itself — only that difficulty weights exist in that
// sheet (FOUNDATIONAL=0.8, INTERMEDIATE=1.0, ADVANCED=1.2, EXCEPTIONAL=1.4
// are documented as reference values, schema comment, not guaranteed key
// names). This reads `difficulty_weight.<LEVEL>` and falls back to those
// documented reference values ONLY if the key is missing, logging loudly so
// a naming mismatch against the real ingested sheet is visible immediately
// rather than silently using the fallback in production.
async function loadScoringPolicy(
  supabase: ReturnType<typeof createServiceClient>
): Promise<ScoringPolicyConfig> {
  const fallback: Record<string, number> = {
    FOUNDATIONAL: 0.8,
    INTERMEDIATE: 1.0,
    ADVANCED: 1.2,
    EXCEPTIONAL: 1.4,
  };

  const { data, error } = await supabase
    .from('scoring_policy')
    .select('parameter, value')
    .like('parameter', 'difficulty_weight.%');

  if (error || !data || data.length === 0) {
    console.warn(
      '[capability-engine] scoring_policy difficulty_weight.* rows not found — falling back to documented reference values. Confirm the real parameter key naming against the ingested scoring_policy sheet.'
    );
    return { difficultyWeight: fallback };
  }

  const difficultyWeight: Record<string, number> = {};
  for (const row of data) {
    const level = row.parameter.replace('difficulty_weight.', '');
    difficultyWeight[level] = parseFloat(row.value);
  }

  return { difficultyWeight: { ...fallback, ...difficultyWeight } };
}

function confidenceWeight(evidenceQuality: number): number {
  return 0.5 + 0.1 * evidenceQuality;
}

function computeCapabilityScore(
  rows: { score: number; evidence_quality: number; difficulty_confirmed: string }[],
  difficultyWeight: Record<string, number>
): number | null {
  if (rows.length === 0) return null;

  let numerator = 0;
  let denominator = 0;

  for (const row of rows) {
    const dWeight = difficultyWeight[row.difficulty_confirmed] ?? 1.0;
    const w = dWeight * confidenceWeight(row.evidence_quality);
    numerator += row.score * w;
    denominator += w;
  }

  return denominator > 0 ? numerator / denominator : null;
}

function computeDisplayStatus(rows: EvaluationRow[]): 'provisional' | 'full' {
  const count =
    CONFIRMED_THRESHOLD_MODE === 'row_count'
      ? rows.length
      : new Set(rows.map((r) => r.session_id)).size;

  return count >= CONFIRMED_THRESHOLD_COUNT ? 'full' : 'provisional';
}

// Recomputes and upserts profile_capability_scores for one (profile,
// capability) pair from ALL evaluations rows resolving to it, across every
// action, evaluator, and time (R9). Call this once per distinct
// capability_id affected by a new evaluation session — not once per skill
// row, since several rated Skills in one session commonly resolve to the
// same Capability and only need one recompute.
export async function recomputeCapabilityScore(
  profileId: string,
  capabilityId: string,
  scoringVersion: string
): Promise<void> {
  const supabase = serviceClient();
  const { difficultyWeight } = await loadScoringPolicy(supabase);

  // All evaluations rows resolving to this capability, for actions created
  // by this profile — across every action/evaluator/time (R9: "across all
  // sessions over time").
  const { data: rows, error } = await supabase
    .from('evaluations')
    .select('score, evidence_quality, difficulty_confirmed, session_id, scoring_version, action_id, actions!inner(creator_profile_id)')
    .eq('capability_id', capabilityId)
    .eq('actions.creator_profile_id', profileId);

  if (error) {
    console.error('[capability-engine] Failed to load evaluations for recompute:', error);
    throw error;
  }

  const evaluationRows: EvaluationRow[] = (rows ?? []) as unknown as EvaluationRow[];

  const capabilityScore = computeCapabilityScore(evaluationRows, difficultyWeight);
  const displayStatus = computeDisplayStatus(evaluationRows);

  const { error: upsertError } = await supabase
    .from('profile_capability_scores')
    .upsert(
      {
        profile_id: profileId,
        capability_id: capabilityId,
        capability_score: capabilityScore,
        evaluation_count: evaluationRows.length,
        display_status: displayStatus,
        scoring_version: scoringVersion,
        last_updated: new Date().toISOString(),
      },
      { onConflict: 'profile_id,capability_id' }
    );

  if (upsertError) {
    console.error('[capability-engine] Failed to upsert profile_capability_scores:', upsertError);
    throw upsertError;
  }
}

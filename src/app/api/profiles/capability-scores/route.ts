import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/profile/capability-scores
//
// Owner-only read of the calling profile's own profile_capability_scores rows
// (R9's canonical output), joined with capability metadata for display.
// For Klenis's /s/profile owner view (Context Handoff §9).
//
// Auth: cookie session via createServerClient(); RLS on
// profile_capability_scores already restricts rows to auth.uid() = profile_id
// (see "Profiles can view their own capability scores" policy), so no
// service-role client is needed or used here — this route can only ever see
// the caller's own data, enforced at the DB layer, not just in this file.
//
// Dormant capabilities (R7) are excluded automatically: capabilities!inner
// only matches rows the caller's session is allowed to see under the
// "Non-dormant capabilities are readable" policy, so a dormant capability_id
// simply drops the row rather than surfacing with null metadata.
export async function GET() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: scores, error } = await supabase
      .from('profile_capability_scores')
      .select(
        `
        id,
        capability_id,
        capability_score,
        evaluation_count,
        display_status,
        scoring_version,
        last_updated,
        capabilities!inner (
          name,
          family,
          tier,
          description
        )
      `
      )
      .eq('profile_id', user.id)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching profile capability scores:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // R9: display_status must be provisional (clearly marked) below 3
    // evaluations, full at >=3 — pass it through as-is rather than collapsing
    // it, so the frontend can never accidentally render a provisional score
    // as if it were full.
    const results = (scores ?? []).map((row) => ({
      id: row.id,
      capability_id: row.capability_id,
      capability_name: row.capabilities?.name ?? null,
      capability_family: row.capabilities?.family ?? null,
      capability_tier: row.capabilities?.tier ?? null,
      capability_description: row.capabilities?.description ?? null,
      capability_score: row.capability_score,
      evaluation_count: row.evaluation_count,
      display_status: row.display_status,
      scoring_version: row.scoring_version,
      last_updated: row.last_updated,
    }));

    return NextResponse.json({ scores: results }, { status: 200 });
  } catch (err) {
    console.error('Owner capability-scores API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

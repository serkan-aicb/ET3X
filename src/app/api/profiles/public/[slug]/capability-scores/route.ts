import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/profiles/public/[slug]/capability-scores
//
// Public, unauthenticated read of capability scores for a profile that has
// opted into a public page, keyed by profiles.public_slug. For Klenis's
// /p/[slug] public view (Context Handoff §9).
//
// ⚠️ Depends on schema-v4-patch1-public-profile-slug.sql — `public_slug`,
// `profile_id_for_public_slug()`, and the new public RLS policy on
// profile_capability_scores don't exist before that patch runs. This is a
// FLAGGED addition, not a confirmed one — see that patch's header before
// treating this endpoint as final (André hasn't signed off on the
// opt-in/slug UX yet).
//
// Deliberately uses the anon key, not the service-role key: the new RLS
// policy on profile_capability_scores ("...readable via public_slug") does
// the actual gating, and profile_id_for_public_slug() is a narrow
// SECURITY DEFINER function that only ever returns an id. No broader table
// is opened up to make this route work, and SUPABASE_SERVICE_ROLE_KEY stays
// scoped to the ingestion script only, per existing convention.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: profileId, error: lookupError } = await supabase.rpc(
      'profile_id_for_public_slug',
      { lookup_slug: slug }
    );

    if (lookupError) {
      console.error('Error resolving public_slug:', lookupError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!profileId) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: scores, error } = await supabase
      .from('profile_capability_scores')
      .select(
        `
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
      .eq('profile_id', profileId)
      .order('last_updated', { ascending: false });

    if (error) {
      console.error('Error fetching public capability scores:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Same R9 note as the owner route: pass display_status through untouched
    // so a provisional score (< 3 evaluations) can never render as if full.
    const results = (scores ?? []).map((row) => ({
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

    return NextResponse.json({ public_slug: slug, scores: results }, { status: 200 });
  } catch (err) {
    console.error('Public capability-scores API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

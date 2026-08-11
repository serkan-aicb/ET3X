-- =============================================================================
-- Talent3X — Schema v4, Patch 1: public_slug for the public capability-score page
-- =============================================================================
-- Context: Klenis's Week 5 profile pages need TWO profile_capability_scores
-- reads — (a) owner view at /s/profile, (b) public view at /p/[slug]. (a) is
-- straightforward under the existing schema. (b) is NOT: nothing in schema
-- v4 supports it. `public_slug` was a real column on the OLD/legacy profiles
-- table (see legacy src/app/api/profiles/public/[slug]/route.ts still in
-- main) but it was dropped when profiles was intentionally rebuilt lean for
-- v1.7 (§11) — the rebuilt table only carries id, organisation, function_role,
-- free_actions_submitted. It was never re-added because nothing in DEV
-- Handover v1.7 or Action Flow Spec v6 discusses public sharing at all.
--
-- FLAGGED, NOT CONFIRMED BY ANDRÉ:
--   - Whether `public_slug` is the right mechanism at all (vs. e.g. always
--     public, or a separate boolean).
--   - Slug generation/assignment UX (auto-generated vs. user-chosen, and
--     when it's created) — this migration adds storage only, nothing writes
--     to the column yet.
--   - Whether any *other* profile fields belong on a public page (there is
--     currently no display-name field on profiles at all post-rebuild —
--     organisation/function_role are the only candidates, and neither is
--     really "who is this"). This is a separate gap from the one this patch
--     fixes and is called out to André/Klenis rather than solved here.
--
-- Design, given the above is unconfirmed:
--   - `public_slug` is NULLABLE and UNIQUE. NULL = no public page. Non-NULL
--     doubles as the opt-in signal (one field, no separate is_public flag).
--   - profiles' existing owner-only RLS is left completely untouched — this
--     patch does NOT add a public read policy on `profiles` itself. Instead,
--     slug -> profile_id resolution goes through a single-purpose
--     SECURITY DEFINER function that returns only an id, so the public
--     surface stays as narrow as possible.
--   - The actual capability-score read is a new anon-readable RLS policy on
--     `profile_capability_scores`, gated on the owner having a public_slug
--     set. This mirrors the existing "public reference data" pattern already
--     used for capabilities/skills/rubrics (base schema, RLS section) rather
--     than reaching for the service-role bypass — keeping
--     SUPABASE_SERVICE_ROLE_KEY scoped to the ingestion script only, per the
--     existing convention (Context Handoff §3).
--   - Dormant capabilities are still excluded from this public view for free,
--     via the existing `capabilities` RLS policy (R7) — no extra work needed
--     here, but called out so it isn't assumed forgotten.
--
-- Needs Serkan's sign-off like any other RLS/schema change, and needs André
-- to confirm the opt-in/slug-generation UX before Klenis wires up a "create
-- my public page" action on the frontend. Both flagged, neither guessed.
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_public_slug
  ON profiles(public_slug)
  WHERE public_slug IS NOT NULL;

COMMENT ON COLUMN profiles.public_slug IS
  'PLACEHOLDER — not specified in v1.7 or v6, added to unblock Klenis''s /p/[slug] public profile page. NULL = no public page; non-NULL doubles as the opt-in flag. Generation/assignment flow unconfirmed (see patch header). Do not build a "make public" UI action against this without André''s sign-off on the UX.';

-- Single-purpose lookup: slug -> profile_id only. Runs as the function owner
-- (SECURITY DEFINER) specifically so the public API route can resolve a slug
-- without needing any broader public RLS policy on `profiles` itself — the
-- public surface should be exactly "does this slug exist, and if so whose",
-- nothing more.
CREATE OR REPLACE FUNCTION public.profile_id_for_public_slug(lookup_slug TEXT)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM profiles WHERE public_slug = lookup_slug;
$$;

COMMENT ON FUNCTION public.profile_id_for_public_slug IS
  'Public slug -> profile_id resolution only, for the /p/[slug] read endpoint. Deliberately returns nothing else about the profile. SECURITY DEFINER so it does not require a public RLS policy on profiles itself.';

REVOKE ALL ON FUNCTION public.profile_id_for_public_slug(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_id_for_public_slug(TEXT) TO anon, authenticated;

-- Public read of capability scores, gated on the owner having opted in via
-- public_slug. Anon-key readable — same pattern as the existing
-- capabilities/skills/rubrics "public reference data" policies.
DROP POLICY IF EXISTS "Public capability scores readable via public_slug" ON profile_capability_scores;
CREATE POLICY "Public capability scores readable via public_slug" ON profile_capability_scores
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE public_slug IS NOT NULL)
  );

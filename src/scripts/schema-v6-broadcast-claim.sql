-- =============================================================================
-- Talent3X — Schema v6: broadcast-recipient actions for profile-less recipients
-- =============================================================================
-- Real gap, not new to this session: action_broadcasts' own table comment
-- says recipient Action instances are created UNCONDITIONALLY at issuance,
-- "regardless of whether the recipient has an account yet" (R12/§11) — but
-- actions.creator_profile_id is NOT NULL REFERENCES profiles(id). Those two
-- statements cannot both be true today: you cannot insert an actions row
-- that references a profiles row which doesn't exist yet.
--
-- R12 is explicit that nothing gets written to `profiles` until rudimentary
-- signup FULLY completes — no partial/pending profile row, ever. So the fix
-- has to live on `actions`, not by relaxing that rule on `profiles`.
--
-- Fix: creator_profile_id becomes nullable, but ONLY ever NULL for a
-- broadcast-recipient row that hasn't been claimed yet. Two new columns
-- carry what's needed to resolve the invite before a profile exists:
--   - recipient_email: who this instance is for, from the invite/email/QR
--   - claim_token: unique token embedded in the invite link/QR; the recipient
--     presents this once their rudimentary signup completes, and the claim
--     step sets creator_profile_id and clears the token.
-- A CHECK constraint keeps this narrow: any row NOT under a broadcast
-- (Path A / Path B worker-initiated) still requires creator_profile_id
-- NOT NULL, same as before — this only opens up the one case that needed it.
-- =============================================================================

ALTER TABLE actions
  ALTER COLUMN creator_profile_id DROP NOT NULL;

ALTER TABLE actions
  ADD COLUMN IF NOT EXISTS recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS claim_token UUID UNIQUE;

ALTER TABLE actions
  ADD CONSTRAINT actions_creator_or_pending_recipient CHECK (
    creator_profile_id IS NOT NULL
    OR (broadcast_id IS NOT NULL AND recipient_email IS NOT NULL AND claim_token IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_actions_claim_token ON actions(claim_token) WHERE claim_token IS NOT NULL;

COMMENT ON COLUMN actions.creator_profile_id IS
  'For Path A and Path B worker-initiated actions, this is the worker who created it — always NOT NULL for these paths (enforced by actions_creator_or_pending_recipient). For Path B evaluator-issued broadcast instances (§5a), this is the RECIPIENT — but is NULL until that recipient claims the instance via claim_token (R12: their profiles row cannot exist before rudimentary signup completes, so this column cannot be set before then either). Naming is potentially confusing across the two paths — flagged deliberately (see original comment history), not silently renamed.';

COMMENT ON COLUMN actions.recipient_email IS
  'Broadcast-recipient rows only (broadcast_id IS NOT NULL): who this pre-created instance is for, from the invite email/QR/link, before that recipient has a profiles row. NULL once claimed (creator_profile_id set) — kept only as long as the row is unclaimed, superseded by the profile relationship after that.';

COMMENT ON COLUMN actions.claim_token IS
  'Broadcast-recipient rows only: the token embedded in the invite link/QR. Presented back at /api/actions/[actionId]/claim once the recipient completes rudimentary signup (R12) to bind this row to their new profiles row. Cleared on successful claim.';

-- RLS: a broadcast recipient needs to be able to look up their own
-- not-yet-claimed instance by claim_token before they have a session tied to
-- creator_profile_id (they have no profile yet, so auth.uid() can't match
-- anything). This is a narrow, single-purpose lookup — same pattern as
-- profile_id_for_public_slug() in the v4 patch1 migration — rather than a
-- broad "anyone can read any unclaimed action" policy.
CREATE OR REPLACE FUNCTION public.action_for_claim_token(token UUID)
RETURNS TABLE (action_id UUID, action_title TEXT, recipient_email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT action_id, action_title, recipient_email
  FROM actions
  WHERE claim_token = token AND creator_profile_id IS NULL;
$$;

COMMENT ON FUNCTION public.action_for_claim_token IS
  'Narrow lookup for an unclaimed broadcast-recipient action by its invite token — used by the claim flow before the recipient has a profile/session. Returns nothing once claimed (creator_profile_id set).';

REVOKE ALL ON FUNCTION public.action_for_claim_token(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.action_for_claim_token(UUID) TO anon, authenticated;

-- Gap found while building the action-list endpoint: an evaluator assigned
-- via evaluator_assignments (Path A's "Request Evaluation" step) had no way
-- to read the `actions` row itself — only submissions/evaluations had
-- assignment-based read policies. Without this, an assigned evaluator's
-- action list silently returns nothing for that relationship.
DROP POLICY IF EXISTS "Assigned evaluators can view actions they're assigned to" ON actions;
CREATE POLICY "Assigned evaluators can view actions they're assigned to" ON actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM evaluator_assignments ea
      WHERE ea.action_id = actions.action_id AND ea.evaluator_profile_id = auth.uid()
    )
  );

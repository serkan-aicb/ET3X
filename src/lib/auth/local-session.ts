/**
 * Local demo session — the frozen build's stand-in for auth (no server).
 *
 * `signIn` records who is using the app (role + name) in BOTH localStorage (for
 * client reads via useLocalDraft) and a cookie (so `src/proxy.ts` can gate and
 * route by role at request time). It also seeds the R12 rudimentary profile
 * (email + organisation + function), so this single step satisfies the account
 * gate and supplies `evaluator_id` for evaluations.
 *
 * When Cyprian's backend lands, this is replaced by real Supabase auth — the
 * client factory (src/lib/supabase/client.ts) already supports it.
 */

import {
  DRAFT_KEYS,
  readDraft,
  writeDraft,
  clearDraft,
} from "@/lib/local-draft";
import type { RudimentaryProfile } from "@/lib/actions/types";
import {
  SESSION_COOKIE,
  encodeSessionCookie,
  type LocalSession,
  type SessionRole,
} from "./session-cookie";

export type { LocalSession, SessionRole };

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export type SignInInput = {
  role: SessionRole;
  name: string;
  email: string;
  organisation: string;
  function: string;
};

/** Start a demo session and seed the rudimentary profile (R12). */
export function signIn(input: SignInInput): LocalSession {
  const session: LocalSession = {
    role: input.role,
    name: input.name.trim(),
    email: input.email.trim(),
  };
  writeDraft<LocalSession>(DRAFT_KEYS.session, session);
  writeDraft<RudimentaryProfile>(DRAFT_KEYS.rudimentaryProfile, {
    email: input.email.trim(),
    organisation: input.organisation.trim(),
    function: input.function.trim(),
  });
  setCookie(SESSION_COOKIE, encodeSessionCookie(session));
  return session;
}

/** The current demo session, or null if not signed in. */
export function getSession(): LocalSession | null {
  return readDraft<LocalSession>(DRAFT_KEYS.session);
}

/** End the demo session. Leaves other drafts (actions, profile) untouched. */
export function signOut() {
  clearDraft(DRAFT_KEYS.session);
  clearCookie(SESSION_COOKIE);
}

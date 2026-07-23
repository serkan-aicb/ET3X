/**
 * Local draft persistence — the "database" for the Week-2/3 frozen frontend
 * build (grill decision: localStorage only; nothing net-new hits Supabase).
 *
 * Real persistence is backend-owned and lands later:
 *  - profile fields → TODO(cyprian): profiles/education/experience schema
 *  - actions        → TODO(cyprian): actions/evaluations schema
 * Swapping these helpers for API calls is the only change needed then.
 *
 * SSR-safe: reads guard `typeof window`. The `useLocalDraft` hook uses
 * useSyncExternalStore so client-only values hydrate without a mismatch and
 * without calling setState inside an effect.
 */

import { useSyncExternalStore } from "react";

export const DRAFT_KEYS = {
  onboardingDraft: "t3x.onboarding.draft",
  onboardingComplete: "t3x.onboarding.complete",
  actionInProgress: "t3x.action.inProgress", // the wizard's working draft
  actionsDrafts: "t3x.actions.drafts", // submitted actions (My Actions list)
  evaluationInvites: "t3x.evaluation.invites", // single-use invite tokens (stub)
  evaluations: "t3x.evaluations", // submitted evaluations (stub)
  profile: "t3x.profile", // owner-editable profile basics (name/headline/bio/avatar)
} as const;

/* ---- plain read/write (use outside React or in event handlers) -------- */

export function readDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeDraft<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    emit();
  } catch {
    // Quota or privacy-mode failures are non-fatal for a preview build.
  }
}

export function clearDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
    emit();
  } catch {
    /* no-op */
  }
}

export function isOnboardingComplete(): boolean {
  return readDraft<boolean>(DRAFT_KEYS.onboardingComplete) === true;
}

/* ---- reactive subscription (same-tab writes + cross-tab storage events) - */

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (typeof window !== "undefined") window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", cb);
  };
}

// Snapshot cache per key: useSyncExternalStore requires getSnapshot to return a
// stable reference until the underlying value actually changes, else it loops.
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function getSnapshot<T>(key: string, fallback: T): T {
  const raw =
    typeof window === "undefined" ? null : window.localStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  let value = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

/**
 * Read a localStorage-backed draft reactively. `fallback` must be a stable
 * reference (module constant or primitive). Server render + first hydration
 * use `fallback`; the client then switches to the stored value.
 */
export function useLocalDraft<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot<T>(key, fallback),
    () => fallback
  );
}

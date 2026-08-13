/**
 * Session cookie contract — the ONE thing shared between the client-side demo
 * session (src/lib/auth/local-session.ts) and the request-time gate (src/proxy.ts).
 *
 * Deliberately dependency-free (no React, no `window`) so it can be imported into
 * the proxy/middleware runtime. The frozen build has no real auth server; the
 * session is a small signed-nothing cookie holding role + display name so the
 * proxy can route by role and protect dashboard paths. TODO(cyprian): replace
 * with real Supabase auth when the backend is live (createClient still supports it).
 */

export const SESSION_COOKIE = "t3x.session";

export type SessionRole = "student" | "educator" | "admin" | "org_viewer" | "org_admin";

const ROLES: readonly SessionRole[] = [
  "student",
  "educator",
  "admin",
  "org_viewer",
  "org_admin",
];

export type LocalSession = {
  role: SessionRole;
  name: string;
  email?: string;
};

export function encodeSessionCookie(session: LocalSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

export function parseSessionCookie(
  value: string | undefined | null
): LocalSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as LocalSession;
    if (parsed && ROLES.includes(parsed.role) && typeof parsed.name === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

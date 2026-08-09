import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, parseSessionCookie } from '@/lib/auth/session-cookie'

// Public marketing pages — no authentication required
const PUBLIC_PATHS = new Set([
  '/',
  '/students',
  '/universities',
  '/how-it-works',
  '/partners',
  '/privacy-policy',
  '/terms-of-use',
  '/legal-notice',
])

const PUBLIC_PREFIXES = [
  '/auth',
  '/t/',
  '/p/',
  '/api',
  '/_next',
  '/edu',
  '/stud',
  '/design-system',
  '/design-lab',
  '/profile-studio-preview',
  '/onboarding-preview',
  // The invite link must resolve so the in-page account gate can render (v1.7
  // R12 / spec v6 §2): /evaluate and /receive stay public, but taking part requires
  // a rudimentary profile, gated in-page by <AccountGate>. Tokens are Cyprian's.
  '/evaluate',
  '/receive', // Path B recipient opens their issued action here (v6 §5a)
]

// Legacy pre-v1.6 surfaces (task / star-rating model), superseded by the v1.7/v6
// build. Quarantined: the files remain (reversible) but the routes redirect home
// so nothing reaches the old Supabase schema. NOT deleted — kept for reference and
// as the seed for the rebuilt org/evaluator surfaces (Phases 3–4).
const LEGACY_PREFIXES = [
  '/e/', // entire legacy educator tree (dashboard, tasks, profile, rate-all)
  '/s/tasks',
  '/s/my-tasks',
  '/s/collect-matriculation',
  '/submit',
  '/rating',
  '/professor',
  '/t/', // legacy shared-task landing
  '/admin/', // legacy platform admin (/admin/overview)
  '/admin-talent3x',
  '/admin-public',
]

// Frozen build: no auth server. Identity is a small cookie set by the demo
// sign-in (src/lib/auth/local-session.ts); the proxy reads it to route by role
// and to protect dashboard paths. Swaps back to Supabase auth cleanly when the
// backend lands (the client factory already supports it).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = parseSessionCookie(request.cookies.get(SESSION_COOKIE)?.value)

  // Quarantined legacy routes → home (which then routes a signed-in user on).
  if (LEGACY_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Logged-in users visiting marketing pages → their workspace. Only the
  // individual signs in during the frozen build (see src/app/auth/page.tsx).
  if (session && PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL('/s/dashboard', request.url))
  }

  // Allow public paths through without authentication
  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isPublic) {
    return NextResponse.next({ request })
  }

  // Protected routes: redirect unauthenticated users to the demo sign-in
  if (!session) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    redirectUrl.searchParams.set('redirect_to', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|pics|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

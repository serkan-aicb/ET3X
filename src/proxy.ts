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
  '/demo', // frozen-build demo control panel (seed / clear)
  // The invite link must resolve so the in-page account gate can render (v1.7
  // R12 / spec v6 §2): /evaluate and /receive stay public, but taking part requires
  // a rudimentary profile, gated in-page by <AccountGate>. Tokens are Cyprian's.
  '/evaluate',
  '/receive', // Path B recipient opens their issued action here (v6 §5a)
  '/propose', // Path B-5b evaluator reviews a worker's proposal here (v6 §5b)
]

// Retired pre-v1.6 surfaces (task / star-rating model), superseded by the v1.7/v6
// build. The files are DELETED (workspace doc 22, C4) — recoverable from the
// pushed tag `legacy-v1.6-task-model`. These prefixes stay only so stale links
// land home instead of 404: the legacy app was live at talent3x.com and share
// codes were handed to Oulu students, so old bookmarks and QR codes exist.
const RETIRED_PREFIXES = [
  '/e/', // legacy educator tree (dashboard, tasks, profile, rate-all)
  '/s/tasks',
  '/s/my-tasks',
  '/s/collect-matriculation',
  '/submit',
  '/rating',
  '/professor',
  '/t/', // legacy shared-task landing (share codes are still in the wild)
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

  // Retired legacy routes → home (which then routes a signed-in user on).
  if (RETIRED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Logged-in users visiting marketing pages → their workspace.
  if (session && PUBLIC_PATHS.has(pathname)) {
    const home =
      session.role === 'org_viewer' || session.role === 'org_admin'
        ? '/org/overview'
        : '/s/dashboard'
    return NextResponse.redirect(new URL(home, request.url))
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

  // The org area is for org roles only (admin ≠ analyst is enforced in-app).
  if (
    pathname.startsWith('/org') &&
    session.role !== 'org_viewer' &&
    session.role !== 'org_admin'
  ) {
    return NextResponse.redirect(new URL('/s/dashboard', request.url))
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|pics|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

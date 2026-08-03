import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Logged-in users visiting marketing pages → redirect to their dashboard
  if (user && PUBLIC_PATHS.has(pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (profile.role === 'student') {
        return NextResponse.redirect(new URL('/s/dashboard', request.url))
      } else if (profile.role === 'educator') {
        return NextResponse.redirect(new URL('/e/dashboard', request.url))
      } else if (profile.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/overview', request.url))
      }
    }
    return supabaseResponse
  }

  // Allow public paths through without authentication
  const isPublic =
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  if (isPublic) {
    return supabaseResponse
  }

  // Protected routes: redirect unauthenticated users to login
  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    redirectUrl.searchParams.set('redirect_to', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|pics|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Create a Supabase response that will handle auth cookie refresh
  const supabaseResponse = NextResponse.next({
    request,
  })

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

  // IMPORTANT: Avoid writing logic between createServerClient and
  // supabase.auth.getUser(). A mistake could cause random logout issues.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Handle root path redirection
  if (request.nextUrl.pathname === '/') {
    if (user) {
      // Check user role and redirect accordingly
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!error && profile) {
        if (profile.role === 'student') {
          return NextResponse.redirect(new URL('/s/dashboard', request.url))
        } else if (profile.role === 'educator') {
          return NextResponse.redirect(new URL('/e/dashboard', request.url))
        } else if (profile.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/overview', request.url))
        }
      }
    }
    return supabaseResponse
  }

  // Protected routes: redirect unauthenticated users to auth page
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/t/') &&
    !request.nextUrl.pathname.startsWith('/p/') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    request.nextUrl.pathname !== '/edu' &&
    request.nextUrl.pathname !== '/stud'
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    redirectUrl.searchParams.set('redirect_to', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|pics|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
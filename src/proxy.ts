import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Skip middleware for API routes and static files
  if (request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next()
  }
  
  // Handle root path redirection
  if (request.nextUrl.pathname === '/') {
    // Create a supabase client for server-side operations
    const supabase = await createServerClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
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
    
    // If not authenticated, continue to home page
    return NextResponse.next()
  }
  
  // For all other paths, continue normally
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
}
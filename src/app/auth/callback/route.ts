import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { encryptEmail } from '@/lib/crypto/email'
import { generateUsernameAndDID } from '@/lib/did/generator'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // Get redirect_to parameter to determine user role
  const redirectTo = searchParams.get('redirect_to')

  if (code) {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
    }
    
    if (!data?.user) {
      console.error('No user data received')
      return NextResponse.redirect(new URL('/?error=no_user', request.url))
    }
    
    try {
      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .single()
      
      if (profileError || !profile) {
        console.log('Creating new profile for user:', data.user.id)
        console.log('User data:', data.user)
        // Create profile for new user
        let role: 'student' | 'educator' = 'student'
        
        // Check if user came from educator login page by checking the redirect URL
        if (redirectTo && redirectTo.includes('/edu')) {
          role = 'educator'
        } 
        // Also check email domain as fallback
        else if (data.user.email?.endsWith('@edu.university.edu')) {
          role = 'educator'
        }
        // Check if email suggests educator role
        else if (data.user.email?.includes('edu') || 
                 data.user.email?.includes('prof') ||
                 data.user.email?.includes('faculty') ||
                 data.user.email?.includes('lecturer')) {
          role = 'educator'
        }
        
        // Encrypt email
        const { ciphertext, digest } = await encryptEmail(data.user.email || '')
        
        // Generate username and DID
        const { username, did } = generateUsernameAndDID(role)
        
        // Use service role client for profile creation to bypass RLS
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        // Create profile
        const profileData = {
          id: data.user.id,
          role,
          username,
          did,
          email_ciphertext: ciphertext,
          email_digest: digest
        };
        
        console.log('Attempting to create profile with data:', profileData);
        
        const { error: insertError } = await serviceSupabase
          .from('profiles')
          .insert(profileData)
        
        if (insertError) {
          console.error('Error creating profile:', insertError)
          console.error('Full error details:', JSON.stringify(insertError, null, 2))
          return NextResponse.redirect(new URL('/?error=profile_creation_failed', request.url))
        }
        console.log('Profile created successfully for user:', data.user.id)
      }
      
      // Redirect based on role
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      
      if (userError || !userData) {
        console.error('Error fetching user role:', userError)
        return NextResponse.redirect(new URL('/?error=user_fetch_failed', request.url))
      }
      
      const redirectPath = userData.role === 'student' 
        ? '/s/dashboard' 
        : userData.role === 'educator' 
          ? '/e/dashboard' 
          : '/admin/overview'
          
      console.log('Redirecting user to:', redirectPath)
      return NextResponse.redirect(new URL(redirectPath, request.url))
    } catch (err) {
      console.error('Unexpected error in auth callback:', err)
      return NextResponse.redirect(new URL('/?error=unexpected_error', request.url))
    }
  }

  // Return to home page with error
  return NextResponse.redirect(new URL('/?error=no_code', request.url))
}
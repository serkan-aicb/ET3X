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
  
  console.log('Auth callback triggered with code:', code);
  console.log('Redirect to:', redirectTo);

  if (code) {
    const supabase = await createServerClient()
    
    console.log('Created Supabase client, attempting to exchange code for session');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Exchange result - data:', data, 'error:', error);
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/?error=auth_failed&details=code_exchange_failed', request.url))
    }
    
    if (!data?.user) {
      console.error('No user data received')
      return NextResponse.redirect(new URL('/?error=no_user', request.url))
    }
    
    console.log('User authenticated:', data.user.id, data.user.email);
    
    try {
      // Check if user profile exists
      console.log('Checking for existing profile for user ID:', data.user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', data.user.id)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors when no record exists
      
      console.log('Profile check result - profile:', profile, 'error:', profileError);
      
      if (profileError) {
        console.error('Error checking for existing profile:', profileError)
        console.error('User ID:', data.user.id)
        console.error('User email:', data.user.email)
        // Log more details about the error
        if (profileError instanceof Error) {
          console.error('Error name:', profileError.name)
          console.error('Error message:', profileError.message)
          // Don't log stack trace in production
        }
        // Even if there's an error checking, we'll try to proceed and create the profile
        // This handles cases where the check fails but the insert might still work
      }
      
      // Try to create profile if it doesn't exist or if we couldn't determine existence
      if (!profile || profileError) {
        console.log('Attempting to create profile for user:', data.user.id)
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
        let ciphertext = '';
        let digest = '';
        
        try {
          const encryptedData = await encryptEmail(data.user.email || '');
          ciphertext = encryptedData.ciphertext;
          digest = encryptedData.digest;
        } catch (encryptError) {
          console.error('Error encrypting email:', encryptError);
          return NextResponse.redirect(new URL('/?error=profile_creation_failed&details=email_encryption_failed', request.url));
        }
        
        // Generate username and DID
        const { username, did } = generateUsernameAndDID(role)
        
        // Use service role client for profile creation to bypass RLS
        console.log('Creating service role client');
        console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        console.log('Service client created successfully');
        
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
        
        console.log('Profile insertion result - error:', insertError);
        
        if (insertError) {
          console.error('Error creating profile:', insertError)
          console.error('Full error details:', JSON.stringify(insertError, null, 2))
          console.error('Profile data that failed to insert:', JSON.stringify(profileData, null, 2))
          
          // Check if it's a conflict error (duplicate key)
          if (insertError.code === '23505') { // PostgreSQL unique violation
            console.log('Profile already exists despite check, continuing with normal flow');
            // Profile might have been created concurrently, continue with normal flow
          } else {
            return NextResponse.redirect(new URL('/?error=profile_creation_failed&details=insert_error', request.url))
          }
        } else {
          console.log('Profile created successfully for user:', data.user.id)
        }
      } else {
        console.log('User profile already exists:', data.user.id)
      }
      
      // Redirect based on role
      console.log('Fetching user role for redirection');
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      
      console.log('User role fetch result - data:', userData, 'error:', userError);
      
      if (userError || !userData) {
        console.error('Error fetching user role:', userError)
        // Try with service client as fallback
        try {
          const serviceSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          const { data: serviceUserData, error: serviceUserError } = await serviceSupabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()
            
          if (serviceUserError || !serviceUserData) {
            console.error('Error fetching user role with service client:', serviceUserError)
            return NextResponse.redirect(new URL('/?error=user_fetch_failed&details=both_clients_failed', request.url))
          }
          
          // Use service client data
          const redirectPath = serviceUserData.role === 'student' 
            ? '/s/dashboard' 
            : serviceUserData.role === 'educator' 
              ? '/e/dashboard' 
              : '/admin/overview'
              
          console.log('Redirecting user to:', redirectPath)
          return NextResponse.redirect(new URL(redirectPath, request.url))
        } catch (serviceError) {
          console.error('Error with service client approach:', serviceError)
          return NextResponse.redirect(new URL('/?error=user_fetch_failed&details=service_client_error', request.url))
        }
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
      // Log more details about the error
      if (err instanceof Error) {
        console.error('Error name:', err.name)
        console.error('Error message:', err.message)
        // Don't log stack trace in production
      }
      return NextResponse.redirect(new URL('/?error=unexpected_error', request.url))
    }
  }

  // Return to home page with error
  return NextResponse.redirect(new URL('/?error=no_code', request.url))
}
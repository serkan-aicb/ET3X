import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { encryptEmail } from '@/lib/crypto/email';
import { generateUsernameAndDID } from '@/lib/did/generator';

export async function POST(request: Request) {
  try {
    const { userId, email, role } = await request.json();

    if (!userId || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role !== 'student' && role !== 'educator') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if profile already exists
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingProfile } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ message: 'Profile already exists' }, { status: 200 });
    }

    // Encrypt email
    const encryptedData = await encryptEmail(email);
    const { username, did } = generateUsernameAndDID(role as 'student' | 'educator');

    // Create profile using service role client (bypasses RLS)
    const { error: insertError } = await serviceSupabase
      .from('profiles')
      .insert({
        id: userId,
        role,
        username,
        did,
        email_ciphertext: encryptedData.ciphertext,
        email_digest: encryptedData.digest,
      });

    if (insertError) {
      // Handle duplicate key gracefully
      if (insertError.code === '23505') {
        return NextResponse.json({ message: 'Profile already exists (concurrent creation)' }, { status: 200 });
      }
      console.error('Error creating profile:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Profile created successfully', username }, { status: 200 });
  } catch (err) {
    console.error('Signup API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
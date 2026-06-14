import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch public-safe profile fields by public_slug
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, real_name, headline, bio, avatar_url, public_slug, role, updated_at')
      .eq('public_slug', slug)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Return only public-safe fields
    return NextResponse.json({
      username: profile.username,
      real_name: profile.real_name,
      headline: profile.headline,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      public_slug: profile.public_slug,
      role: profile.role,
      updated_at: profile.updated_at,
    });
  } catch (err) {
    console.error('Error fetching public profile:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

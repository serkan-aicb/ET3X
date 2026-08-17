import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

// POST /api/actions/[actionId]/claim
//
// A broadcast recipient (§5a) presents their claim_token (from the invite
// link/QR/email) once their rudimentary signup has completed, binding the
// pre-created Action instance to their new profiles row. Depends on
// schema-v6-broadcast-claim.sql.
//
// This does NOT run the account gate itself — that's /api/auth/signup's
// job. This endpoint requires the caller to already have a session AND a
// completed profiles row; if either is missing it fails rather than trying
// to do signup inline, keeping the two concerns separate.
//
// Body: { claim_token: string }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ actionId: string }> }
) {
  const { actionId } = await params;

  try {
    const { claim_token } = await request.json();

    if (!claim_token) {
      return NextResponse.json({ error: 'claim_token is required' }, { status: 400 });
    }

    const sessionSupabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking profile:', profileError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    if (!profile) {
      return NextResponse.json(
        { error: 'Rudimentary profile required before claiming this action (R12)' },
        { status: 403 }
      );
    }

    const { data: action, error: actionError } = await supabase
      .from('actions')
      .select('action_id, claim_token, creator_profile_id')
      .eq('action_id', actionId)
      .maybeSingle();

    if (actionError) {
      console.error('Error loading action for claim:', actionError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    if (action.creator_profile_id) {
      return NextResponse.json({ error: 'This action has already been claimed' }, { status: 409 });
    }
    if (action.claim_token !== claim_token) {
      return NextResponse.json({ error: 'Invalid claim token' }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from('actions')
      .update({
        creator_profile_id: user.id,
        recipient_email: null,
        claim_token: null,
        // status intentionally untouched — the row was created 'Locked'
        // (read-only, §5a step 5) and claiming doesn't change that; a
        // previous version of this endpoint reset status to 'Draft' here,
        // which would have let the newly-claimed recipient edit
        // Title/Description/Skills via skills/route.ts's Draft-only check.
      })
      .eq('action_id', actionId);

    if (updateError) {
      console.error('Error claiming action:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Action claimed', action_id: actionId }, { status: 200 });
  } catch (err) {
    console.error('Claim API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

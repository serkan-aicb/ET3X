import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/actions/[actionId]
//
// Single action detail. RLS scopes what's readable (creator, assigned
// evaluator, or broadcast-issuing evaluator — see schema-v6 for the newest
// of those policies). read_only is computed here for the frontend rather
// than stored, per the existing actions.broadcast_id comment: broadcast
// recipients cannot edit Title/Description/Skills, and there's deliberately
// no separate is_locked flag for this specific restriction — check
// broadcast_id IS NOT NULL instead (§5a step 5).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ actionId: string }> }
) {
  const { actionId } = await params;

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: action, error } = await supabase
      .from('actions')
      .select(
        `
        action_id,
        creator_profile_id,
        broadcast_id,
        action_title,
        description,
        expected_outcome,
        ai_involvement,
        difficulty_declared,
        evidence_note,
        evidence_link,
        evidence_files,
        evidence_storage_mode,
        org_visibility,
        status,
        decline_reason,
        created_at,
        action_skills (
          skill_id,
          capability_id_resolved,
          skills (name:label, description)
        )
      `
      )
      .eq('action_id', actionId)
      .maybeSingle();

    if (error) {
      console.error('Error loading action:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    if (!action) {
      // Row exists but RLS hid it, or it genuinely doesn't exist — same 404
      // either way, deliberately not distinguishing (avoid leaking row
      // existence to a caller who isn't allowed to see it).
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        ...action,
        read_only: action.broadcast_id !== null && action.creator_profile_id === user.id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Action detail API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

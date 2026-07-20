import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ actionId: string }> };

// GET /api/actions/[actionId]
export async function GET(request: Request, { params }: RouteParams) {
  const { actionId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('actions')
    .select(`
      id, creator_profile_id, action_title, description, expected_outcome,
      ai_involvement, difficulty_declared, org_visibility, status, due_date, created_at,
      action_skills ( id, skill_id, capability_id_resolved, skills ( label, description ) ),
      evaluator_assignments ( id, evaluator_profile_id, evaluator_email, invitation_status, invited_at, completed_at )
    `)
    .eq('id', actionId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ action: data }, { status: 200 });
}

// PATCH /api/actions/[actionId] — update fields and/or transition status
// CONFIRMED (feedback received 20 July 2026): Draft -> Submitted -> Evaluated
// -> Verified. 'Shared' is dropped entirely — sharing/visibility is handled
// separately via org_visibility consent, not via a status value or transition.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Draft: ['Submitted'],
  Submitted: ['Evaluated'],
  Evaluated: ['Verified'],
  Verified: [],
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const { actionId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('actions')
    .select('id, creator_profile_id, status, difficulty_declared')
    .eq('id', actionId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  }
  if (existing.creator_profile_id !== user.id) {
    return NextResponse.json({ error: 'Only the creator can update this action' }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  // Only allow known-safe fields to be patched. difficulty_declared and
  // ai_involvement can be edited pre-submission; status goes through the
  // transition check below rather than being set directly.
  if (body.action_title !== undefined) updates.action_title = body.action_title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.expected_outcome !== undefined) updates.expected_outcome = body.expected_outcome;
  if (body.difficulty_declared !== undefined) updates.difficulty_declared = body.difficulty_declared;
  if (body.ai_involvement !== undefined) updates.ai_involvement = body.ai_involvement;
  if (body.org_visibility !== undefined) updates.org_visibility = body.org_visibility;
  if (body.due_date !== undefined) updates.due_date = body.due_date;

  if (body.status !== undefined) {
    const currentStatus = existing.status;
    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(body.status)) {
      return NextResponse.json(
        { error: `Cannot transition from '${currentStatus}' to '${body.status}'. Allowed: ${allowedNext.join(', ') || 'none'}` },
        { status: 400 }
      );
    }
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('actions')
    .update(updates)
    .eq('id', actionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action: data }, { status: 200 });
}

// DELETE /api/actions/[actionId]
// CONFIRMED (feedback received 20 July 2026): hard-delete is only allowed
// for Draft-only actions. This was a conservative guard before confirmation
// and is now the confirmed rule, not an assumption. Since evaluations can
// only exist once an action has moved past Draft, the Draft-only guard
// below already prevents deleting an action that has any evaluations.
export async function DELETE(request: Request, { params }: RouteParams) {
  const { actionId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from('actions')
    .select('id, creator_profile_id, status')
    .eq('id', actionId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  }
  if (existing.creator_profile_id !== user.id) {
    return NextResponse.json({ error: 'Only the creator can delete this action' }, { status: 403 });
  }
  if (existing.status !== 'Draft') {
    // Conservative guard: don't allow deleting actions that have moved past
    // Draft, since evaluators/evidence may already reference them.
    return NextResponse.json({ error: 'Only actions in Draft status can be deleted' }, { status: 400 });
  }

  const { error } = await supabase.from('actions').delete().eq('id', actionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
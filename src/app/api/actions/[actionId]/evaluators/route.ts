import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createServerClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ actionId: string }> };

// GET /api/actions/[actionId]/evaluators — list assignments for an action
export async function GET(request: Request, { params }: RouteParams) {
  const { actionId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('evaluator_assignments')
    .select('id, evaluator_profile_id, evaluator_email, evaluator_role, evaluator_relationship, invitation_status, invited_at, completed_at')
    .eq('action_id', actionId)
    .order('invited_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ evaluator_assignments: data }, { status: 200 });
}

// POST /api/actions/[actionId]/evaluators — invite an evaluator
//
// Accepts either evaluator_profile_id (existing platform user) or
// evaluator_email (invite someone without an account yet — matches the
// evaluator_profile_id nullable design in the schema).
//
// R6: evaluator_id must not equal the action creator (no self-evaluation).
// The DB trigger enforces this on the evaluations table itself, but it's
// worth rejecting an obviously-self-referential INVITE early too, since a
// creator inviting themselves as an evaluator should be caught here rather
// than failing much later at evaluation submission time.
//
// NEW: Draft -> Proposed/Submitted status transition. Nothing previously
// moved an action out of 'Draft' — this was a real gap, not a stale
// comment. Distinguishing Path A (work already done, requesting
// evaluation) from Path B-5b (work not yet done, evaluator decides
// first) can't be read off this call alone; the signal used here is
// whether the action already carries evidence — Path A requires evidence
// before "Request Evaluation" (flow spec §4 step 6), Path B-5b never has
// evidence yet at this point (work hasn't happened). This is a judgment
// call resolving an otherwise-unaddressed gap, not a previously-confirmed
// rule — flagging for a look rather than presenting it as settled:
//   - Evidence present  -> status = 'Submitted' (Path A)
//   - No evidence yet   -> status = 'Proposed'  (Path B-5b, awaiting
//                          evaluator's accept/adjust/decline)
// Only applied when the action is currently 'Draft' — re-inviting after a
// decline, or inviting an additional evaluator later, must not clobber a
// status that has already moved on.
export async function POST(request: Request, { params }: RouteParams) {
  const { actionId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: action, error: actionError } = await supabase
    .from('actions')
    .select('action_id, creator_profile_id, status, evidence_note, evidence_link, evidence_files')
    .eq('action_id', actionId)
    .single();

  if (actionError || !action) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  }
  if (action.creator_profile_id !== user.id) {
    return NextResponse.json({ error: 'Only the creator can invite evaluators for this action' }, { status: 403 });
  }

  const body = await request.json();
  const { evaluator_profile_id, evaluator_email, evaluator_role, evaluator_relationship } = body;

  if (!evaluator_profile_id && !evaluator_email) {
    return NextResponse.json({ error: 'evaluator_profile_id or evaluator_email is required' }, { status: 400 });
  }
  if (evaluator_profile_id === user.id) {
    return NextResponse.json({ error: 'Cannot invite yourself as an evaluator (R6: no self-evaluation)' }, { status: 400 });
  }
  if (!evaluator_role) {
    return NextResponse.json({ error: 'evaluator_role is required' }, { status: 400 });
  }
  if (!evaluator_relationship) {
    return NextResponse.json({ error: 'evaluator_relationship is required' }, { status: 400 });
  }

  const invitationToken = randomBytes(24).toString('hex');

  const { data, error } = await supabase
    .from('evaluator_assignments')
    .insert({
      action_id: actionId,
      evaluator_profile_id: evaluator_profile_id ?? null,
      evaluator_email: evaluator_email ?? null,
      evaluator_role,
      evaluator_relationship,
      invitation_status: 'Sent',
      invitation_token: invitationToken,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action.status === 'Draft') {
    const hasEvidence = Boolean(action.evidence_note || action.evidence_link || action.evidence_files);
    const nextStatus = hasEvidence ? 'Submitted' : 'Proposed';

    const { error: statusError } = await supabase
      .from('actions')
      .update({ status: nextStatus })
      .eq('action_id', actionId);

    if (statusError) {
      // The assignment already exists at this point — surface a 207 rather
      // than implying the whole request failed.
      return NextResponse.json(
        { evaluator_assignment: data, warning: `Assignment created but status transition to ${nextStatus} failed` },
        { status: 207 }
      );
    }
  }

  // FLAG: actual invite delivery (email send, share link/QR generation) is
  // not implemented here — this endpoint only creates the assignment
  // record + token. Wiring up delivery is a separate piece of Week 2 scope
  // ("Share Link Generation", "QR Code Generation" per the original
  // briefing) not yet built.
  return NextResponse.json({ evaluator_assignment: data }, { status: 201 });
}

// PATCH /api/actions/[actionId]/evaluators — update invitation status
// (opened / accepted / declined). Completion (`Completed`) should be set by
// the evaluation-submission flow itself once that's built, not by this
// endpoint directly — flagged for Week 4 (Evaluation Engine) to wire up.
export async function PATCH(request: Request, { params }: RouteParams) {
  const { actionId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { assignment_id, invitation_status } = body;

  if (!assignment_id || !invitation_status) {
    return NextResponse.json({ error: 'assignment_id and invitation_status are required' }, { status: 400 });
  }

  const ALLOWED_STATUSES = ['Sent', 'Opened', 'Accepted', 'Declined']; // 'Completed' excluded — see note above
  if (!ALLOWED_STATUSES.includes(invitation_status)) {
    return NextResponse.json({ error: `invitation_status must be one of: ${ALLOWED_STATUSES.join(', ')}` }, { status: 400 });
  }

  const { data: assignment, error: fetchError } = await supabase
    .from('evaluator_assignments')
    .select('id, evaluator_profile_id, action_id')
    .eq('id', assignment_id)
    .eq('action_id', actionId)
    .single();

  if (fetchError || !assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }
  if (assignment.evaluator_profile_id !== user.id) {
    return NextResponse.json({ error: 'Only the invited evaluator can update this assignment' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('evaluator_assignments')
    .update({ invitation_status })
    .eq('id', assignment_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ evaluator_assignment: data }, { status: 200 });
}

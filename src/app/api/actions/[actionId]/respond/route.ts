import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

// POST /api/actions/[actionId]/respond
//
// Path B §5b: a Worker-created action sits at status 'Proposed' until the
// named Evaluator responds. §6's decline design applies here — one click,
// optional reason, no negotiation thread. Once locked (accept or adjust),
// the action is final on both sides — no further edits (§5b step 3).
//
// This endpoint is for the PRE-WORK decision point only. The Evaluator's
// post-work decision to decline evaluating submitted evidence (§7 step 3)
// is a different decision on an already-locked, already-submitted action —
// not built here; flagged as a follow-up, adjacent to the
// evaluation-submission endpoint rather than this one.
//
// Body:
//   { decision: 'accept' }
//   { decision: 'adjust', title?: string, description?: string, skill_ids?: string[] }
//   { decision: 'decline', reason?: string }   // reason is NEVER required
export async function POST(
  request: Request,
  { params }: { params: Promise<{ actionId: string }> }
) {
  const { actionId } = await params;

  try {
    const body = await request.json();
    const { decision } = body;

    if (!['accept', 'adjust', 'decline'].includes(decision)) {
      return NextResponse.json({ error: "decision must be 'accept', 'adjust', or 'decline'" }, { status: 400 });
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

    const { data: assignment, error: assignmentError } = await supabase
      .from('evaluator_assignments')
      .select('id')
      .eq('action_id', actionId)
      .eq('evaluator_profile_id', user.id)
      .maybeSingle();

    if (assignmentError) {
      console.error('Error checking evaluator_assignment:', assignmentError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not the evaluator on record for this action' },
        { status: 403 }
      );
    }

    const { data: action, error: actionError } = await supabase
      .from('actions')
      .select('action_id, status, broadcast_id')
      .eq('action_id', actionId)
      .maybeSingle();

    if (actionError) {
      console.error('Error loading action:', actionError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    if (action.broadcast_id) {
      return NextResponse.json(
        { error: 'This endpoint is for Path B worker-initiated actions, not broadcast-issued instances' },
        { status: 400 }
      );
    }
    if (action.status !== 'Proposed') {
      return NextResponse.json(
        { error: `Action is not awaiting a response (status: ${action.status})` },
        { status: 409 }
      );
    }

    if (decision === 'decline') {
      const { reason } = body;
      const { error: updateError } = await supabase
        .from('actions')
        .update({ status: 'Declined', decline_reason: reason ?? null })
        .eq('action_id', actionId);

      if (updateError) {
        console.error('Error declining action:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      await supabase
        .from('evaluator_assignments')
        .update({ invitation_status: 'Declined' })
        .eq('id', assignment.id);

      return NextResponse.json({ message: 'Action declined', action_id: actionId }, { status: 200 });
    }

    // accept & lock, or adjust & lock — both lock the action; adjust also
    // updates title/description/skills first (§5b step 2).
    const updates: Record<string, unknown> = { status: 'Locked' };

    if (decision === 'adjust') {
      const { title, description, skill_ids } = body;
      if (title) updates.action_title = title;
      if (description) updates.description = description;

      if (Array.isArray(skill_ids) && skill_ids.length > 0) {
        const { data: skillRows, error: skillError } = await supabase
          .from('skills')
          .select('skill_id, capability_id')
          .in('skill_id', skill_ids);

        if (skillError) {
          console.error('Error resolving skills for adjust:', skillError);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }

        const resolvedIds = new Set((skillRows ?? []).map((s) => s.skill_id));
        const missing = skill_ids.filter((id: string) => !resolvedIds.has(id));
        if (missing.length > 0) {
          return NextResponse.json({ error: `Unknown skill_id(s): ${missing.join(', ')}` }, { status: 400 });
        }

        // Adjust replaces the skill selection entirely — delete + reinsert
        // rather than diff, since this is a pre-work, pre-lock edit (R4's
        // snapshot concern is about post-lock history, which doesn't exist
        // yet at this point).
        const { error: deleteError } = await supabase.from('action_skills').delete().eq('action_id', actionId);
        if (deleteError) {
          console.error('Error clearing action_skills for adjust:', deleteError);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }

        const actionSkillRows = (skillRows ?? []).map((s) => ({
          action_id: actionId,
          skill_id: s.skill_id,
          capability_id_resolved: s.capability_id,
        }));
        const { error: insertError } = await supabase.from('action_skills').insert(actionSkillRows);
        if (insertError) {
          console.error('Error reinserting action_skills for adjust:', insertError);
          return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
      }
    }

    const { error: updateError } = await supabase.from('actions').update(updates).eq('action_id', actionId);

    if (updateError) {
      console.error('Error locking action:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase
      .from('evaluator_assignments')
      .update({ invitation_status: 'Accepted' })
      .eq('id', assignment.id);

    return NextResponse.json({ message: `Action ${decision === 'adjust' ? 'adjusted and' : ''} locked`, action_id: actionId }, { status: 200 });
  } catch (err) {
    console.error('Respond API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

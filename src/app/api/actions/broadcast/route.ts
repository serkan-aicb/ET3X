import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

// POST /api/actions/broadcast
//
// Path B §5a: an Evaluator issues one action-template to many recipients at
// once (single Worker, multiple emails, an org unit, or a self-enrol
// link/QR — all three funnel through `recipient_emails` here; org-unit
// expansion to member emails is assumed to happen client-side or in a
// follow-up pass, not built here).
//
// Depends on schema-v6-broadcast-claim.sql — actions.creator_profile_id is
// nullable specifically for this path, with recipient_email + claim_token
// carrying the pending state until each recipient's own rudimentary signup
// completes (R12/§11). See that migration's header before treating this as
// final.
//
// Body:
// {
//   title: string,
//   description: string,
//   skill_ids: string[],
//   recipient_emails: string[]   // one Action instance created per email
// }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, skill_ids, recipient_emails } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'title and description are required' }, { status: 400 });
    }
    if (!Array.isArray(skill_ids) || skill_ids.length === 0) {
      return NextResponse.json({ error: 'skill_ids must be a non-empty array' }, { status: 400 });
    }
    if (!Array.isArray(recipient_emails) || recipient_emails.length === 0) {
      return NextResponse.json({ error: 'recipient_emails must be a non-empty array' }, { status: 400 });
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

    // R12 account gate applies to the initiator (the Evaluator) too.
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
        { error: 'Rudimentary profile required before issuing an action (R12)' },
        { status: 403 }
      );
    }

    const { data: skillRows, error: skillError } = await supabase
      .from('skills')
      .select('skill_id, capability_id')
      .in('skill_id', skill_ids);

    if (skillError) {
      console.error('Error resolving skills:', skillError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const resolvedIds = new Set((skillRows ?? []).map((s) => s.skill_id));
    const missing = skill_ids.filter((id: string) => !resolvedIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json({ error: `Unknown skill_id(s): ${missing.join(', ')}` }, { status: 400 });
    }

    const { data: broadcast, error: broadcastError } = await supabase
      .from('action_broadcasts')
      .insert({
        evaluator_profile_id: user.id,
        action_title: title,
        description,
        action_skills_template: skill_ids,
      })
      .select('id')
      .single();

    if (broadcastError || !broadcast) {
      console.error('Error creating action_broadcast:', broadcastError);
      return NextResponse.json({ error: broadcastError?.message ?? 'Insert failed' }, { status: 500 });
    }

    // NOTE: profiles has no email column (email lives on auth.users, not
    // mirrored here) — there is currently no server-side way to look up "does
    // a profile already exist for this email" from the profiles table alone.
    // Every recipient is therefore treated as profile-less at issuance for
    // now (claim_token path for all), which is always CORRECT per R12 even
    // when a recipient does already have an account — they'll just claim
    // immediately since their existing session already has a profile. This
    // is a minor inefficiency (an extra claim step for already-registered
    // recipients), not a correctness bug — flagging rather than building an
    // auth.users email lookup via the service role here without checking if
    // that's the right layer for it.

    const recipientRows = recipient_emails.map((email: string) => ({
      broadcast_id: broadcast.id,
      creator_profile_id: null,
      recipient_email: email,
      claim_token: crypto.randomUUID(),
      action_title: title,
      description,
      expected_outcome: 'See task details', // Path B-5a has no per-recipient Expected Outcome field in the spec — template-level only. Flagged: confirm with André whether this needs to be a real field on the template.
      ai_involvement: 'none', // Evaluator-issued instances don't declare ai_involvement at issuance (that's the WORKER's attribute, R3/R5, declared by whoever does the work) — placeholder until the recipient sets it themselves. Flagging: R5 says "every action requires ai_involvement at creation" — this placeholder may need a real answer from André on when a broadcast-recipient instance actually satisfies R5.
      status: 'Locked', // NOT 'Draft' — corrected after reviewing skills/route.ts's DELETE handler: skill selection is only blocked once status leaves 'Draft'. A broadcast recipient IS creator_profile_id after claiming, so 'Draft' would let them bypass "read only, cannot modify Title/Description/Skills" (§5a step 5) via the ownership check. 'Locked' matches that read-only requirement from the moment the instance is created, before any claim happens.
    }));

    const { data: insertedActions, error: actionsError } = await supabase
      .from('actions')
      .insert(recipientRows)
      .select('action_id, recipient_email, claim_token');

    if (actionsError) {
      console.error('Error creating recipient actions:', actionsError);
      return NextResponse.json(
        { message: 'Broadcast created but recipient instances failed to save', broadcast_id: broadcast.id },
        { status: 207 }
      );
    }

    const actionSkillRows = (insertedActions ?? []).flatMap((a) =>
      (skillRows ?? []).map((s) => ({
        action_id: a.action_id,
        skill_id: s.skill_id,
        capability_id_resolved: s.capability_id,
      }))
    );

    const { error: actionSkillsError } = await supabase.from('action_skills').insert(actionSkillRows);

    if (actionSkillsError) {
      console.error('Error creating action_skills for broadcast recipients:', actionSkillsError);
      return NextResponse.json(
        { message: 'Broadcast created but skill selection failed to save for recipients', broadcast_id: broadcast.id },
        { status: 207 }
      );
    }

    return NextResponse.json(
      {
        broadcast_id: broadcast.id,
        recipients: (insertedActions ?? []).map((a) => ({
          action_id: a.action_id,
          recipient_email: a.recipient_email,
          claim_token: a.claim_token, // caller uses this to build the invite link/QR
        })),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Broadcast creation API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

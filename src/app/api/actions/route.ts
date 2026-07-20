import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// GET /api/actions — list + filter
// Supports filters per Week 2 spec: capability, status, contributor, evaluator.
// CONFIRMED status values (feedback received 20 July 2026): Draft, Submitted,
// Evaluated, Verified. 'Shared' was dropped — sharing is handled via
// org_visibility consent, not a status value. This route still accepts
// whatever string is passed through and lets the DB CHECK/enum constraint
// reject invalid values, rather than hardcoding a duplicate list here.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const capabilityId = searchParams.get('capability_id');
  const status = searchParams.get('status');
  const contributorId = searchParams.get('contributor_id');
  const evaluatorId = searchParams.get('evaluator_id');

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase
    .from('actions')
    .select(`
      id, creator_profile_id, action_title, description, expected_outcome,
      ai_involvement, difficulty_declared, org_visibility, status, due_date, created_at,
      action_skills ( id, skill_id, capability_id_resolved )
    `);

  if (status) {
    query = query.eq('status', status);
  }

  if (contributorId) {
    query = query.eq('creator_profile_id', contributorId);
  }

  if (capabilityId) {
    // Filter to actions that have at least one action_skills row resolving
    // to this capability. Supabase/PostgREST doesn't support a clean nested
    // filter here, so this uses a subquery via .in() on a pre-fetched id list.
    const { data: matchingActionSkills } = await supabase
      .from('action_skills')
      .select('action_id')
      .eq('capability_id_resolved', capabilityId);
    const actionIds = (matchingActionSkills || []).map((row) => row.action_id);
    if (actionIds.length === 0) {
      return NextResponse.json({ actions: [] }, { status: 200 });
    }
    query = query.in('id', actionIds);
  }

  if (evaluatorId) {
    // Filter to actions where this evaluator has an assignment.
    const { data: matchingAssignments } = await supabase
      .from('evaluator_assignments')
      .select('action_id')
      .eq('evaluator_profile_id', evaluatorId);
    const actionIds = (matchingAssignments || []).map((row) => row.action_id);
    if (actionIds.length === 0) {
      return NextResponse.json({ actions: [] }, { status: 200 });
    }
    query = query.in('id', actionIds);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ actions: data }, { status: 200 });
}

// POST /api/actions — create
// ai_involvement and org_visibility are required per R5/R10 — this route
// enforces that at the API layer in addition to the DB's NOT NULL constraint,
// so callers get a clear 400 rather than a raw Postgres error.
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    action_title,
    description,
    expected_outcome,
    ai_involvement,
    difficulty_declared,
    org_visibility,
    due_date,
  } = body;

  if (!action_title) {
    return NextResponse.json({ error: 'action_title is required' }, { status: 400 });
  }
  if (!ai_involvement) {
    // R5: every action requires ai_involvement at creation, no exceptions.
    return NextResponse.json({ error: 'ai_involvement is required (R5)' }, { status: 400 });
  }
  if (!org_visibility) {
    // R10: consent must be an explicit choice made by the individual, not a
    // silent default — reject rather than assume.
    return NextResponse.json({ error: 'org_visibility is required (R10) — must be an explicit consent choice' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('actions')
    .insert({
      creator_profile_id: user.id,
      action_title,
      description: description ?? null,
      expected_outcome: expected_outcome ?? null,
      ai_involvement,
      difficulty_declared: difficulty_declared ?? null,   // creator-declared only; never used in scoring (R9)
      org_visibility,
      due_date: due_date ?? null,
      status: 'Draft', // Confirmed initial status per resolved action_status enum
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action: data }, { status: 201 });
}
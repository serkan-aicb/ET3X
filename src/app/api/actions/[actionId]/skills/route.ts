import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

type RouteParams = { params: Promise<{ actionId: string }> };

// GET /api/actions/[actionId]/skills
export async function GET(request: Request, { params }: RouteParams) {
  const { actionId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('action_skills')
    .select(`
      id, skill_id, capability_id_resolved, created_at,
      skills ( label, description ),
      capabilities:capability_id_resolved ( name, description )
    `)
    .eq('action_id', actionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action_skills: data }, { status: 200 });
}

// POST /api/actions/[actionId]/skills — assign one or more skills to an action
//
// Implements R4: the skill's capability is RESOLVED AND SNAPSHOTTED at
// selection time, into capability_id_resolved. This value must never be
// recomputed or overwritten later, even if the skill->capability mapping
// changes in a future framework version — that's the entire point of R4
// (historical evidence keeps the mapping that was true when created).
//
// Accepts either a single { skill_id } or a batch { skill_ids: [...] }.
export async function POST(request: Request, { params }: RouteParams) {
  const { actionId } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Confirm the action exists and belongs to the caller.
  const { data: action, error: actionError } = await supabase
    .from('actions')
    .select('id, creator_profile_id, status')
    .eq('id', actionId)
    .single();

  if (actionError || !action) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  }
  if (action.creator_profile_id !== user.id) {
    return NextResponse.json({ error: 'Only the creator can assign skills to this action' }, { status: 403 });
  }

  const body = await request.json();
  const skillIds: string[] = body.skill_ids ?? (body.skill_id ? [body.skill_id] : []);

  if (skillIds.length === 0) {
    return NextResponse.json({ error: 'skill_id or skill_ids is required' }, { status: 400 });
  }

  // R7: dormant-scope capabilities/skills must be hidden from every picker
  // and individual-facing view. Enforce this at the write path too, not
  // just in the UI — reject selection of a skill whose capability is dormant.
  const { data: skillRows, error: skillLookupError } = await supabase
    .from('skills')
    .select('skill_id, capability_id, capabilities ( activation_scope )')
    .in('skill_id', skillIds);

  if (skillLookupError) {
    return NextResponse.json({ error: skillLookupError.message }, { status: 500 });
  }

  const foundIds = new Set((skillRows || []).map((r) => r.skill_id));
  const missing = skillIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    return NextResponse.json({ error: `Unknown skill_id(s): ${missing.join(', ')}` }, { status: 400 });
  }

  type SkillLookupRow = { skill_id: string; capability_id: string; capabilities: { activation_scope: string } | { activation_scope: string }[] };
  const dormant = (skillRows as SkillLookupRow[] || []).filter((r) => {
    const cap = Array.isArray(r.capabilities) ? r.capabilities[0] : r.capabilities;
    return cap?.activation_scope === 'dormant';
  });
  if (dormant.length > 0) {
    return NextResponse.json(
      { error: `Cannot select dormant-scope skill(s) (R7): ${dormant.map((r) => r.skill_id).join(', ')}` },
      { status: 400 }
    );
  }

  // Build the snapshot rows: capability_id_resolved is fixed NOW, from the
  // skill's CURRENT capability_id — this is the one and only moment this
  // value is ever set.
  const rowsToInsert = (skillRows as SkillLookupRow[]).map((r) => ({
    action_id: actionId,
    skill_id: r.skill_id,
    capability_id_resolved: r.capability_id,
  }));

  const { data, error } = await supabase
    .from('action_skills')
    .insert(rowsToInsert)
    .select();

  if (error) {
    // unique_action_skill will fire on duplicate (action_id, skill_id) pairs
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ action_skills: data }, { status: 201 });
}

// DELETE /api/actions/[actionId]/skills?skill_id=SK-001
// Removing a skill selection is allowed pre-submission; this does NOT
// affect capability_id_resolved on any OTHER already-assigned skill (each
// row's snapshot is independent).
export async function DELETE(request: Request, { params }: RouteParams) {
  const { actionId } = await params;
  const { searchParams } = new URL(request.url);
  const skillId = searchParams.get('skill_id');

  if (!skillId) {
    return NextResponse.json({ error: 'skill_id query param is required' }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: action, error: actionError } = await supabase
    .from('actions')
    .select('id, creator_profile_id, status')
    .eq('id', actionId)
    .single();

  if (actionError || !action) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 });
  }
  if (action.creator_profile_id !== user.id) {
    return NextResponse.json({ error: 'Only the creator can modify skills on this action' }, { status: 403 });
  }
  if (action.status !== 'Draft') {
    // FLAG: conservative guard — once an action has been shared/submitted,
    // changing its skill selection retroactively could be confusing for
    // evaluators mid-flow. Confirm this restriction is actually desired.
    return NextResponse.json({ error: 'Skills can only be modified while the action is in Draft status' }, { status: 400 });
  }

  const { error } = await supabase
    .from('action_skills')
    .delete()
    .eq('action_id', actionId)
    .eq('skill_id', skillId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
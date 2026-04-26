import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shareCode = searchParams.get('share_code');

  if (!shareCode) {
    return NextResponse.json({ error: 'Missing share_code parameter' }, { status: 400 });
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: task, error } = await serviceSupabase
    .from('tasks')
    .select('id, title, module, description, skill_level, due_date, is_requestable, is_active, share_code, status')
    .eq('share_code', shareCode)
    .single();

  if (error || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (!task.is_requestable || !task.is_active) {
    return NextResponse.json({ error: 'This task is not currently accepting requests', is_active: task.is_active }, { status: 403 });
  }

  return NextResponse.json({ task }, { status: 200 });
}
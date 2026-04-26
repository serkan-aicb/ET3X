import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('file_id');

    if (!fileId) {
      return NextResponse.json({ error: 'Missing file_id parameter' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get file metadata
    const { data: fileRecord, error: fileError } = await serviceSupabase
      .from('submission_files')
      .select('id, file_name, file_type, file_size, storage_path, submission')
      .eq('id', fileId)
      .single();

    if (fileError || !fileRecord) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access: user must be the submitter OR the task creator
    const { data: submission } = await serviceSupabase
      .from('submissions')
      .select('submitter, task')
      .eq('id', fileRecord.submission)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const isSubmitter = submission.submitter === user.id;
    let isTaskCreator = false;

    if (!isSubmitter) {
      const { data: task } = await serviceSupabase
        .from('tasks')
        .select('creator')
        .eq('id', submission.task)
        .single();
      isTaskCreator = task?.creator === user.id;
    }

    if (!isSubmitter && !isTaskCreator) {
      return NextResponse.json({ error: 'Not authorized to download this file' }, { status: 403 });
    }

    // Download from storage
    const { data: fileData, error: downloadError } = await serviceSupabase.storage
      .from('submission-files')
      .download(fileRecord.storage_path);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download file from storage' }, { status: 500 });
    }

    // Return the file with proper headers
    const headers = new Headers();
    headers.set('Content-Type', fileRecord.file_type);
    headers.set('Content-Disposition', `attachment; filename="${fileRecord.file_name}"`);
    headers.set('Content-Length', String(fileRecord.file_size));

    return new Response(fileData, { headers });
  } catch (err) {
    console.error('File download error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
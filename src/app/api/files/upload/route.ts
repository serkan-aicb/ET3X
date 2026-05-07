import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_FILES = 10;

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const submissionId = formData.get('submission_id') as string;
    const files = formData.getAll('files') as File[];

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 });
    }

    // Verify user owns this submission
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('id, task, submitter')
      .eq('id', submissionId)
      .single();

    if (subError || !submission || submission.submitter !== user.id) {
      return NextResponse.json({ error: 'Submission not found or not owned by you' }, { status: 403 });
    }

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const uploadedFiles: { id: string; file_name: string; file_size: number; file_type: string }[] = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        // Also check by extension for cases where MIME type is generic
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'];
        if (!ext || !allowedExtensions.includes(ext)) {
          return NextResponse.json({ 
            error: `File type not allowed: ${file.name}. Only PDF, Word, Excel/CSV, and PowerPoint files are accepted.` 
          }, { status: 400 });
        }
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ 
          error: `File too large: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 3MB.`
        }, { status: 400 });
      }

      // Generate storage path
      const timestamp = Date.now();
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${submission.task}/${user.id}/${timestamp}_${sanitized}`;

      // Upload to Supabase Storage
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await serviceSupabase.storage
        .from('submission-files')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json({ error: `Failed to upload file: ${file.name}` }, { status: 500 });
      }

      // Insert file metadata
      const { data: fileRecord, error: dbError } = await serviceSupabase
        .from('submission_files')
        .insert({
          submission: submissionId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
          storage_path: storagePath,
        })
        .select()
        .single();

      if (dbError) {
        console.error('File metadata insert error:', dbError);
        return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 });
      }

      uploadedFiles.push({
        id: fileRecord.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      });
    }

    return NextResponse.json({ files: uploadedFiles }, { status: 200 });
  } catch (err) {
    console.error('File upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
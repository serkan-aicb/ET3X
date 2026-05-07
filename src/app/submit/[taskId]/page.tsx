"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import { AppLayout } from "@/components/app-layout";
import { SharedCard } from "@/components/shared-card";

type Task = Tables<'tasks'>;
type SubmissionFile = {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
};

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_FILES = 10;

export default function SubmitTask() {
  const [task, setTask] = useState<Task | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<SubmissionFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTask = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      // Check assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('task', taskId)
        .eq('assignee', user.id)
        .single();

      if (assignmentError || !assignment) {
        router.push("/s/my-tasks");
        return;
      }

      // Get task details
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (!error && data) {
        setTask(data);
      }

      // Check if submission already exists
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('id, link, note')
        .eq('task', taskId)
        .eq('submitter', user.id)
        .maybeSingle();

      if (existingSubmission) {
        setSubmissionId(existingSubmission.id);
        setLink(existingSubmission.link || "");
        setNote(existingSubmission.note || "");

        // Fetch existing files
        const { data: files } = await supabase
          .from('submission_files')
          .select('id, file_name, file_size, file_type')
          .eq('submission', existingSubmission.id);

        setUploadedFiles(files || []);
      }

      setLoading(false);
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Validate files
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        setMessage(`File type not allowed: ${file.name}. Only PDF, Word, Excel/CSV, and PowerPoint files are accepted.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setMessage(`File too large: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 3MB.`);
        continue;
      }
      validFiles.push(file);
    }

    // Check total file count
    const totalFiles = uploadedFiles.length + pendingFiles.length + validFiles.length;
    if (totalFiles > MAX_FILES) {
      setMessage(`Maximum ${MAX_FILES} files allowed. You currently have ${uploadedFiles.length + pendingFiles.length} files.`);
      return;
    }

    setPendingFiles(prev => [...prev, ...validFiles]);
    setMessage("");

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const ensureSubmission = async (supabase: ReturnType<typeof createClient>, userId: string): Promise<string> => {
    // If we already have a submission ID, return it
    if (submissionId) return submissionId;

    // Try to find existing submission first
    const { data: existingSub } = await supabase
      .from('submissions')
      .select('id')
      .eq('task', taskId)
      .eq('submitter', userId)
      .maybeSingle();

    if (existingSub) {
      setSubmissionId(existingSub.id);
      return existingSub.id;
    }

    // Create new submission
    const { data: subData, error: subError } = await supabase
      .from('submissions')
      .insert({
        task: taskId,
        submitter: userId,
        link: link || null,
        note: note || null,
      })
      .select()
      .single();

    if (subError) {
      // If duplicate (race condition), try to find it again
      if (subError.code === '23505') {
        const { data: existingSub2 } = await supabase
          .from('submissions')
          .select('id')
          .eq('task', taskId)
          .eq('submitter', userId)
          .single();
        if (existingSub2) {
          setSubmissionId(existingSub2.id);
          return existingSub2.id;
        }
      }
      throw subError;
    }

    setSubmissionId(subData.id);
    return subData.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Ensure we have a submission record
      const currentSubmissionId = await ensureSubmission(supabase, user.id);

      // Upload any pending files
      if (pendingFiles.length > 0) {
        const formData = new FormData();
        formData.append('submission_id', currentSubmissionId);
        pendingFiles.forEach(file => {
          formData.append('files', file);
        });

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          setMessage(result.error || "Failed to upload files.");
          setSubmitting(false);
          return;
        }

        setUploadedFiles(prev => [...prev, ...result.files]);
        setPendingFiles([]);
      }

      // Update submission with link and note
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          link: link || null,
          note: note || null,
        })
        .eq('id', currentSubmissionId);

      if (updateError) throw updateError;

      setMessage("Task submitted successfully!");

      setTimeout(() => {
        router.push("/s/my-tasks");
      }, 2000);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message || "An error occurred while submitting the task.");
      } else {
        setMessage("An unknown error occurred while submitting the task.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout userRole="student">
        <div className="space-y-8">
          <SharedCard>
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <div className="space-y-4 pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </SharedCard>
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout userRole="student">
        <SharedCard>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Task not found.</p>
            <Button className="mt-4" onClick={() => router.push("/s/my-tasks")}>
              Back to My Tasks
            </Button>
          </div>
        </SharedCard>
      </AppLayout>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppLayout userRole="student">
      <div className="space-y-8">
        <SharedCard>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Submit Task: {task.title}</h2>
            <p className="text-muted-foreground">
              Complete and submit your work for this task
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="link">Link (Optional)</Label>
              <Input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com/your-work"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional, max 300 characters)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any notes about your submission"
                rows={3}
                maxLength={300}
              />
              <div className="text-right text-sm text-muted-foreground">
                {note.length}/300 characters
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Files (max {MAX_FILES} files, {MAX_FILES - uploadedFiles.length - pendingFiles.length} remaining)</Label>
                <p className="text-sm text-muted-foreground">
                  Accepted formats: PDF, Word (.doc/.docx), Excel (.xls/.xlsx/.csv), PowerPoint (.ppt/.pptx). Max 3MB per file.
                </p>
                <p className="text-xs text-muted-foreground">
                  Select your files, then click &ldquo;Submit Task&rdquo; below. All files will be uploaded automatically.
                </p>
              </div>

              <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                onChange={handleFileSelect}
                disabled={uploadedFiles.length + pendingFiles.length >= MAX_FILES}
              />

              {/* Pending files (to be uploaded on submit) */}
              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Files to submit:</p>
                  {pendingFiles.map((file, index) => (
                    <div key={`pending-${index}`} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <span className="font-medium">{file.name}</span>
                        <span className="text-muted-foreground ml-2">{formatFileSize(file.size)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removePendingFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Already uploaded files */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Uploaded files:</p>
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-2 border rounded-lg bg-green-50">
                      <div>
                        <span className="font-medium">{file.file_name}</span>
                        <span className="text-muted-foreground ml-2">{formatFileSize(file.file_size)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/api/files/download?file_id=${file.id}`, '_blank')}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message && (
              <div className={`p-3 rounded-lg ${message.includes("successfully") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {message}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} size="lg">
                {submitting ? "Submitting..." : "Submit Task"}
              </Button>
            </div>
          </form>
        </SharedCard>
      </div>
    </AppLayout>
  );
}
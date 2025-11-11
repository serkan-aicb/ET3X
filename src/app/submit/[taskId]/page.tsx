"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Tables } from '@/lib/supabase/types';
import Link from "next/link";

type Task = Tables<'tasks'>;

export default function SubmitTask() {
  const [task, setTask] = useState<Task | null>(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId as string;

  useEffect(() => {
    const fetchTask = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/stud");
        return;
      }
      
      // Check if user is assigned to this task
      const { data: assignment, error: assignmentError } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('task', taskId)
        .eq('assignee', user.id)
        .single();
      
      if (assignmentError || !assignment) {
        // User is not assigned to this task
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
      
      setLoading(false);
    };
    
    if (taskId) {
      fetchTask();
    }
  }, [taskId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      
      // Validate file size (max 10MB total)
      let totalSize = 0;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          totalSize += files[i].size;
        }
      }
      
      if (totalSize > 10 * 1024 * 1024) {
        throw new Error("Total file size exceeds 10MB limit");
      }
      
      // Upload files to Supabase Storage (if any)
      let fileData = null;
      if (files && files.length > 0) {
        const uploadedFiles = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${taskId}-${user.id}-${Date.now()}.${fileExt}`;
          
          const { data, error: uploadError } = await supabase.storage
            .from('submissions')
            .upload(fileName, file);
          
          if (uploadError) {
            throw new Error(`Error uploading file: ${uploadError.message}`);
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('submissions')
            .getPublicUrl(fileName);
          
          uploadedFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: publicUrl
          });
        }
        
        fileData = uploadedFiles;
      }
      
      // Create submission
      const { error: submitError } = await supabase
        .from('submissions')
        .insert({
          task: taskId,
          submitter: user.id,
          link: link || null,
          note: note || null,
          files: fileData
        });

      if (submitError) throw submitError;

      setMessage("Task submitted successfully!");
      
      // Update task status to 'delivered' if all assignees have submitted
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('task', taskId);
      
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('task', taskId);
      
      if (assignments && submissions && submissions.length >= assignments.length) {
        await supabase
          .from('tasks')
          .update({ status: 'delivered' })
          .eq('id', taskId);
      }
      
      // Redirect to my tasks page
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/s/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </Link>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push("/s/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse mt-4"></div>
                <div className="h-20 w-full bg-gray-200 rounded animate-pulse mt-4"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse mt-4"></div>
              </div>
            </CardContent>
          </Card>
        </main>
        
        <footer className="py-6 px-4 bg-white border-t">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-gray-500">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
              </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Terms of Use
                </Link>
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Disclaimer
                </Link>
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/s/dashboard" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-blue-800">Talent3X</span>
            </Link>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push("/s/dashboard")}>
                Dashboard
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Card className="shadow-lg">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">Task not found.</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/s/my-tasks")}
              >
                Back to My Tasks
              </Button>
            </CardContent>
          </Card>
        </main>
        
        <footer className="py-6 px-4 bg-white border-t">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-gray-500">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
              </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Terms of Use
                </Link>
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Disclaimer
                </Link>
                <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/s/dashboard" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">Talent3X</span>
          </Link>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push("/s/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-gray-800">Submit Task: {task.title}</CardTitle>
            <CardDescription className="text-gray-600">
              Complete and submit your work for this task
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="link" className="text-gray-700">Link (Optional)</Label>
                <Input
                  id="link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com/your-work"
                  className="border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note" className="text-gray-700">Note (Optional, max 300 characters)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any notes about your submission"
                  rows={3}
                  maxLength={300}
                  className="border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <div className="text-right text-sm text-gray-500">
                  {note.length}/300 characters
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="files" className="text-gray-700">Files (Optional, max 10MB total)</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  onChange={(e) => setFiles(e.target.files)}
                  accept=".zip,.pdf,.jpg,.jpeg,.png,.gif"
                  className="border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-sm text-gray-500">
                  Supported formats: ZIP, PDF, JPG, PNG, GIF. Total size limit: 10MB
                </p>
              </div>
              
              {message && (
                <div className={`p-3 rounded-lg ${message.includes("successfully") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {message}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between bg-gray-50">
              <Button type="button" variant="outline" className="border-gray-600 text-gray-600 hover:bg-gray-50" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Task"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-white border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-500">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Terms of Use
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Disclaimer
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
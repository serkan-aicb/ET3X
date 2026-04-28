"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PublicLayout } from "@/components/public-layout";

type TaskInfo = {
  id: string;
  title: string;
  description: string | null;
  module: string | null;
  skill_level: string | null;
  due_date: string | null;
  is_active: boolean | null;
  is_requestable: boolean | null;
};

export default function TaskRequestPage() {
  const params = useParams();
  const router = useRouter();
  const shareCode = params.shareCode as string;

  const [task, setTask] = useState<TaskInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<"none" | "pending" | "accepted" | "declined">("none");
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskAndStatus = async () => {
      const supabase = createClient();

      // Check if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setUserId(user.id);
      }

      // Fetch task info by share_code (publicly accessible via RLS policy)
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .select("id, title, description, module, skill_level, due_date, is_active, is_requestable")
        .eq("share_code", shareCode)
        .single();

      if (taskError || !taskData) {
        setMessage("Task not found or link is invalid.");
        setLoading(false);
        return;
      }

      setTask(taskData);

      // If logged in, check existing request status
      if (user) {
        const { data: requestData } = await supabase
          .from("task_requests")
          .select("status")
          .eq("task", taskData.id)
          .eq("applicant", user.id)
          .maybeSingle();

        if (requestData) {
          setRequestStatus(requestData.status as "pending" | "accepted" | "declined");
        }
      }

      setLoading(false);
    };
    fetchTaskAndStatus();
  }, [shareCode]);

  const handleRequest = async () => {
    if (!isLoggedIn) {
      // Redirect to auth with return URL
      router.push(`/auth?redirect_to=/t/${shareCode}&mode=register&role=student`);
      return;
    }

    if (!task) return;

    setRequesting(true);
    setMessage("");

    const supabase = createClient();

    // Get profile username
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId!)
      .single();

    const { error } = await supabase
      .from("task_requests")
      .insert({
        task: task.id,
        applicant: userId!,
        applicant_username: profile?.username || "unknown",
        status: "pending",
      });

    if (error) {
      if (error.code === "23505") {
        // Duplicate request
        setMessage("You have already submitted a request for this task.");
      } else if (error.message.includes("is_requestable") || task.is_active === false) {
        setMessage("This task is no longer accepting requests.");
      } else {
        setMessage("Failed to submit request: " + error.message);
      }
      setRequesting(false);
      return;
    }

    setRequestStatus("pending");
    setRequesting(false);
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  if (!task) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-lg">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Task not found or the link is invalid.</p>
              <Link href="/">
                <Button className="mt-4" variant="outline">Go to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  // Task is deactivated
  if (!task.is_active) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>{task.title}</CardTitle>
              <CardDescription>This task is no longer accepting new requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
                The professor has deactivated this task&apos;s request link. No new participation requests can be submitted.
              </div>
              {requestStatus !== "none" && (
                <p className="text-sm text-muted-foreground">
                  Your existing request status: <span className="font-semibold capitalize">{requestStatus}</span>
                </p>
              )}
              <Link href="/">
                <Button variant="outline" className="w-full">Go to Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="flex items-start justify-center pt-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-xl">{task.title}</CardTitle>
            {task.module && (
              <CardDescription>Module: {task.module}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
          {task.description && (
            <p className="text-muted-foreground">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {task.skill_level && (
              <div>
                <span className="text-muted-foreground">Skill Level:</span>
                <span className="ml-2 font-medium">{task.skill_level}</span>
              </div>
            )}
            {task.due_date && (
              <div>
                <span className="text-muted-foreground">Due Date:</span>
                <span className="ml-2 font-medium">{new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${
              message.includes("submitted") ? "bg-green-50 text-green-700 border border-green-200"
              : message.includes("already") ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
              : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          {requestStatus === "pending" && (
            <div className="p-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              Your request is pending. The professor will review it and assign you to the task.
            </div>
          )}

          {requestStatus === "accepted" && (
            <div className="p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
              You have been assigned to this task! Go to your dashboard to start working.
              <Link href="/s/dashboard">
                <Button className="mt-2 w-full" variant="outline">Go to Dashboard</Button>
              </Link>
            </div>
          )}

          {requestStatus === "declined" && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
              Your request was declined by the professor.
            </div>
          )}

          {requestStatus === "none" && task.is_active && (
            <Button
              onClick={handleRequest}
              disabled={requesting}
              className="w-full"
              size="lg"
            >
              {requesting ? "Submitting..." : isLoggedIn ? "Request Participation" : "Login to Request Participation"}
            </Button>
          )}

          {!isLoggedIn && requestStatus === "none" && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                You need to create an account to request participation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </PublicLayout>
  );
}
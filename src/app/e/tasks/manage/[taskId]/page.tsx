"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/app-layout";
import Link from "next/link";

type RequestInfo = {
  id: string;
  applicant: string;
  applicant_username: string;
  applicant_real_name?: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

type AssignmentInfo = {
  id: string;
  assignee: string;
  assignee_username: string;
  assignee_real_name?: string | null;
  status: string;
  created_at: string;
};

export default function ManageRequestsPage() {
  const params = useParams();
  const taskId = params.taskId as string;

  const [taskTitle, setTaskTitle] = useState("");
  const [requests, setRequests] = useState<RequestInfo[]>([]);
  const [assignments, setAssignments] = useState<AssignmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Get task
      const { data: task } = await supabase
        .from("tasks")
        .select("title")
        .eq("id", taskId)
        .single();

      if (task) setTaskTitle(task.title);

      // Get requests
      const { data: reqs } = await supabase
        .from("task_requests")
        .select("id, applicant, applicant_username, status, created_at, profiles!task_requests_applicant_fkey(real_name)")
        .eq("task", taskId)
        .order("created_at", { ascending: true });

      const formattedReqs = (reqs || []).map((r: Record<string, unknown>) => ({
        ...r,
        applicant_real_name: (r.profiles as { real_name: string | null } | null)?.real_name || null,
      }));
      setRequests(formattedReqs as RequestInfo[]);

      // Get assignments
      const { data: assigns } = await supabase
        .from("task_assignments")
        .select("id, assignee, assignee_username, status, created_at, profiles!task_assignments_assignee_fkey(real_name)")
        .eq("task", taskId);

      const formattedAssigns = (assigns || []).map((a: Record<string, unknown>) => ({
        ...a,
        assignee_real_name: (a.profiles as { real_name: string | null } | null)?.real_name || null,
      }));
      setAssignments(formattedAssigns as AssignmentInfo[]);
      setLoading(false);
    };
    fetchData();
  }, [taskId]);

  const handleAcceptRequest = async (requestId: string, applicantId: string, applicantUsername: string) => {
    setActionLoading(requestId);
    setMessage("");

    const supabase = createClient();

    // Update request status to accepted
    const { error: reqError } = await supabase
      .from("task_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);

    if (reqError) {
      setMessage("Failed to accept request: " + reqError.message);
      setActionLoading(null);
      return;
    }

    // Create assignment
    const { error: assignError } = await supabase
      .from("task_assignments")
      .insert({
        task: taskId,
        assignee: applicantId,
        assignee_username: applicantUsername,
        status: "in_progress",
      });

    if (assignError) {
      if (assignError.code === "23505") {
        // Already assigned, just update request status
        setMessage("Student is already assigned. Request marked as accepted.");
      } else {
        setMessage("Request accepted but failed to create assignment: " + assignError.message);
      }
    } else {
      setMessage("Student accepted and assigned successfully!");
    }

    // Refresh data
    const { data: reqs } = await supabase
      .from("task_requests")
      .select("id, applicant, applicant_username, status, created_at")
      .eq("task", taskId);

    const { data: assigns } = await supabase
      .from("task_assignments")
      .select("id, assignee, assignee_username, status, created_at")
      .eq("task", taskId);

    setRequests(reqs || []);
    setAssignments(assigns || []);
    setActionLoading(null);
  };

  const handleDeclineRequest = async (requestId: string) => {
    setActionLoading(requestId);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("task_requests")
      .update({ status: "declined" })
      .eq("id", requestId);

    if (error) {
      setMessage("Failed to decline request: " + error.message);
    } else {
      setMessage("Request declined.");
      // Refresh
      const { data: reqs } = await supabase
        .from("task_requests")
        .select("id, applicant, applicant_username, status, created_at")
        .eq("task", taskId);
      setRequests(reqs || []);
    }

    setActionLoading(null);
  };

  const handleUnassign = async (assignmentId: string) => {
    setActionLoading(assignmentId);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("task_assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      setMessage("Failed to unassign: " + error.message);
    } else {
      setMessage("Student unassigned successfully.");
      const { data: assigns } = await supabase
        .from("task_assignments")
        .select("id, assignee, assignee_username, status, created_at")
        .eq("task", taskId);
      setAssignments(assigns || []);
    }

    setActionLoading(null);
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const acceptedRequests = requests.filter(r => r.status === "accepted");
  const declinedRequests = requests.filter(r => r.status === "declined");

  if (loading) {
    return (
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Requests: {taskTitle}</h1>
          <p className="text-muted-foreground">
            Review and manage student participation requests
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${
            message.includes("successfully") ? "bg-green-50 text-green-700 border border-green-200"
            : message.includes("declined") ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
            : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message}
          </div>
        )}

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Pending Requests ({pendingRequests.length})
            </CardTitle>
            <CardDescription>Students waiting for your approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{req.applicant_real_name || `@${req.applicant_username}`}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        Requested {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(req.id, req.applicant, req.applicant_username)}
                        disabled={actionLoading === req.id}
                      >
                        {actionLoading === req.id ? "..." : "Accept"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineRequest(req.id)}
                        disabled={actionLoading === req.id}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Assigned Students ({assignments.length})
            </CardTitle>
            <CardDescription>Students currently assigned to this task</CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No students assigned yet</p>
            ) : (
              <div className="space-y-3">
                {assignments.map(assign => (
                  <div key={assign.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{assign.assignee_real_name || `@${assign.assignee_username}`}</span>
                      <span className="text-muted-foreground ml-2 text-sm capitalize">
                        {assign.status}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnassign(assign.id)}
                      disabled={actionLoading === assign.id}
                    >
                      {actionLoading === assign.id ? "..." : "Unassign"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Accepted Requests (history) */}
        {acceptedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Accepted Requests ({acceptedRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {acceptedRequests.map(req => (
                  <div key={req.id} className="flex items-center p-2 text-sm">
                    <span className="font-medium">{req.applicant_real_name || `@${req.applicant_username}`}</span>
                    <span className="text-green-600 ml-2">Accepted</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Declined Requests (history) */}
        {declinedRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Declined Requests ({declinedRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {declinedRequests.map(req => (
                  <div key={req.id} className="flex items-center p-2 text-sm">
                    <span className="font-medium">{req.applicant_real_name || `@${req.applicant_username}`}</span>
                    <span className="text-red-600 ml-2">Declined</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-4">
          <Link href={`/e/tasks/share/${taskId}`}>
            <Button variant="outline">Back to Share Page</Button>
          </Link>
          <Link href="/e/my-tasks">
            <Button variant="outline">My Tasks</Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

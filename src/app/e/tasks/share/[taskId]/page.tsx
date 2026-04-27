"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/app-layout";
import Link from "next/link";

export default function TaskSharePage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;
  const qrRef = useRef<HTMLDivElement>(null);

  const [task, setTask] = useState<{
    id: string;
    title: string;
    share_code: string | null;
    is_active: boolean | null;
    is_requestable: boolean | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchTask = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, share_code, is_active, is_requestable")
        .eq("id", taskId)
        .single();

      if (error || !data) {
        setMessage("Task not found.");
        setLoading(false);
        return;
      }

      setTask(data);
      setLoading(false);
    };
    fetchTask();
  }, [taskId]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  const publicUrl = task?.share_code
    ? `${siteUrl}/t/${task.share_code}`
    : "";

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = publicUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    const svgElement = qrRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx!.scale(2, 2);
      ctx!.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `task-${task?.share_code}-qr.png`;
      downloadLink.href = pngUrl;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleToggleActive = async () => {
    if (!task) return;
    setToggleLoading(true);
    const supabase = createClient();
    const newActive = !task.is_active;

    const { error } = await supabase
      .from("tasks")
      .update({ is_active: newActive })
      .eq("id", taskId);

    if (error) {
      setMessage("Failed to update task status: " + error.message);
    } else {
      setTask({ ...task, is_active: newActive });
      setMessage(newActive ? "Task request link is now active." : "Task request link has been deactivated. No new requests will be accepted.");
    }
    setToggleLoading(false);
  };

  if (loading) {
    return (
      <AppLayout userRole="educator">
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!task) {
    return (
      <AppLayout userRole="educator">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Task not found.</p>
            <Button className="mt-4" onClick={() => router.push("/e/my-tasks")}>
              Back to My Tasks
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  if (!task.share_code) {
    return (
      <AppLayout userRole="educator">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">This task does not have a share code.</p>
            <Button className="mt-4" onClick={() => router.push("/e/my-tasks")}>
              Back to My Tasks
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Share Task: {task.title}</h1>
          <p className="text-xs uppercase text-muted-foreground">
            Share this link or QR code with students
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${
            message.includes("deactivated") ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
            : message.includes("Failed") ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-green-50 text-green-700 border border-green-200"
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Public Link Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Public Link</CardTitle>
              <CardDescription>Students can access the task via this link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={handleCopyLink} className="w-full">
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              {!task.is_active && (
                <div className="p-3 rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
                  This link is currently deactivated. Students cannot submit new requests.
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR Code</CardTitle>
              <CardDescription>Students can scan this QR code to access the task</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col items-center">
              <div ref={qrRef} className="bg-white p-4 rounded-lg border">
                <QRCodeSVG
                  value={publicUrl}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <Button variant="outline" onClick={handleDownloadQR} className="w-full">
                Download QR Code
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Toggle Active Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Request Link Status</CardTitle>
            <CardDescription>
              Control whether students can submit participation requests
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${task.is_active ? "bg-green-500" : "bg-yellow-500"}`}></div>
                <span className="text-foreground">
                  {task.is_active ? "Active - accepting new requests" : "Deactivated - no new requests accepted"}
                </span>
              </div>
              <Button
                variant={task.is_active ? "outline" : "default"}
                onClick={handleToggleActive}
                disabled={toggleLoading}
                className="w-full"
              >
                {toggleLoading ? "Updating..." : task.is_active ? "Deactivate Request Link" : "Activate Request Link"}
              </Button>
              {task.is_active && (
                <p className="text-sm text-muted-foreground">
                  Existing assigned students will still have access even if you deactivate the request link.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex gap-4">
            <Link href={`/e/tasks/manage/${taskId}`}>
              <Button variant="outline">Manage Requests</Button>
            </Link>
            <Link href="/e/my-tasks">
              <Button variant="outline">Back to My Tasks</Button>
            </Link>
          </div>
      </div>
    </AppLayout>
  );
}
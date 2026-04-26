"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to the unified auth page with student role preset
export default function StudentLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth?role=student&mode=login");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to login...</p>
    </div>
  );
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to the unified auth page with educator role preset
export default function EducatorLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth?role=educator&mode=login");
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to login...</p>
    </div>
  );
}
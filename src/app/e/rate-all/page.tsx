"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { ProfessorRateAllTable } from "@/components/professor/ProfessorRateAllTable";

export default function ProfessorRateAllPage() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth");
        return;
      }
      
      // Check if user is an educator
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error || !profile || profile.role !== 'educator') {
        router.push("/auth");
        return;
      }
      
      setIsAuthenticated(true);
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <AppLayout userRole="educator">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppLayout userRole="educator">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Ratings Overview</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter ratings per DID for 4 tasks. 0 = not participated, 1–5 = grade.
          </p>
        </div>
        
        <ProfessorRateAllTable />
      </div>
    </AppLayout>
  );
}
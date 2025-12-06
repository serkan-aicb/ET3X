"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "../../../lib/supabase/client";
import Image from "next/image";

export default function CollectMatriculationPage() {
  const [matriculationNumber, setMatriculationNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to login if not authenticated
        router.push("/stud");
        return;
      }
      
      // Check if user already has a student number
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('matriculation_number')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        setError("Error fetching profile information.");
        setLoading(false);
        return;
      }
      
      // If user already has a student number, redirect to dashboard
      if (profile.matriculation_number) {
        router.push("/s/dashboard");
        return;
      }
      
      setLoading(false);
    };
    
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedNumber = matriculationNumber.trim();
    
    if (!trimmedNumber) {
      setError("Please enter your student number.");
      return;
    }
    
    // Validate student number format
    if (trimmedNumber.length < 5 || trimmedNumber.length > 20) {
      setError("Student number must be between 5 and 20 characters.");
      return;
    }
    
    if (!/^[A-Za-z0-9]+$/.test(trimmedNumber)) {
      setError("Student number can only contain letters and numbers.");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Update profile with student number
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ matriculation_number: trimmedNumber })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      // Redirect to dashboard
      router.push("/s/dashboard");
    } catch (err) {
      console.error("Error saving student number:", err);
      setError(err instanceof Error ? err.message : "Failed to save student number. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="w-full px-6 py-3 flex items-center bg-card border-b">
          <Link href="/">
            <Image
              src="/pics/LOGO-blank.png"
              alt="Talent3X"
              width={120}
              height={120}
              className="h-10 w-auto"
            />
          </Link>
        </header>

        <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md rounded-2xl overflow-hidden border bg-card">
            <CardHeader className="text-center pb-4 pt-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <CardTitle className="text-2xl text-foreground">Collecting Information</CardTitle>
              <CardDescription className="text-muted-foreground">
                Please wait while we prepare your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        </main>

        <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-card border-t mt-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <p className="text-muted-foreground">© {new Date().getFullYear()} Talent3X. University Pilot.</p>
              </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Use
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Disclaimer
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-3 flex items-center bg-card border-b">
        <Link href="/">
          <Image
            src="/pics/LOGO-blank.png"
            alt="Talent3X"
            width={120}
            height={120}
            className="h-10 w-auto"
          />
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md rounded-2xl overflow-hidden border bg-card">
          <CardHeader className="text-center pb-4 pt-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-foreground">Student Number</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please enter your student number to complete registration
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="matriculationNumber" className="text-foreground">Student Number</Label>
                <Input
                  id="matriculationNumber"
                  type="text"
                  placeholder="e.g., 123456 or STUD2023001"
                  value={matriculationNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMatriculationNumber(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">5-20 characters, letters and numbers only</p>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-900/30 text-red-400 border border-red-800/50">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col pb-6">
              <div className="mt-6 w-full">
                <Button 
                  type="submit" 
                  className="w-full"
                  size="lg"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : "Save and Continue"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>

      <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-card border-t mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-muted-foreground">© {new Date().getFullYear()} Talent3X. University Pilot.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Use
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Disclaimer
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

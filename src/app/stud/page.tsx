"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { Suspense } from "react";
import Image from "next/image";

// Separate component for the main content that uses useSearchParams
function StudentLoginContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for error messages in URL
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'auth_failed':
          setError("Authentication failed. Please try again.");
          break;
        case 'no_user':
          setError("No user data received. Please try again.");
          break;
        case 'profile_creation_failed':
          setError("Failed to create user profile. Please contact support.");
          break;
        case 'user_fetch_failed':
          setError("Failed to fetch user data. Please try again.");
          break;
        case 'unexpected_error':
          setError("An unexpected error occurred. Please try again.");
          break;
        case 'no_code':
          setError("No authentication code provided. Please try again.");
          break;
        default:
          setError("An unknown error occurred.");
      }
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/stud`,
        },
      });

      if (error) throw error;

      setMessage("Check your email for the login link!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "An error occurred during login.");
      } else {
        setError("An unknown error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md rounded-2xl overflow-hidden border bg-card">
      <CardHeader className="text-center pb-4 pt-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <CardTitle className="text-2xl text-foreground">Student Login</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email to receive a magic link for login
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {message && (
            <div className={`p-3 rounded-lg ${message.includes("Check your email") ? "bg-green-900/30 text-green-400 border border-green-800/50" : "bg-red-900/30 text-red-400 border border-red-800/50"}`}>
              {message}
            </div>
          )}
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
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : "Send Magic Link"}
            </Button>
          </div>
          <div className="mt-4 w-full">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              size="lg"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

// Loading fallback component
function StudentLoginLoading() {
  return (
    <Card className="w-full max-w-md rounded-2xl overflow-hidden border bg-card">
      <CardHeader className="text-center pb-4 pt-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <CardTitle className="text-2xl text-foreground">Student Login</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email to receive a magic link for login
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded-lg"></div>
        </div>
        <div className="h-12 bg-muted rounded-lg"></div>
        <div className="h-12 bg-muted rounded-lg"></div>
      </CardContent>
    </Card>
  );
}

export default function StudentLogin() {
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

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<StudentLoginLoading />}>
          <StudentLoginContent />
        </Suspense>
      </main>

      {/* Footer */}
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

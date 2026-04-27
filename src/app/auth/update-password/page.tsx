"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Suspense } from "react";

function UpdatePasswordContent() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };
    checkSession();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage("Password updated successfully! You can now log in with your new password.");
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md rounded-2xl overflow-hidden border bg-card">
      <CardHeader className="text-center pb-4 pt-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <CardTitle className="text-2xl text-foreground">Set New Password</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your new password below
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleUpdate}>
        <CardContent className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {message && (
            <div className="p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col pb-6">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || !!error}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full px-6 py-3 flex items-center bg-card border-b">
        <Link href="/">
          <Image
            src="/pics/logo-transparent.png"
            alt="Talent3X"
            width={120}
            height={120}
            className="h-10 w-auto"
          />
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={
          <Card className="w-full max-w-md rounded-2xl overflow-hidden border bg-card">
            <CardHeader className="text-center pb-4 pt-6">
              <CardTitle className="text-2xl text-foreground">Set New Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="h-12 bg-muted rounded-lg"></div>
              <div className="h-12 bg-muted rounded-lg"></div>
            </CardContent>
          </Card>
        }>
          <UpdatePasswordContent />
        </Suspense>
      </main>

      <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-card border-t mt-auto">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">© {new Date().getFullYear()} Talent3X. University Pilot.</p>
        </div>
      </footer>
    </div>
  );
}
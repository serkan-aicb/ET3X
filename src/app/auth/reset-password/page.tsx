"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/update-password`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage("Password reset link sent! Check your email and click the link to set a new password.");
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
        <Card className="w-full max-w-md rounded-2xl overflow-hidden border bg-card">
          <CardHeader className="text-center pb-4 pt-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.743-5.743A6 6 0 0117 7z" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-foreground">Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your email to receive a password reset link
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleReset}>
            <CardContent className="space-y-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <div className="mt-4 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => router.push("/auth")}
                >
                  Back to Login
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>

      <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-card border-t mt-auto">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-muted-foreground">© {new Date().getFullYear()} Talent3X. University Pilot.</p>
        </div>
      </footer>
    </div>
  );
}
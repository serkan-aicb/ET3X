"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { signIn, getSession } from "@/lib/auth/local-session";

/**
 * Demo sign-in (frozen build). No password, no server — this collects the
 * rudimentary profile (R12: email + organisation + function) plus a display
 * name, records a local session, and drops the individual into their workspace.
 *
 * Only the individual signs in here. Evaluators never log in: they act on the
 * link they are sent (/evaluate/<token>), where the in-page account gate collects
 * their rudimentary profile (v6 §2). Org roles arrive with the org dashboards.
 * Replaced by real Supabase auth when the backend is live.
 */
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to") || "";
  const dest = redirectTo || "/s/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [fn, setFn] = useState("");
  const [error, setError] = useState("");

  // Already signed in → straight through.
  useEffect(() => {
    if (getSession()) router.push(dest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !organisation.trim() || !fn.trim()) {
      setError("Please fill in every field.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    signIn({ role: "student", name, email, organisation, function: fn });
    router.push(dest);
  };

  return (
    <Card className="w-full max-w-md rounded-2xl overflow-hidden border bg-card">
      <CardHeader className="text-center pb-4 pt-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <CardTitle className="text-2xl text-foreground">Enter the pilot</CardTitle>
        <CardDescription className="text-muted-foreground">
          No password needed — this build runs entirely in your browser. Tell us the minimum to take part.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@work.com" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organisation" className="text-foreground">Organisation</Label>
            <Input id="organisation" value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="Company or university" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="function" className="text-foreground">Role / function</Label>
            <Input id="function" value={fn} onChange={(e) => setFn(e.target.value)} placeholder="e.g. Student, Engineer, Analyst" required />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col pb-6">
          <div className="mt-2 w-full">
            <Button type="submit" className="w-full" size="lg">Enter</Button>
          </div>
          <div className="mt-4 w-full">
            <Button type="button" variant="outline" className="w-full" size="lg" onClick={() => router.push("/")}>
              Back to Home
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

function AuthLoading() {
  return (
    <Card className="w-full max-w-md rounded-2xl overflow-hidden border bg-card">
      <CardHeader className="text-center pb-4 pt-6">
        <CardTitle className="text-2xl text-foreground">Enter the pilot</CardTitle>
        <CardDescription className="text-muted-foreground">
          No password needed — this build runs entirely in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded-lg"></div>
        </div>
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded-lg"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuthPage() {
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

      <main className="grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<AuthLoading />}>
          <AuthContent />
        </Suspense>
      </main>

      <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-card border-t mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-muted-foreground">© {new Date().getFullYear()} Talent3X. University Pilot.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/terms-of-use" className="text-muted-foreground hover:text-primary transition-colors">
                Terms of Use
              </Link>
              <Link href="/legal-notice" className="text-muted-foreground hover:text-primary transition-colors">
                Disclaimer
              </Link>
              <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

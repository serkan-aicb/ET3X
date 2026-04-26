"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";
import Image from "next/image";

function AuthContent() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "educator">("student");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to") || "";
  const initialRole = searchParams.get("role") || "student";
  const initialMode = searchParams.get("mode") || "login";

  useEffect(() => {
    if (initialRole === "educator") setRole("educator");
    if (initialMode === "register") setMode("register");
  }, [initialRole, initialMode]);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Already logged in, redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        if (profile) {
          const dest = redirectTo || (profile.role === "student" ? "/s/dashboard" : "/e/dashboard");
          router.push(dest);
        }
      }
    };
    checkSession();
  }, [router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Please confirm your email address before logging in. Check your inbox for the confirmation link.");
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.user) {
        // Get user role and redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const dest = redirectTo || (profile?.role === "student" ? "/s/dashboard" : "/e/dashboard");
        router.push(dest);
      }
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=${redirectTo}`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("This email is already registered. Please log in instead.");
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.user) {
        // Create profile via API
        try {
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email,
              role: role,
            }),
          });

          const result = await response.json();
          if (!response.ok) {
            console.error("Profile creation error:", result.error);
          }
        } catch (profileErr) {
          console.error("Profile creation failed:", profileErr);
        }

        // Check if email confirmation is needed
        if (data.session) {
          // Auto-confirmed, redirect immediately
          const dest = redirectTo || (role === "student" ? "/s/dashboard" : "/e/dashboard");
          router.push(dest);
        } else {
          // Email confirmation required
          setMessage("Registration successful! Please check your email to confirm your account, then log in.");
        }
      }
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <CardTitle className="text-2xl text-foreground">
          {mode === "login" ? "Login" : "Create Account"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {mode === "login" 
            ? "Enter your email and password to log in" 
            : "Register with email and password"
          }
        </CardDescription>
      </CardHeader>

      {/* Mode toggle */}
      <div className="flex justify-center gap-2 px-6 pb-2">
        <Button
          variant={mode === "login" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("login"); setError(""); setMessage(""); }}
        >
          Login
        </Button>
        <Button
          variant={mode === "register" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("register"); setError(""); setMessage(""); }}
        >
          Register
        </Button>
      </div>

      <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
        <CardContent className="space-y-6 pt-2">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground">Role</Label>
              <Select value={role} onValueChange={(v: "student" | "educator") => setRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="educator">Educator / Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "register" ? 8 : undefined}
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

          {mode === "login" && (
            <div className="text-center">
              <Link href="/auth/reset-password" className="text-sm text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col pb-6">
          <div className="mt-4 w-full">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === "login" ? "Logging in..." : "Creating account..."}
                </span>
              ) : mode === "login" ? "Login" : "Create Account"}
            </Button>
          </div>
          <div className="mt-4 w-full">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => router.push("/")}
            >
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
        <CardTitle className="text-2xl text-foreground">Login</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your email and password to log in
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
            src="/pics/LOGO-blank.png"
            alt="Talent3X"
            width={120}
            height={120}
            className="h-10 w-auto"
          />
        </Link>
      </header>

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
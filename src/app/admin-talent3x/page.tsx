"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

export default function AdminLogin() {
  const [code, setCode] = useState("");
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
      
      // Check if the code is valid
      const { data, error } = await supabase
        .from('admin_codes')
        .select('code, valid_from, valid_to')
        .eq('code', code)
        .single();

      if (error) throw error;
      
      if (!data) {
        throw new Error("Invalid admin code");
      }
      
      const now = new Date();
      const validFrom = data.valid_from ? new Date(data.valid_from) : new Date();
      const validTo = data.valid_to ? new Date(data.valid_to) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year from now
      
      if (now < validFrom || now > validTo) {
        throw new Error("Admin code is not valid at this time");
      }
      
      // Store in session or local storage
      localStorage.setItem('admin_code', code);
      
      // Redirect to admin overview
      router.push("/admin/overview");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || "An error occurred during admin login.");
      } else {
        setError("An unknown error occurred during admin login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">Talent3X</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-blue-600 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription className="text-blue-100">
              Enter your admin code to access the admin panel
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-700">Admin Code</Label>
                <Input
                  id="code"
                  type="password"
                  placeholder="Enter your admin code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="py-3 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              {message && (
                <div className={`p-3 rounded-lg ${message.includes("Check your email") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {message}
                </div>
              )}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : "Verify Admin Code"}
              </Button>
              <Button type="button" variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-lg font-medium" onClick={() => router.push('/')}>
                Back to Home
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-500">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Terms of Use
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Disclaimer
              </Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const error = params.error;
  
  // Check if user is already authenticated
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // If user is authenticated, redirect to their dashboard
  if (user) {
    // Check user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (!profileError && profile) {
      if (profile.role === 'student') {
        redirect('/s/dashboard');
      } else if (profile.role === 'educator') {
        redirect('/e/dashboard');
      } else if (profile.role === 'admin') {
        redirect('/admin/overview');
      }
    }
  }
  
  const getErrorMessage = () => {
    switch (error) {
      case 'auth_failed':
        return "Authentication failed. Please try again.";
      case 'no_user':
        return "No user data received. Please try again.";
      case 'profile_creation_failed':
        return "Failed to create user profile. Please contact support.";
      case 'user_fetch_failed':
        return "Failed to fetch user data. Please try again.";
      case 'unexpected_error':
        return "An unexpected error occurred. Please try again.";
      case 'no_code':
        return "No authentication code provided. Please try again.";
      default:
        return "An unknown error occurred.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-blue-800">Talent3X</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
            <span className="block">Welcome to</span>
            <span className="block text-blue-600 mt-2">Talent3X</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            Connect students with educators through verifiable, blockchain-anchored skill development tasks.
          </p>
          
          {error && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{getErrorMessage()}</span>
              </div>
            </div>
          )}
          
          {/* Login Cards */}
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Card className="bg-white shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-xl">
              <CardHeader className="bg-blue-50">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <CardTitle className="text-center text-blue-800">Students</CardTitle>
                <CardDescription className="text-center">Find and complete skill-building tasks</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-6 text-gray-600">
                  Browse available tasks, request assignments, submit your work, and earn verifiable credentials.
                </p>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link href="/stud">Student Login</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-xl">
              <CardHeader className="bg-blue-50">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <CardTitle className="text-center text-blue-800">Educators</CardTitle>
                <CardDescription className="text-center">Create and manage learning tasks</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-6 text-gray-600">
                  Design tasks, assign them to students, review submissions, and provide ratings.
                </p>
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                  <Link href="/edu">Educator Login</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 hover:shadow-xl">
              <CardHeader className="bg-blue-50">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle className="text-center text-blue-800">Administrators</CardTitle>
                <CardDescription className="text-center">Platform oversight and analytics</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-6 text-gray-600">
                  Monitor platform activity, view analytics, and manage administrative functions.
                </p>
                <Button asChild variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                  <Link href="/admin-talent3x">Admin Login</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-24 max-w-6xl mx-auto w-full">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How Talent3X Works</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-6 rounded-xl shadow-md text-center transform transition-all hover:scale-105">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Tasks</h3>
              <p className="text-gray-600">Educators define skill-building activities</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center transform transition-all hover:scale-105">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Request & Assign</h3>
              <p className="text-gray-600">Students request tasks, educators assign them</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center transform transition-all hover:scale-105">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2l font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Submit & Review</h3>
              <p className="text-gray-600">Students submit work, educators review</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md text-center transform transition-all hover:scale-105">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rate & Verify</h3>
              <p className="text-gray-600">Ratings are anchored to blockchain</p>
            </div>
          </div>
        </div>
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
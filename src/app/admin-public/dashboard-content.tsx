"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface DashboardStats {
  totalTasks: number;
  openTasks: number;
  assignedTasks: number;
  deliveredTasks: number;
  ratedTasks: number;
  totalUsers: number;
  students: number;
  educators: number;
  totalSkills: number;
  activeProfiles: number;
  completedAssignments: number;
}

// Define types for detailed data
interface TaskDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

interface ProfileDetail {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

interface RatingDetail {
  id: string;
  taskId: string;
  taskTitle: string;
  starsAvg: number;
  createdAt: string;
}

interface SkillDetail {
  id: number;
  label: string;
  description: string;
}

interface DetailedData {
  tasks: TaskDetail[];
  profiles: ProfileDetail[];
  ratings: RatingDetail[];
  skills: SkillDetail[];
}

export default function DashboardContent({ 
  stats, 
  loading, 
  detailedData 
}: { 
  stats: DashboardStats; 
  loading: boolean; 
  detailedData?: DetailedData 
}) {
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold text-foreground">Talent3X</span>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8 flex-grow">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="shadow-lg border">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="shadow-lg border">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="shadow-lg border">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        
        <footer className="py-6 px-4 bg-card border-t">
          <div className="container mx-auto">
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Talent3X</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Talent3X Public Dashboard</h1>
          <p className="text-muted-foreground">
            Platform analytics and statistics - publicly accessible
          </p>
        </div>
        
        {/* First row: Task Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Total Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">All tasks on the platform</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.totalTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Open Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">Available for students</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.openTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Assigned Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">Assigned to students</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.assignedTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Delivered Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">Submitted by students</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.deliveredTasks}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Rated Tasks</CardTitle>
              <CardDescription className="text-muted-foreground">Rated and finalized</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.ratedTasks}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Second row: User Statistics */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Total Users</CardTitle>
              <CardDescription className="text-muted-foreground">All registered users</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Students</CardTitle>
              <CardDescription className="text-muted-foreground">Registered students</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.students}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Educators</CardTitle>
              <CardDescription className="text-muted-foreground">Registered educators</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.educators}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Third row: Additional Statistics */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Total Skills</CardTitle>
              <CardDescription className="text-muted-foreground">Available skills in the system</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.totalSkills}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg rounded-xl overflow-hidden transform transition-all hover:scale-105 border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Active Profiles</CardTitle>
              <CardDescription className="text-muted-foreground">Profiles with DID credentials</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-4xl font-bold text-primary">{stats.activeProfiles}</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Data Tables */}
        <div className="space-y-12">
          {/* Tasks Table */}
          <div className="bg-card p-6 rounded-xl border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Recent Tasks</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-foreground">Title</th>
                    <th className="py-2 text-left text-foreground">Status</th>
                    <th className="py-2 text-left text-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailedData?.tasks || []).slice(0, 5).map((task, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 text-muted-foreground">{task.title}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'open' ? 'bg-green-100 text-green-800' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'graded' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">{new Date(task.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profiles Table */}
          <div className="bg-card p-6 rounded-xl border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Recent Profiles</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-foreground">Username</th>
                    <th className="py-2 text-left text-foreground">Role</th>
                    <th className="py-2 text-left text-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailedData?.profiles || []).slice(0, 5).map((profile, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 text-muted-foreground">{profile.username}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profile.role === 'student' ? 'bg-blue-100 text-blue-800' :
                          profile.role === 'educator' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="py-2 text-muted-foreground">{new Date(profile.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Skills Table */}
          <div className="bg-card p-6 rounded-xl border">
            <h2 className="text-2xl font-bold text-foreground mb-4">Available Skills</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left text-foreground">Skill</th>
                    <th className="py-2 text-left text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailedData?.skills || []).slice(0, 5).map((skill, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-medium text-foreground">{skill.label}</td>
                      <td className="py-2 text-muted-foreground">{skill.description || 'No description'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 bg-card border-t">
        <div className="container mx-auto">
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
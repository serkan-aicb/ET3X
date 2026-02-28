import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from '@supabase/supabase-js';
import { Database } from "@/lib/supabase/types";
import DashboardContent from "./dashboard-content";

// Define types for detailed data
interface RatingDetail {
  id: string;
  taskId: string;
  taskTitle: string;
  starsAvg: number;
  createdAt: string;
}

async function getPublicDashboardData() {
  // Create a Supabase client with service role key to bypass RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // Fetch task statistics
    const { count: totalTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    const { count: openTasks } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Get assigned tasks count from task_assignments table (tasks assigned to students)
    const { count: assignedTasksFromAssignments } = await supabase
      .from('task_assignments')
      .select('*', { count: 'exact', head: true });

    // Get delivered/submitted tasks count from submissions table
    const { count: submittedTasksFromSubmissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    // Get rated tasks count from ratings table
    const { count: ratedTasksFromRatings } = await supabase
      .from('ratings')
      .select('*', { count: 'exact', head: true });

    // Use the more accurate counts from the related tables
    const inProgressTasks = assignedTasksFromAssignments || 0;
    const submittedTasks = submittedTasksFromSubmissions || 0;
    const gradedTasks = ratedTasksFromRatings || 0;

    // Get user statistics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: students } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    const { count: educators } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'educator');

    // Get additional statistics
    const { count: totalSkills } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true });

    const { count: activeProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('did', 'is', null);

    // Get completed assignments (any status that indicates completion)
    const { count: completedAssignments } = await supabase
      .from('task_assignments')
      .select('*', { count: 'exact', head: true })
      .or('status.eq.completed,status.eq.graded,status.eq.submitted');

    // Fetch detailed data
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, description, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: skills } = await supabase
      .from('skills')
      .select('id, label, description')
      .order('id', { ascending: false })
      .limit(10);

    // Fetch ratings data for displaying rating information
    const { data: ratingsData } = await supabase
      .from('ratings')
      .select('id, task, stars_avg, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    // Convert ratings data to the expected format
    const ratings: RatingDetail[] = ratingsData?.map(rating => ({
      id: rating.id,
      taskId: rating.task,
      taskTitle: `Task ${rating.task.substring(0, 8)}...`, // Placeholder since we don't fetch task title here
      starsAvg: rating.stars_avg,
      createdAt: rating.created_at
    })) || [];

    return {
      stats: {
        totalTasks: totalTasks || 0,
        openTasks: openTasks || 0,
        assignedTasks: inProgressTasks || 0,
        deliveredTasks: submittedTasks || 0,
        ratedTasks: gradedTasks || 0,
        totalUsers: totalUsers || 0,
        students: students || 0,
        educators: educators || 0,
        totalSkills: totalSkills || 0,
        activeProfiles: activeProfiles || 0,
        completedAssignments: completedAssignments || 0
      },
      detailedData: {
        tasks: tasks?.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          status: task.status,
          createdAt: task.created_at
        })) || [],
        profiles: profiles?.map(profile => ({
          id: profile.id,
          username: profile.username || 'N/A',
          role: profile.role,
          createdAt: profile.created_at
        })) || [],
        ratings: ratings,
        skills: skills?.map(skill => ({
          id: skill.id,
          label: skill.label,
          description: skill.description || ''
        })) || []
      }
    };
  } catch (error) {
    console.error('Error fetching public stats:', error);
    
    // Return default values in case of error
    return {
      stats: {
        totalTasks: 0,
        openTasks: 0,
        assignedTasks: 0,
        deliveredTasks: 0,
        ratedTasks: 0,
        totalUsers: 0,
        students: 0,
        educators: 0,
        totalSkills: 0,
        activeProfiles: 0,
        completedAssignments: 0
      },
      detailedData: {
        tasks: [],
        profiles: [],
        ratings: [],
        skills: []
      }
    };
  }
}

export default async function PublicAdminDashboard() {
  const { stats, detailedData } = await getPublicDashboardData();
  
  return <DashboardContent stats={stats} loading={false} detailedData={detailedData} />;
}
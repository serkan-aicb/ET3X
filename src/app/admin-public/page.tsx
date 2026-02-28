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

    // Get rated skills count from the old ratings table (skills stored as JSONB)
    // Since the new tables aren't in the generated types, we'll use the existing ratings table
    let totalRatedSkills = 0;
    
    // First try to get data from the new task_rating_skills table (should have 3423 records)
    try {
      const { count } = await supabase
        .from('task_rating_skills')
        .select('*', { count: 'exact', head: true });
      
      if (count !== null && count > 0) {
        totalRatedSkills = count;
      } else {
        // Fallback to the old ratings table if new table doesn't work
        const { data: ratingsForSkills } = await supabase
          .from('ratings')
          .select('skills');
        
        // Count total number of skills from all ratings
        if (ratingsForSkills) {
          for (const rating of ratingsForSkills) {
            if (rating.skills && typeof rating.skills === 'object' && Array.isArray(rating.skills)) {
              // Count each skill in the array
              totalRatedSkills += rating.skills.length;
            } else if (rating.skills && typeof rating.skills === 'string') {
              // If skills is a string representation of an array, try to parse it
              try {
                const parsedSkills = JSON.parse(rating.skills);
                if (Array.isArray(parsedSkills)) {
                  totalRatedSkills += parsedSkills.length;
                }
              } catch (e) {
                console.warn('Could not parse skills:', rating.skills);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('Could not access task_rating_skills table, falling back to old ratings table:', error);
      
      // Fallback to the old ratings table
      const { data: ratingsForSkills } = await supabase
        .from('ratings')
        .select('skills');
      
      // Count total number of skills from all ratings
      if (ratingsForSkills) {
        for (const rating of ratingsForSkills) {
          if (rating.skills && typeof rating.skills === 'object' && Array.isArray(rating.skills)) {
            // Count each skill in the array
            totalRatedSkills += rating.skills.length;
          } else if (rating.skills && typeof rating.skills === 'string') {
            // If skills is a string representation of an array, try to parse it
            try {
              const parsedSkills = JSON.parse(rating.skills);
              if (Array.isArray(parsedSkills)) {
                totalRatedSkills += parsedSkills.length;
              }
            } catch (e) {
              console.warn('Could not parse skills:', rating.skills);
            }
          }
        }
      }
    }

    // Use the more accurate counts from the related tables
    const inProgressTasks = assignedTasksFromAssignments || 0;
    const submittedTasks = submittedTasksFromSubmissions || 0;
    const gradedTasks = totalRatedSkills || 0;

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
      .order('id', { ascending: true }); // Order by ID ascending to get all skills in order

    console.log(`Fetched ${tasks?.length || 0} tasks, ${profiles?.length || 0} profiles, ${skills?.length || 0} skills`);

    // Fetch ratings data for displaying rating information
    // Try to get from the new task_rating_skills table first
    
    // Define type for intermediate rating data
    type TempRatingData = {
      id: string;
      task: string;
      stars_avg: number;
      created_at: string;
    };
    
    let ratingsDisplayData: TempRatingData[] = [];
    try {
      // Join task_ratings and task_rating_skills to get detailed rating information
      const { data } = await supabase
        .from('task_rating_skills')
        .select(`
          *,
          task_ratings!inner(task_id)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data && data.length > 0) {
        // Map the joined data to our expected format
        ratingsDisplayData = data.map(item => ({
          id: item.id,
          task: item.task_ratings?.task_id || '',
          stars_avg: item.stars,
          created_at: item.created_at
        }));
      } else {
        // Fallback to the old ratings table
        const { data: oldRatingsData } = await supabase
          .from('ratings')
          .select('id, task, stars_avg, created_at, skills')
          .order('created_at', { ascending: false })
          .limit(50);
        ratingsDisplayData = oldRatingsData || [];
      }
    } catch (error) {
      console.error('Error fetching ratings data from new tables, falling back to old table:', error);
      
      // Fallback to the old ratings table
      try {
        const { data: oldRatingsData } = await supabase
          .from('ratings')
          .select('id, task, stars_avg, created_at, skills')
          .order('created_at', { ascending: false })
          .limit(50);
        ratingsDisplayData = oldRatingsData || [];
      } catch (fallbackError) {
        console.error('Error fetching ratings data from old table:', fallbackError);
      }
    }

    // Convert ratings data to the expected format
    const ratings: RatingDetail[] = ratingsDisplayData?.map(rating => ({
      id: rating.id,
      taskId: rating.task,
      taskTitle: `Task ${rating.task.substring(0, 8)}...`, // Placeholder since we don't fetch task title here
      starsAvg: rating.stars_avg,
      createdAt: rating.created_at
    })) || [];

    console.log(`Fetched ${ratingsDisplayData?.length || 0} ratings`);

    return {
      stats: {
        totalTasks: totalTasks || 0,
        openTasks: openTasks || 0,
        assignedTasks: inProgressTasks || 0,
        deliveredTasks: submittedTasks || 0,
        ratedTasks: gradedTasks || 0, // Renamed to ratedSkills in UI
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
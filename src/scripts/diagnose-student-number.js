// Diagnose script for student number issues
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials (you'll need to provide these)
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseStudentNumberIssues() {
  console.log('Starting diagnosis of student number issues...\n');
  
  // 1. Check if profiles table exists and has the correct structure
  try {
    console.log('1. Checking profiles table structure...');
    const { data: profilesSample, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError.message);
      return;
    }
    
    console.log('✅ Profiles table accessible');
    if (profilesSample && profilesSample.length > 0) {
      const sampleProfile = profilesSample[0];
      console.log('Sample profile fields:', Object.keys(sampleProfile));
      
      // Check if matriculation_number field exists
      if ('matriculation_number' in sampleProfile) {
        console.log('✅ matriculation_number field exists in profiles table');
      } else {
        console.log('❌ matriculation_number field missing from profiles table');
      }
    }
  } catch (error) {
    console.error('❌ Error checking profiles table:', error.message);
  }
  
  // 2. Check if task_requests table exists and has the correct structure
  try {
    console.log('\n2. Checking task_requests table structure...');
    const { data: taskRequestsSample, error: taskRequestsError } = await supabase
      .from('task_requests')
      .select('*')
      .limit(1);
      
    if (taskRequestsError) {
      console.error('❌ Error accessing task_requests table:', taskRequestsError.message);
    } else {
      console.log('✅ task_requests table accessible');
      if (taskRequestsSample && taskRequestsSample.length > 0) {
        const sampleRequest = taskRequestsSample[0];
        console.log('Sample task_request fields:', Object.keys(sampleRequest));
        
        // Check if applicant_matriculation_number field exists
        if ('applicant_matriculation_number' in sampleRequest) {
          console.log('✅ applicant_matriculation_number field exists in task_requests table');
        } else {
          console.log('❌ applicant_matriculation_number field missing from task_requests table');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking task_requests table:', error.message);
  }
  
  // 3. Check if task_assignments table exists and has the correct structure
  try {
    console.log('\n3. Checking task_assignments table structure...');
    const { data: taskAssignmentsSample, error: taskAssignmentsError } = await supabase
      .from('task_assignments')
      .select('*')
      .limit(1);
      
    if (taskAssignmentsError) {
      console.error('❌ Error accessing task_assignments table:', taskAssignmentsError.message);
    } else {
      console.log('✅ task_assignments table accessible');
      if (taskAssignmentsSample && taskAssignmentsSample.length > 0) {
        const sampleAssignment = taskAssignmentsSample[0];
        console.log('Sample task_assignment fields:', Object.keys(sampleAssignment));
        
        // Check if assignee_matriculation_number field exists
        if ('assignee_matriculation_number' in sampleAssignment) {
          console.log('✅ assignee_matriculation_number field exists in task_assignments table');
        } else {
          console.log('❌ assignee_matriculation_number field missing from task_assignments table');
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking task_assignments table:', error.message);
  }
  
  // 4. Check RLS policies
  try {
    console.log('\n4. Checking RLS policies...');
    // This is a simplified check - in practice, you'd need to query the Postgres system tables
    console.log('ℹ️  RLS policy check requires direct database access');
  } catch (error) {
    console.error('❌ Error checking RLS policies:', error.message);
  }
  
  console.log('\nDiagnosis complete.');
}

// Run the diagnosis
diagnoseStudentNumberIssues();
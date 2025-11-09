import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { Database } from '../lib/supabase/types'

// Load environment variables
config({ path: '.env' })

async function checkDatabase() {
  console.log('Checking database connection and data...')
  
  // Check if environment variables are loaded
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables. Please check your .env file.')
    return
  }

  // Create Supabase client with service role key for full access
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Test connection by fetching skills
  console.log('Fetching skills from database...')
  const { data: skills, error } = await supabase
    .from('skills')
    .select('*')
    .limit(5)
  
  if (error) {
    console.error('Error fetching skills:', error)
    return
  }
  
  console.log(`Found ${skills?.length || 0} skills in database:`)
  if (skills && skills.length > 0) {
    skills.forEach((skill, index) => {
      console.log(`${index + 1}. ${skill.label}`)
    })
  }
  
  // Check profiles table
  console.log('\nChecking profiles table...')
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5)
  
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError)
  } else {
    console.log(`Found ${profiles?.length || 0} profiles in database`)
  }
  
  console.log('\nDatabase check completed.')
}

// Run the check function
checkDatabase().catch(console.error)
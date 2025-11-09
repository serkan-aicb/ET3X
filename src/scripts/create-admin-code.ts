import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { Database } from '../lib/supabase/types'

// Load environment variables
config({ path: '.env' })

async function createAdminCode() {
  console.log('Creating admin code...')
  
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
  
  // Create admin code
  const adminCode = {
    code: 'T3X-ADMIN-001',
    purpose: 'Initial admin access',
    valid_from: new Date().toISOString(),
    valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
  }
  
  console.log('Inserting admin code:', adminCode)
  
  const { data, error } = await supabase
    .from('admin_codes')
    .insert(adminCode)
    .select()
  
  if (error) {
    console.error('Error creating admin code:', error)
    return
  }
  
  console.log('Admin code created successfully:', data)
  console.log('\nYou can now access the admin panel at /admin-talent3x using the code: T3X-ADMIN-001')
}

// Run the create admin code function
createAdminCode().catch(console.error)
// Script to migrate existing ratings data from the old JSON structure to the new normalized tables
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Using service role key for full access
);

async function migrateRatingsData() {
  console.log('Starting ratings data migration...');
  
  try {
    // Fetch all existing ratings
    const { data: oldRatings, error } = await supabase
      .from('ratings')
      .select('*');
    
    if (error) {
      throw new Error(`Failed to fetch ratings: ${error.message}`);
    }
    
    console.log(`Found ${oldRatings.length} ratings to migrate`);
    
    let migratedCount = 0;
    
    // Process each rating
    for (const oldRating of oldRatings) {
      try {
        // 1. Insert into task_ratings table
        const { data: newTaskRating, error: insertError } = await supabase
          .from('task_ratings')
          .insert({
            task_id: oldRating.task,
            rater_id: oldRating.rater,
            rated_user_id: oldRating.rated_user,
            stars_avg: oldRating.stars_avg,
            xp: oldRating.xp,
            rating_session_hash: null, // Will be computed by the relayer
            task_id_hash: null, // Will be computed by the relayer
            subject_id_hash: null, // Will be computed by the relayer
            on_chain: false, // Initially not on chain
            created_at: oldRating.created_at
          })
          .select()
          .single();
        
        if (insertError) {
          console.error(`Failed to insert task rating for rating ID ${oldRating.id}:`, insertError.message);
          continue;
        }
        
        // 2. Parse skills JSON and insert into task_rating_skills table
        const skills = typeof oldRating.skills === 'string' 
          ? JSON.parse(oldRating.skills) 
          : oldRating.skills;
        
        if (skills && typeof skills === 'object') {
          // Convert object to array of {skill_id, stars} pairs
          const skillEntries = Object.entries(skills).map(([skillId, stars]) => ({
            rating_id: newTaskRating.id,
            skill_id: parseInt(skillId),
            stars: parseInt(stars),
            tx_hash: oldRating.tx_hash, // Preserve existing tx_hash if any
            on_chain: !!oldRating.tx_hash, // Mark as on-chain if tx_hash exists
            created_at: oldRating.created_at
          }));
          
          const { error: skillsInsertError } = await supabase
            .from('task_rating_skills')
            .insert(skillEntries);
          
          if (skillsInsertError) {
            console.error(`Failed to insert skill ratings for rating ID ${oldRating.id}:`, skillsInsertError.message);
            continue;
          }
        }
        
        migratedCount++;
        console.log(`Migrated rating ${oldRating.id} (${migratedCount}/${oldRatings.length})`);
      } catch (err) {
        console.error(`Error processing rating ${oldRating.id}:`, err.message);
      }
    }
    
    console.log(`Successfully migrated ${migratedCount} out of ${oldRatings.length} ratings`);
    console.log('Migration completed!');
    console.log('\nNext steps:');
    console.log('1. Execute the SQL function in src/scripts/update-task-ratings-on-chain-function.sql');
    console.log('2. Run: SELECT update_task_ratings_on_chain_status();');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrateRatingsData();
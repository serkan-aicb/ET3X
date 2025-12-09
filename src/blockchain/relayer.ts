// Relayer service for anchoring skill ratings to Polygon MAINNET
// This service reads unrated sessions from Supabase and calls the smart contract on Polygon MAINNET once per skill

import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import { keccak256, toUtf8Bytes } from 'ethers';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Type definitions
interface TaskRating {
  id: string;
  task_id: string;
  rater_id: string;
  rated_user_id: string;
  stars_avg: number;
  xp: number;
  rating_session_hash: string | null;
  task_id_hash: string | null;
  subject_id_hash: string | null;
  on_chain: boolean;
  created_at: string;
}

interface TaskRatingSkill {
  id: string;
  rating_id: string;
  skill_id: number;
  stars: number;
  tx_hash: string | null;
  on_chain: boolean;
  created_at: string;
}

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Load the new contract ABI
const TALENT3X_SKILL_RATINGS_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "ratingSessionHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "taskIdHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "subjectIdHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "raterDid",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ratedDid",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "skillId",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "skillName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "stars",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint40",
        "name": "timestamp",
        "type": "uint40"
      }
    ],
    "name": "SkillRatingAnchored",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "ratingSessionHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "taskIdHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "subjectIdHash",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "raterDid",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ratedDid",
        "type": "string"
      },
      {
        "internalType": "uint16",
        "name": "skillId",
        "type": "uint16"
      },
      {
        "internalType": "string",
        "name": "skillName",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "stars",
        "type": "uint8"
      }
    ],
    "name": "anchorSingleSkillRating",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_relayer",
        "type": "address"
      }
    ],
    "name": "setRelayer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "relayer",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Compute keccak256 hash of a string
 * @param str The string to hash
 * @returns The hash as a hex string
 */
function hashString(str: string): string {
  return keccak256(toUtf8Bytes(str));
}

/**
 * Compute the rating session hash based on the canonical JSON structure
 * @param rating The task rating object
 * @param skills The skills array for this rating
 * @returns The rating session hash
 */
function computeRatingSessionHash(rating: TaskRating, skills: TaskRatingSkill[]): string {
  // Create canonical JSON structure
  const canonicalJson = {
    rating_id: rating.id,
    task_id: rating.task_id,
    rater_id: rating.rater_id,
    rated_user_id: rating.rated_user_id,
    stars_avg: rating.stars_avg,
    xp: rating.xp,
    skills: skills.map(skill => ({
      skill_id: skill.skill_id,
      stars: skill.stars
    })).sort((a, b) => a.skill_id - b.skill_id) // Sort by skill_id for canonical representation
  };

  // Convert to JSON string and hash it
  const jsonString = JSON.stringify(canonicalJson);
  return keccak256(toUtf8Bytes(jsonString));
}

/**
 * Process all unrated sessions and anchor them to the blockchain
 */
async function processUnratedSessions() {
  console.log('Starting relayer service...');
  
  // Check if required environment variables are set
  if (!process.env.POLYGON_RPC_URL || !process.env.RELAYER_PRIVATE_KEY || !process.env.T3X_SKILL_RATINGS_CONTRACT_ADDRESS) {
    throw new Error('Missing required environment variables: POLYGON_RPC_URL, RELAYER_PRIVATE_KEY, T3X_SKILL_RATINGS_CONTRACT_ADDRESS');
  }
  
  try {
    // Connect to the Polygon MAINNET
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider);
    
    console.log('Connected to Polygon MAINNET with address:', wallet.address);
    
    // Create contract instance
    const contract = new ethers.Contract(
      process.env.T3X_SKILL_RATINGS_CONTRACT_ADDRESS,
      TALENT3X_SKILL_RATINGS_ABI,
      wallet
    );
    
    // Load all task_ratings where on_chain = false
    console.log('Loading unrated task ratings...');
    const { data: unratedRatings, error: ratingsError } = await supabase
      .from('task_ratings')
      .select('*')
      .eq('on_chain', false)
      .order('created_at', { ascending: true }); // Process oldest first
    
    if (ratingsError) {
      throw new Error(`Failed to fetch unrated ratings: ${ratingsError.message}`);
    }
    
    console.log(`Found ${unratedRatings?.length || 0} unrated task ratings`);
    
    if (!unratedRatings || unratedRatings.length === 0) {
      console.log('No unrated sessions found. Exiting.');
      return;
    }
    
    // Process each unrated rating
    for (const rating of unratedRatings) {
      try {
        console.log(`Processing rating session: ${rating.id}`);
        
        // Load related skill rows from task_rating_skills with skill names
        const { data: skills, error: skillsError } = await supabase
          .from('task_rating_skills')
          .select(`
            *,
            skill:skills(name)
          `)
          .eq('rating_id', rating.id);
        
        if (skillsError) {
          console.error(`Failed to fetch skills for rating ${rating.id}:`, skillsError.message);
          continue;
        }
        
        if (!skills || skills.length === 0) {
          console.warn(`No skills found for rating ${rating.id}. Skipping.`);
          continue;
        }
        
        // Fetch DIDs for rater and rated user separately
        let raterDid = '';
        let ratedDid = '';
        
        try {
          const { data: raterData, error: raterError } = await supabase
            .from('user_profiles')
            .select('did')
            .eq('id', rating.rater_id)
            .single();
          
          if (!raterError && raterData) {
            raterDid = raterData.did || '';
          }
        } catch (err) {
          console.warn(`Failed to fetch rater DID for rating ${rating.id}:`, (err as Error).message);
        }
        
        try {
          const { data: ratedData, error: ratedError } = await supabase
            .from('user_profiles')
            .select('did')
            .eq('id', rating.rated_user_id)
            .single();
          
          if (!ratedError && ratedData) {
            ratedDid = ratedData.did || '';
          }
        } catch (err) {
          console.warn(`Failed to fetch rated user DID for rating ${rating.id}:`, (err as Error).message);
        }
        
        // Compute hashes
        const ratingSessionHash = computeRatingSessionHash(rating, skills);
        const taskIdHash = hashString(rating.task_id);
        const subjectIdHash = hashString(rating.rated_user_id);
        
        console.log(`Computed hashes for rating ${rating.id}:`);
        console.log(`  Rating Session Hash: ${ratingSessionHash}`);
        console.log(`  Task ID Hash: ${taskIdHash}`);
        console.log(`  Subject ID Hash: ${subjectIdHash}`);
        console.log(`  Rater DID: ${raterDid}`);
        console.log(`  Rated DID: ${ratedDid}`);
        
        // Update the hashes in the database
        const { error: updateError } = await supabase
          .from('task_ratings')
          .update({
            rating_session_hash: ratingSessionHash,
            task_id_hash: taskIdHash,
            subject_id_hash: subjectIdHash
          })
          .eq('id', rating.id);
        
        if (updateError) {
          console.error(`Failed to update hashes for rating ${rating.id}:`, updateError.message);
          continue;
        }
        
        let allSkillsAnchored = true;
        
        // For each skill row: call anchorSingleSkillRating(...) on the contract
        for (const skill of skills) {
          if (skill.on_chain) {
            console.log(`Skill ${skill.skill_id} already anchored. Skipping.`);
            continue;
          }
          
          try {
            console.log(`Anchoring skill ${skill.skill_id} for rating ${rating.id}...`);
            
            // Get skill name
            const skillName = skill.skill?.name || `Skill ${skill.skill_id}`;
            
            // Call the contract function with the new parameters
            const tx = await contract.anchorSingleSkillRating(
              ratingSessionHash,
              taskIdHash,
              subjectIdHash,
              raterDid,
              ratedDid,
              skill.skill_id,
              skillName,
              skill.stars
            );
            
            console.log(`Transaction sent for skill ${skill.skill_id}. Hash: ${tx.hash}`);
            
            // Wait for the transaction to be mined
            const receipt = await tx.wait();
            console.log(`Transaction confirmed for skill ${skill.skill_id} in block ${receipt.blockNumber}`);
            
            // Save tx_hash in task_rating_skills
            const { error: skillUpdateError } = await supabase
              .from('task_rating_skills')
              .update({
                tx_hash: receipt.hash,
                on_chain: true
              })
              .eq('id', skill.id);
            
            if (skillUpdateError) {
              console.error(`Failed to update skill ${skill.skill_id}:`, skillUpdateError.message);
              allSkillsAnchored = false;
            } else {
              console.log(`Successfully anchored skill ${skill.skill_id}`);
            }
          } catch (err) {
            console.error(`Failed to anchor skill ${skill.skill_id}:`, (err as Error).message);
            allSkillsAnchored = false;
          }
        }
        
        // If all skills for a session are on-chain, mark task_ratings.on_chain = true
        if (allSkillsAnchored) {
          const { error: ratingUpdateError } = await supabase
            .from('task_ratings')
            .update({ on_chain: true })
            .eq('id', rating.id);
          
          if (ratingUpdateError) {
            console.error(`Failed to update rating ${rating.id} as on-chain:`, ratingUpdateError.message);
          } else {
            console.log(`Successfully marked rating ${rating.id} as on-chain`);
          }
        }
      } catch (err) {
        console.error(`Error processing rating ${rating.id}:`, (err as Error).message);
      }
    }
    
    console.log('Relayer service completed.');
  } catch (err) {
    console.error('Relayer service failed:', (err as Error).message);
    process.exit(1);
  }
}

// CLI entry point
if (require.main === module) {
  processUnratedSessions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { processUnratedSessions };
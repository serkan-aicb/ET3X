import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase/types'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env' })

// Skills data (20 skills as provided)
const skills = [
  {"label":"Observation of Thinking Skills","description":"Recognize and reflect on own use of analytical, critical, and creative thinking."},
  {"label":"Critical Thinking","description":"Apply structured reasoning to evaluate knowledge, claims, and practices."},
  {"label":"Problem Solving","description":"Identify and resolve complex or unpredictable problems effectively."},
  {"label":"Creative Problem Solving","description":"Apply non-standard approaches to generate novel solutions."},
  {"label":"Solution Design","description":"Structure and design innovative solutions to identified problems."},
  {"label":"Applying Theory to Practice","description":"Transfer abstract concepts and theories into practical applications."},
  {"label":"Group Learning Facilitation","description":"Support learning and development within groups."},
  {"label":"Lifelong Learning","description":"Commit to continuous learning throughout career."},
  {"label":"Professional Conduct","description":"Demonstrate ethical, responsible, and reliable behavior in professional settings."},
  {"label":"Cultural Sensitivity","description":"Respect and adapt to cultural differences."},
  {"label":"Inclusive Collaboration","description":"Work inclusively in multicultural contexts."},
  {"label":"Cross-Cultural Communication","description":"Communicate effectively across cultures."},
  {"label":"Sustainability Awareness","description":"Recognize sustainability dimensions and impacts."},
  {"label":"UN SDG Knowledge","description":"Understand UN Sustainable Development Goals."},
  {"label":"Research Sustainability Integration","description":"Integrate sustainability into research."},
  {"label":"Stakeholder Impact Assessment","description":"Evaluate effects of actions on stakeholders."},
  {"label":"Interdisciplinary Connection","description":"Recognize conceptual and practical links between fields."},
  {"label":"Constructive Feedback","description":"Provide useful and respectful feedback."},
  {"label":"Digital Literacy","description":"Use digital tools effectively."},
  {"label":"Public Speaking","description":"Deliver presentations to groups."}
];

async function seedSkills() {
  // Check if environment variables are loaded
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables. Please check your .env file.');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'Not found');
    return;
  }

  // Create Supabase client with service role key for full access
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  console.log('Seeding skills...');
  
  // Insert skills
  const { data, error } = await supabase
    .from('skills')
    .insert(skills)
    .select();
  
  if (error) {
    console.error('Error seeding skills:', error);
    return;
  }
  
  console.log(`Successfully seeded ${data?.length || 0} skills`);
}

// Run the seed function
seedSkills().catch(console.error);
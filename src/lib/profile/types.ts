import { Tables } from '@/lib/supabase/types';

export type Profile = Tables<'profiles'>;
export type Skill = Tables<'skills'>;
export type TaskRating = Tables<'task_ratings'>;
export type TaskRatingSkill = Tables<'task_rating_skills'>;
export type Task = Tables<'tasks'>;

export type ProfileWithMatriculation = Profile & {
  matriculation_number?: string | null;
};

export type SkillLevel = 'Foundation' | 'Intermediate' | 'Advanced' | 'Exceptional';

export interface TopSkill {
  skill_id: number;
  name: string;
  score: number;
  level: SkillLevel;
  evidence_count: number;
}

export interface Proof {
  proof_id: string;
  title: string;
  description: string | null;
  evaluation_score: number;
  skills: string[];
  timestamp: string;
  task_difficulty: string | null;
  on_chain: boolean;
  tx_hash: string | null;
}

export interface TrustMetrics {
  total_evaluations: number;
  total_proofs: number;
  verified: boolean;
}

export interface ProfileStudioData {
  profile: ProfileWithMatriculation | null;
  topSkills: TopSkill[];
  proofs: Proof[];
  trustMetrics: TrustMetrics;
  loading: boolean;
  error: Error | null;
}

export interface RawSkillRating {
  skillId: number;
  skillValue: number;
  taskId: string;
  taskTitle: string;
  taskDifficulty: 'Novice' | 'Skilled' | 'Expert' | 'Master' | null;
  onChain: boolean;
  txHash: string | null;
}

export interface AggregatedTaskRating {
  taskId: string;
  taskTitle: string;
  avgRating: number;
  ratingCount: number;
  taskDifficulty: 'Novice' | 'Skilled' | 'Expert' | 'Master' | null;
}

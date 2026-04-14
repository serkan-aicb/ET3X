"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TopSkill, RawSkillRating } from '@/lib/profile/types';
import { aggregateSkillRatings } from '@/lib/profile/aggregation';

interface UseSkillRatingsReturn {
  topSkills: TopSkill[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSkillRatings(
  userId: string | null,
  skillNames: Map<number, string>
): UseSkillRatingsReturn {
  const [topSkills, setTopSkills] = useState<TopSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSkillRatings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { data: skillRatingsData, error: skillRatingsError } = await supabase
        .from('task_rating_skills')
        .select(`
          *,
          task_ratings!inner(
            task_id,
            rated_user_id,
            created_at,
            tasks!task_ratings_task_id_fkey(title, skill_level)
          )
        `)
        .eq('task_ratings.rated_user_id', userId);

      if (skillRatingsError) {
        throw new Error(`Failed to fetch skill ratings: ${skillRatingsError.message}`);
      }

      if (!skillRatingsData) {
        setTopSkills([]);
        return;
      }

      const rawRatings: RawSkillRating[] = skillRatingsData.map((rating: {
        skill_id: number;
        stars: number;
        on_chain: boolean;
        tx_hash: string | null;
        task_ratings: {
          task_id: string;
          tasks: {
            title: string;
            skill_level: 'Novice' | 'Skilled' | 'Expert' | 'Master' | null;
          } | null;
        } | null;
      }) => ({
        skillId: rating.skill_id,
        skillValue: rating.stars,
        taskId: rating.task_ratings?.task_id || '',
        taskTitle: rating.task_ratings?.tasks?.title || 'Unknown Task',
        taskDifficulty: rating.task_ratings?.tasks?.skill_level || null,
        onChain: rating.on_chain,
        txHash: rating.tx_hash
      }));

      const aggregated = aggregateSkillRatings(rawRatings, skillNames);
      setTopSkills(aggregated);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [userId, skillNames]);

  useEffect(() => {
    fetchSkillRatings();
  }, [fetchSkillRatings]);

  return {
    topSkills,
    loading,
    error,
    refetch: fetchSkillRatings
  };
}

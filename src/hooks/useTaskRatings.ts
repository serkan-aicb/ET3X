"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Proof, TrustMetrics } from '@/lib/profile/types';
import { calculateTrustMetrics, formatProofsFromTaskRatings } from '@/lib/profile/aggregation';

interface TaskRatingWithTask {
  id: string;
  task_id: string;
  stars_avg: number;
  created_at: string;
  on_chain: boolean;
  tx_hash: string | null;
  tasks: {
    title: string;
    description: string | null;
    skill_level: string | null;
  } | null;
}

interface UseTaskRatingsReturn {
  proofs: Proof[];
  trustMetrics: TrustMetrics;
  taskSkillMap: Map<string, number[]>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useTaskRatings(
  userId: string | null,
  skillNames: Map<number, string>
): UseTaskRatingsReturn {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [trustMetrics, setTrustMetrics] = useState<TrustMetrics>({
    total_evaluations: 0,
    total_proofs: 0,
    verified: false
  });
  const [taskSkillMap, setTaskSkillMap] = useState<Map<string, number[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTaskRatings = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { data: taskRatingsData, error: taskRatingsError } = await supabase
        .from('task_ratings')
        .select(`
          *,
          tasks!task_ratings_task_id_fkey(title, description, skill_level)
        `)
        .eq('rated_user_id', userId)
        .order('created_at', { ascending: false });

      if (taskRatingsError) {
        throw new Error(`Failed to fetch task ratings: ${taskRatingsError.message}`);
      }

      const taskRatings = (taskRatingsData || []) as TaskRatingWithTask[];

      const { data: skillRatingsData, error: skillRatingsError } = await supabase
        .from('task_rating_skills')
        .select(`
          skill_id,
          task_ratings!inner(task_id, rated_user_id)
        `)
        .eq('task_ratings.rated_user_id', userId);

      if (skillRatingsError) {
        throw new Error(`Failed to fetch skill ratings: ${skillRatingsError.message}`);
      }

      const skillMap = new Map<string, number[]>();
      skillRatingsData?.forEach((item) => {
        const taskRatings = item.task_ratings as unknown as { task_id: string }[] | null;
        const taskId = taskRatings?.[0]?.task_id;
        if (taskId) {
          if (!skillMap.has(taskId)) {
            skillMap.set(taskId, []);
          }
          skillMap.get(taskId)!.push(item.skill_id as number);
        }
      });
      setTaskSkillMap(skillMap);

      const onChainCount = taskRatings.filter(r => r.on_chain).length;
      
      setTrustMetrics(calculateTrustMetrics(taskRatings.length, onChainCount));
      
      const formattedProofs = formatProofsFromTaskRatings(
        taskRatings,
        skillNames,
        skillMap
      );
      setProofs(formattedProofs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [userId, skillNames]);

  useEffect(() => {
    fetchTaskRatings();
  }, [fetchTaskRatings]);

  return {
    proofs,
    trustMetrics,
    taskSkillMap,
    loading,
    error,
    refetch: fetchTaskRatings
  };
}

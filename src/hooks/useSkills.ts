"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Skill } from '@/lib/profile/types';

interface UseSkillsReturn {
  skills: Skill[];
  skillsMap: Map<number, string>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSkills(): UseSkillsReturn {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsMap, setSkillsMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: skillsError } = await supabase
        .from('skills')
        .select('*');

      if (skillsError) {
        throw new Error(`Failed to fetch skills: ${skillsError.message}`);
      }

      const skillList = (data || []) as Skill[];
      setSkills(skillList);

      const map = new Map<number, string>();
      skillList.forEach(skill => {
        map.set(skill.id, skill.label);
      });
      setSkillsMap(map);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return {
    skills,
    skillsMap,
    loading,
    error,
    refetch: fetchSkills
  };
}

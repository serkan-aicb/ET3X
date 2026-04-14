import { RawSkillRating, TopSkill, SkillLevel, Proof, TrustMetrics } from './types';

const DIFFICULTY_WEIGHTS: Record<string, number> = {
  'Novice': 0.5,
  'Skilled': 1.25,
  'Expert': 2.0,
  'Master': 3.0
};

const SCORE_TO_LEVEL: { threshold: number; level: SkillLevel }[] = [
  { threshold: 80, level: 'Exceptional' },
  { threshold: 60, level: 'Advanced' },
  { threshold: 40, level: 'Intermediate' },
  { threshold: 0, level: 'Foundation' }
];

export function calculateWeightedSkillScore(
  ratings: { value: number; difficulty: string | null }[]
): number {
  if (ratings.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  ratings.forEach(rating => {
    const weight = rating.difficulty ? DIFFICULTY_WEIGHTS[rating.difficulty] || 1 : 1;
    // Convert 1-5 scale to 0-100 scale
    const normalizedScore = ((rating.value - 1) / 4) * 100;
    weightedSum += normalizedScore * weight;
    totalWeight += weight;
  });

  const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return Math.min(Math.round(weightedAverage), 100);
}

export function getSkillLevel(score: number): SkillLevel {
  for (const { threshold, level } of SCORE_TO_LEVEL) {
    if (score >= threshold) return level;
  }
  return 'Foundation';
}

export function aggregateSkillRatings(
  rawRatings: RawSkillRating[],
  skillNames: Map<number, string>
): TopSkill[] {
  const skillRatingsMap = new Map<number, {
    skillId: number;
    ratings: { value: number; difficulty: string | null }[];
  }>();

  rawRatings.forEach(rating => {
    if (!skillRatingsMap.has(rating.skillId)) {
      skillRatingsMap.set(rating.skillId, {
        skillId: rating.skillId,
        ratings: []
      });
    }

    const skillEntry = skillRatingsMap.get(rating.skillId)!;
    skillEntry.ratings.push({
      value: rating.skillValue,
      difficulty: rating.taskDifficulty
    });
  });

  const aggregatedSkills: TopSkill[] = Array.from(skillRatingsMap.values())
    .map(skill => {
      const score = calculateWeightedSkillScore(skill.ratings);
      return {
        skill_id: skill.skillId,
        name: skillNames.get(skill.skillId) || `Skill #${skill.skillId}`,
        score,
        level: getSkillLevel(score),
        evidence_count: skill.ratings.length
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return aggregatedSkills;
}

export function calculateTrustMetrics(
  taskRatingsCount: number,
  onChainRatingsCount: number
): TrustMetrics {
  return {
    total_evaluations: taskRatingsCount,
    total_proofs: taskRatingsCount,
    verified: onChainRatingsCount > 0
  };
}

export function formatProofsFromTaskRatings(
  taskRatings: {
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
  }[],
  skillNames: Map<number, string>,
  taskSkillMap: Map<string, number[]>
): Proof[] {
  return taskRatings
    .slice(0, 5)
    .map(rating => {
      const skillIds = taskSkillMap.get(rating.task_id) || [];
      const skills = skillIds.map(id => skillNames.get(id) || `Skill #${id}`);

      return {
        proof_id: rating.id,
        title: rating.tasks?.title || 'Unknown Task',
        description: rating.tasks?.description || null,
        evaluation_score: rating.stars_avg,
        skills: skills.slice(0, 3),
        timestamp: rating.created_at,
        task_difficulty: rating.tasks?.skill_level || null,
        on_chain: rating.on_chain,
        tx_hash: rating.tx_hash
      };
    });
}

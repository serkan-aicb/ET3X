export type SkillScore = { skillId: number; stars: 1|2|3|4|5 };
export type Level = "Novice" | "Skilled" | "Expert" | "Master";

const BASE_XP = 50;
const STAR_MULT = 30;                   // per average star
const LEVEL_MULT: Record<Level, number> = {
  Novice: 1.0, Skilled: 1.2, Expert: 1.5, Master: 1.8
};
const ON_TIME_BONUS = 1.10;             // submitted on/before due date
const XP_MIN_MAX = [25, 600] as const;  // clamp

export function computeStarsAvg(scores: SkillScore[]): number {
  const n = Math.max(1, scores.length);
  const sum = scores.reduce((a, s) => a + s.stars, 0);
  return Math.round((sum / n) * 10) / 10; // one decimal
}

export function computeXP(opts: {
  scores: SkillScore[];
  level: Level;
  // Removed seats parameter as group dampening is no longer needed
  submittedAt: Date;
  dueAt?: Date | null;
}) {
  const starsAvg = computeStarsAvg(opts.scores);

  // Removed group dampening logic since task_mode handles this differently
  const onTime =
    opts.dueAt ? opts.submittedAt.getTime() <= opts.dueAt.getTime() : true;

  let xp =
    BASE_XP +
    STAR_MULT * starsAvg;                      // core
  xp *= LEVEL_MULT[opts.level];                // difficulty
  // Removed group dampening factor
  if (onTime) xp *= ON_TIME_BONUS;             // timeliness

  // clamp + integerize
  xp = Math.round(
    Math.min(XP_MIN_MAX[1], Math.max(XP_MIN_MAX[0], xp))
  );

  return { starsAvg, xp };
}
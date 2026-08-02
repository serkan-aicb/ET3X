/**
 * Shared v1.6 profile types (Week 5). The onboarding draft types are lifted
 * here (they were local to the onboarding page) so the profile can read the
 * same data. Kept separate from the pre-v1.6 `types.ts` (skills/task_ratings),
 * which still backs the educator profile.
 */

export type Method = "cv" | "linkedin";
export type EduRow = { school: string; degree: string; year: string };
export type ExpRow = { role: string; org: string; period: string };

/** Written by /s/onboarding to DRAFT_KEYS.onboardingDraft. */
export type OnboardingDraft = {
  step: number;
  method: Method;
  name: string;
  headline: string;
  education: EduRow[];
  experience: ExpRow[];
  skillIds: string[];
};

/** Owner-editable basics, DRAFT_KEYS.profile (seeded from onboarding). */
export type ProfileBasics = {
  name: string;
  headline: string;
  bio: string;
  avatarDataUrl: string; // "" = none; localStorage stub for Supabase storage
};

/** Mirrors Cyprian's `profile_capability_scores` output row (drop-in swap).
 *  v6: a capability is Confirmed at ≥3 rated skills (was ≥3 evaluations). */
export type CapabilityScore = {
  capability_id: string;
  capability_score: number;
  rated_skill_count: number;
  display_status: "confirmed" | "provisional";
  scoring_version: string;
};

/* ---- assembled view-model consumed by <CapabilityProfile> ------------- */

export type ProfileCapabilityView = {
  capability_id: string;
  name: string;
  value: number;
  ratedSkills: number;
  provisional: boolean;
};

export type ProfileContribution = {
  action_id: string;
  title: string;
  capabilities: string[];
  evaluatedBy: string;
  score: number;
  date: string;
  difficulty: string;
};

export type GrowthPoint = { date: string; value: number };
export type CapabilityGrowth = { capability_id: string; name: string; points: GrowthPoint[] };

export type ProfileView = {
  basics: ProfileBasics;
  slug: string;
  university: string;
  role: string;
  trust: { evaluations: number; capabilities: number; verified: number };
  capabilities: ProfileCapabilityView[];
  contributions: ProfileContribution[];
  timeline: { date: string; title: string; score: number }[];
  education: EduRow[];
  experience: ExpRow[];
  growth: CapabilityGrowth[];
  headline_story: string | null;
  hasData: boolean; // any evaluations at all
};

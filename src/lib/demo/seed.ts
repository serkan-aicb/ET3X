/**
 * Demo data seeder (frozen build) — populates localStorage with one coherent,
 * good-looking individual profile so the app can be shown live (to André & co.)
 * without running the whole loop by hand. Also a one-shot "clear everything".
 *
 * Everything is built from the REAL catalogue (getCapabilities / getSkillsFor-
 * Capability), so capability names, Confirmed/Provisional statuses and scores are
 * genuine — it exercises the exact same code paths a real user would.
 *
 * Not wired to any backend. Reachable at /demo.
 */

import { DRAFT_KEYS, writeDraft } from "@/lib/local-draft";
import {
  getCapabilities,
  getSkillsForCapability,
  getScoringParam,
  getRubric,
  type Skill,
} from "@/lib/catalogue";
import { signIn, signOut } from "@/lib/auth/local-session";
import type {
  ActionRecord,
  ActionSkill,
  Evaluation,
  Evidence,
  SkillScore,
} from "@/lib/actions/types";
import type { OnboardingDraft, ProfileBasics } from "@/lib/profile/profile-types";

export const DEMO_PERSONA = {
  name: "Aino Virtanen",
  email: "aino.virtanen@student.oulu.fi",
  organisation: "University of Oulu",
  function: "MSc Student",
  headline: "MSc Information Processing Science · University of Oulu",
  bio: "Turning real project work into verified capabilities. Interested in product analytics, data governance and how teams actually make decisions.",
};

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString();

const toActionSkill = (s: Skill): ActionSkill => ({
  skill_id: s.skill_id,
  capability_id_resolved: s.capability_id,
});

const rate = (skills: Skill[], scores: number[]): SkillScore[] =>
  skills.map((s, i) => {
    const score = scores[i] ?? 4;
    const row: SkillScore = {
      skill_id: s.skill_id,
      capability_id_resolved: s.capability_id,
      score,
    };
    // R6: a comment is required per skill scored 0/1/5.
    if (score === 0 || score === 1 || score === 5) {
      row.comment = "Standout, clearly-evidenced work on this skill.";
    }
    return row;
  });

const evidence = (note: string, link: string): Evidence => ({
  note,
  link,
  mode: "external_reference",
  files: [],
});

const scoringVersion = () => getScoringParam("scoring_version") ?? "1.1";
const rubricVersionFor = (capabilityId: string) =>
  getRubric(capabilityId)[0]?.rubric_version ?? "0.9-draft";

/**
 * Writes the demo profile to localStorage and signs the demo user in.
 * Returns the destination to navigate to.
 */
export function seedDemoProfile(): string {
  // Capabilities with enough skills for a strong showing; prefer validated_pilot.
  const pool = getCapabilities()
    .filter((c) => getSkillsForCapability(c.capability_id).length >= 4)
    .sort(
      (a, b) =>
        (a.activation_scope === "validated_pilot" ? 0 : 1) -
        (b.activation_scope === "validated_pilot" ? 0 : 1)
    );

  const [capA, capB, capC, capD] = pool.slice(0, 4);
  if (!capA || !capB || !capC || !capD) {
    throw new Error("Catalogue does not have enough capabilities to seed a demo.");
  }

  const aSkills = getSkillsForCapability(capA.capability_id).slice(0, 5);
  const bSkills = getSkillsForCapability(capB.capability_id).slice(0, 4);
  const cSkills = getSkillsForCapability(capC.capability_id).slice(0, 4);
  const dSkills = getSkillsForCapability(capD.capability_id).slice(0, 2);

  // ---- Actions (real work) --------------------------------------------------
  const actions: ActionRecord[] = [
    {
      action_id: "demo-act-1",
      title: "Redesigned the onboarding analytics dashboard",
      description:
        "Rebuilt the product's activation dashboard end to end: reframed the metrics, redesigned the layout and shipped it with the data team.",
      expected_outcome: "A clearer activation dashboard the team relies on to make decisions.",
      action_skills: [...aSkills, ...bSkills.slice(0, 2)].map(toActionSkill),
      ai_involvement: "ai_assisted",
      difficulty_declared: "ADVANCED",
      evidence: evidence(
        "Before/after dashboards + the write-up shared with the team.",
        "https://example.com/aino/dashboard-redesign"
      ),
      org_visibility: "yes",
      created_at: daysAgo(96),
    },
    {
      action_id: "demo-act-2",
      title: "Led a cross-team sprint retrospective",
      description:
        "Facilitated a retro across three squads, synthesised the themes and drove three concrete process changes that stuck.",
      expected_outcome: "Three agreed process changes adopted across the squads.",
      action_skills: cSkills.map(toActionSkill),
      ai_involvement: "none",
      difficulty_declared: "INTERMEDIATE",
      evidence: evidence(
        "Retro board export and the follow-up action log.",
        "https://example.com/aino/retro"
      ),
      org_visibility: "yes",
      created_at: daysAgo(62),
    },
    {
      action_id: "demo-act-3",
      title: "Authored the data-governance proposal",
      description:
        "Wrote and socialised a data-governance proposal (ownership, retention, access) that was adopted by the department.",
      expected_outcome: "A governance proposal (ownership, retention, access) adopted by the department.",
      action_skills: [...bSkills, ...dSkills].map(toActionSkill),
      ai_involvement: "ai_assisted",
      difficulty_declared: "ADVANCED",
      evidence: evidence(
        "The proposal document and the adoption note.",
        "https://example.com/aino/data-governance"
      ),
      org_visibility: "yes",
      created_at: daysAgo(28),
    },
  ];

  // ---- Evaluations (skill-level, v6) ---------------------------------------
  const evaluations: Evaluation[] = [
    {
      evaluation_id: "demo-ev-1",
      action_id: "demo-act-1",
      evaluator_id: "prof.laine@oulu.fi",
      skill_scores: [...rate(aSkills, [5, 4, 5, 4, 4]), ...rate(bSkills.slice(0, 2), [3, 3])],
      evidence_quality: 5,
      difficulty_confirmed: "ADVANCED",
      evaluator_role: "PROFESSOR",
      evaluator_relationship: "MANAGER",
      evaluator_verification_tier: 0,
      rubric_version: rubricVersionFor(capA.capability_id),
      scoring_version: scoringVersion(),
      created_at: daysAgo(90),
    },
    {
      evaluation_id: "demo-ev-2",
      action_id: "demo-act-2",
      evaluator_id: "mentor.harju@nokia.com",
      skill_scores: rate(cSkills, [4, 3, 4, 4]),
      evidence_quality: 4,
      difficulty_confirmed: "INTERMEDIATE",
      evaluator_role: "MENTOR",
      evaluator_relationship: "PEER",
      evaluator_verification_tier: 0,
      rubric_version: rubricVersionFor(capC.capability_id),
      scoring_version: scoringVersion(),
      created_at: daysAgo(58),
    },
    {
      evaluation_id: "demo-ev-3",
      action_id: "demo-act-3",
      evaluator_id: "client.makela@company.fi",
      skill_scores: [...rate(bSkills, [5, 4, 5, 4]), ...rate(dSkills, [4, 3])],
      evidence_quality: 5,
      difficulty_confirmed: "ADVANCED",
      evaluator_role: "CLIENT",
      evaluator_relationship: "EXTERNAL",
      evaluator_verification_tier: 0,
      rubric_version: rubricVersionFor(capB.capability_id),
      scoring_version: scoringVersion(),
      created_at: daysAgo(24),
    },
  ];

  // ---- Profile basics + onboarding -----------------------------------------
  const skillIds = [
    ...new Set([...aSkills, ...bSkills, ...cSkills, ...dSkills].map((s) => s.skill_id)),
  ];

  const onboarding: OnboardingDraft = {
    step: 3,
    method: "cv",
    name: DEMO_PERSONA.name,
    headline: DEMO_PERSONA.headline,
    education: [
      { school: "University of Oulu", degree: "MSc Information Processing Science", year: "2024–2026" },
      { school: "University of Oulu", degree: "BSc Information Processing Science", year: "2020–2024" },
    ],
    experience: [
      { role: "Product Analyst Intern", org: "Nokia", period: "Summer 2025" },
      { role: "Research Assistant", org: "University of Oulu", period: "2024–2025" },
    ],
    skillIds,
  };

  const basics: ProfileBasics = {
    name: DEMO_PERSONA.name,
    headline: DEMO_PERSONA.headline,
    bio: DEMO_PERSONA.bio,
    avatarDataUrl: "",
  };

  // ---- Commit to localStorage ----------------------------------------------
  signIn({
    role: "student",
    name: DEMO_PERSONA.name,
    email: DEMO_PERSONA.email,
    organisation: DEMO_PERSONA.organisation,
    function: DEMO_PERSONA.function,
  });
  writeDraft(DRAFT_KEYS.onboardingDraft, onboarding);
  writeDraft(DRAFT_KEYS.onboardingComplete, true);
  writeDraft(DRAFT_KEYS.profile, basics);
  writeDraft(DRAFT_KEYS.actionsDrafts, actions);
  writeDraft(DRAFT_KEYS.evaluations, evaluations);
  writeDraft(DRAFT_KEYS.evaluationInvites, []);
  writeDraft(DRAFT_KEYS.assignments, []);

  return "/s/profile";
}

/** Wipes ALL app data (a clean slate) and signs out. */
export function clearAllData() {
  if (typeof window === "undefined") return;
  window.localStorage.clear();
  signOut(); // also clears the session cookie
}

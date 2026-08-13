"use client";

/**
 * Assembles the Week-5 profile view-model from browser-local data (frozen
 * build): onboarding basics + Actions + evaluations, with capability scores
 * from the R9 stub. Swaps to Cyprian's APIs later with no component change.
 */

import { DRAFT_KEYS, useLocalDraft } from "@/lib/local-draft";
import { getCapability } from "@/lib/catalogue";
import type { ActionRecord, Evaluation } from "@/lib/actions/types";
import { computeCapabilityScores } from "./capability-scores";
import type {
  OnboardingDraft,
  ProfileBasics,
  ProfileView,
  CapabilityGrowth,
} from "./profile-types";

const EMPTY_ONBOARDING: OnboardingDraft = {
  step: 0,
  method: "cv",
  name: "",
  headline: "",
  education: [],
  experience: [],
  skillIds: [],
};
const EMPTY_BASICS: ProfileBasics = { name: "", headline: "", bio: "", avatarDataUrl: "" };
const NO_ACTIONS: ActionRecord[] = [];
const NO_EVALS: Evaluation[] = [];

const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });
const titleCase = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function useProfileView(): ProfileView {
  const onboarding = useLocalDraft<OnboardingDraft>(DRAFT_KEYS.onboardingDraft, EMPTY_ONBOARDING);
  const stored = useLocalDraft<ProfileBasics>(DRAFT_KEYS.profile, EMPTY_BASICS);
  const actions = useLocalDraft<ActionRecord[]>(DRAFT_KEYS.actionsDrafts, NO_ACTIONS);
  const rawEvaluations = useLocalDraft<Evaluation[]>(DRAFT_KEYS.evaluations, NO_EVALS);
  // Drop stale/legacy records that predate the v6 skill-level shape so a mix of
  // old and new localStorage data can't crash the profile.
  const evaluations = rawEvaluations.filter(
    (e): e is Evaluation => !!e && Array.isArray(e.skill_scores)
  );

  const basics: ProfileBasics = {
    name: stored.name || onboarding.name,
    headline: stored.headline || onboarding.headline,
    bio: stored.bio,
    avatarDataUrl: stored.avatarDataUrl,
  };
  const slug = slugify(basics.name) || "you";

  // Capabilities via the R9 stub.
  const scores = computeCapabilityScores(evaluations);
  const capabilities = scores
    .map((s) => {
      const cap = getCapability(s.capability_id);
      return {
        capability_id: s.capability_id,
        name: cap?.name ?? s.capability_id,
        value: s.capability_score,
        ratedSkills: s.rated_skill_count,
        provisional: s.display_status === "provisional",
      };
    })
    .sort((a, b) => b.value - a.value);

  const actionById = new Map(actions.map((a) => [a.action_id, a]));

  // Group evaluations by action → verified contributions.
  const evalsByAction = new Map<string, Evaluation[]>();
  for (const e of evaluations) {
    const arr = evalsByAction.get(e.action_id) ?? [];
    arr.push(e);
    evalsByAction.set(e.action_id, arr);
  }
  const contributions = [...evalsByAction.entries()]
    .map(([actionId, evals]) => {
      const action = actionById.get(actionId);
      const skillScores = evals.flatMap((e) => e.skill_scores);
      const avg = skillScores.length
        ? skillScores.reduce((s, ss) => s + ss.score, 0) / skillScores.length
        : 0;
      const capNames = [
        ...new Set(
          skillScores
            .map((ss) =>
              ss.capability_id_resolved ? getCapability(ss.capability_id_resolved)?.name : undefined
            )
            .filter(Boolean)
        ),
      ] as string[];
      const roles = [...new Set(evals.map((e) => titleCase(e.evaluator_role)))].join(", ");
      const latest = evals.reduce((m, e) => (e.created_at > m ? e.created_at : m), evals[0].created_at);
      return {
        action_id: actionId,
        title: action?.title ?? "Untitled action",
        capabilities: capNames,
        evaluatedBy: roles || "—",
        score: Math.round(avg * 10) / 10,
        date: monthYear(latest),
        difficulty: titleCase(action?.difficulty_declared ?? ""),
      };
    })
    .sort((a, b) => b.score - a.score);

  // Timeline — latest evaluations, newest first.
  const timeline = [...evaluations]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 6)
    .map((e) => ({
      date: monthYear(e.created_at),
      title: actionById.get(e.action_id)?.title ?? "Evaluated action",
      score: e.skill_scores.length
        ? Math.round((e.skill_scores.reduce((s, ss) => s + ss.score, 0) / e.skill_scores.length) * 10) / 10
        : 0,
    }));

  // Growth — per capability, cumulative R9 score over its evaluations.
  const growth: CapabilityGrowth[] = [...evalsByAction.keys()].length
    ? capabilities
        .map((c) => {
          const capEvals = evaluations
            .filter((e) => e.skill_scores.some((ss) => ss.capability_id_resolved === c.capability_id))
            .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
          const points = capEvals.map((_, i) => ({
            date: monthYear(capEvals[i].created_at),
            value:
              computeCapabilityScores(capEvals.slice(0, i + 1)).find(
                (x) => x.capability_id === c.capability_id
              )?.capability_score ?? 0,
          }));
          return { capability_id: c.capability_id, name: c.name, points };
        })
        .filter((g) => g.points.length > 0)
    : [];

  // Lightweight highlight story from growth (biggest positive delta).
  let headline_story: string | null = null;
  for (const g of growth) {
    if (g.points.length >= 2) {
      const delta = g.points[g.points.length - 1].value - g.points[0].value;
      if (delta > 0) {
        headline_story = `${g.name} climbed to ${g.points[g.points.length - 1].value.toFixed(
          1
        )} across your evaluations.`;
        break;
      }
    }
  }

  return {
    basics,
    slug,
    university: onboarding.education[0]?.school ?? "",
    role: "Student",
    trust: {
      evaluations: evaluations.length,
      capabilities: capabilities.length,
      evaluators: new Set(evaluations.map((e) => e.evaluator_id).filter(Boolean)).size,
      verified: evalsByAction.size,
    },
    capabilities,
    contributions,
    timeline,
    education: onboarding.education,
    experience: onboarding.experience,
    growth,
    headline_story,
    hasData: evaluations.length > 0,
  };
}

/**
 * Talent3X capability catalogue — frontend stub of the ingested framework
 * data (handover v1.6, 14 July 2026). Sourced verbatim from
 * 260713_Talent3X_DEV_Handover_Ingestion.xlsx: 119 capabilities, 497 skills,
 * 9 enums, scoring_policy, 10 packages.
 *
 * OWNERSHIP: ingestion + the real read API are Cyprian's. This module is the
 * frozen-build stand-in so the UI can render real labels today; swap these
 * accessors for API calls when the endpoints land.
 * TODO(cyprian): replace with GET /api/catalogue endpoints.
 *
 * BINDING RULES enforced here:
 *  - R1: skills carry NO score/level — none exist in the data or these types.
 *  - R7: dormant-scope capabilities and their skills are hidden from pickers
 *        and individual-facing views. Accessors exclude them by default.
 *  - Never hardcode these lists in components — always read them from here.
 */

import raw from "./catalogue-data.json";

export type ActivationScope = "validated_pilot" | "launch_unvalidated" | "dormant";

export type Capability = {
  capability_id: string;
  name: string;
  family: string;
  tier: "core" | "domain";
  description: string;
  activation_scope: ActivationScope;
};

export type Skill = {
  skill_id: string;
  label: string;
  capability_id: string;
  description: string;
};

export type EnumOption = { value: string; meaning: string };
export type ScoringParam = { parameter: string; value: string; notes: string };
export type Rubric = {
  capability_id: string;
  level: number;
  anchor_text: string;
  rubric_version: string;
};
export type Package = {
  package_id: string;
  name: string;
  segment: string;
  description: string;
};

const data = raw as {
  capabilities: Capability[];
  skills: Skill[];
  enums: Record<string, EnumOption[]>;
  scoringPolicy: ScoringParam[];
  packages: Package[];
  packageCapabilities: { package_id: string; capability_id: string }[];
  rubrics: Rubric[];
};

/* ---- indexes ---------------------------------------------------------- */

const capabilityById = new Map(data.capabilities.map((c) => [c.capability_id, c]));
const nonDormantCapIds = new Set(
  data.capabilities.filter((c) => c.activation_scope !== "dormant").map((c) => c.capability_id)
);
// R7: a skill is pickable only if its capability is non-dormant.
const pickableSkills = data.skills.filter((s) => nonDormantCapIds.has(s.capability_id));

/* ---- capabilities ----------------------------------------------------- */

/** Non-dormant capabilities only (R7). */
export function getCapabilities(): Capability[] {
  return data.capabilities.filter((c) => c.activation_scope !== "dormant");
}

export function getCapability(id: string): Capability | undefined {
  return capabilityById.get(id);
}

/** The capability a skill resolves to (snapshot this id at selection — R4). */
export function resolveCapability(skillId: string): Capability | undefined {
  const skill = data.skills.find((s) => s.skill_id === skillId);
  return skill ? capabilityById.get(skill.capability_id) : undefined;
}

/* ---- skills (the 497-label typeahead) --------------------------------- */

export function getSkill(id: string): Skill | undefined {
  return pickableSkills.find((s) => s.skill_id === id);
}

/**
 * Case-insensitive typeahead over pickable skill labels (§7). Ranks exact →
 * prefix → substring. `limit` caps the dropdown length.
 */
export function searchSkills(query: string, limit = 20): Skill[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { s: Skill; rank: number }[] = [];
  for (const s of pickableSkills) {
    const l = s.label.toLowerCase();
    if (l === q) scored.push({ s, rank: 0 });
    else if (l.startsWith(q)) scored.push({ s, rank: 1 });
    else if (l.includes(q)) scored.push({ s, rank: 2 });
  }
  scored.sort((a, b) => a.rank - b.rank || a.s.label.localeCompare(b.s.label));
  return scored.slice(0, limit).map((x) => x.s);
}

/**
 * Log a picker search that returned no matches (§7 / scoring_policy:
 * failed_search_logging → monthly governed label additions, owner André).
 * Stub for the frozen build.
 * TODO(cyprian): POST to the failed-search log endpoint.
 */
export function logFailedSkillSearch(query: string): void {
  if (typeof console !== "undefined") {
    console.info("[t3x] failed skill search (for monthly label additions):", query);
  }
}

/* ---- enums & scoring policy ------------------------------------------- */

export function getEnum(name: string): EnumOption[] {
  return data.enums[name] ?? [];
}

export function getScoringParam(parameter: string): string | undefined {
  return data.scoringPolicy.find((p) => p.parameter === parameter)?.value;
}

/* ---- rubrics (the 6 anchors per capability, for the evaluator view) --- */

const rubricsByCapability = (() => {
  const m = new Map<string, Rubric[]>();
  for (const r of data.rubrics) {
    const arr = m.get(r.capability_id) ?? [];
    arr.push(r);
    m.set(r.capability_id, arr);
  }
  for (const arr of m.values()) arr.sort((a, b) => a.level - b.level);
  return m;
})();

/**
 * The six rubric anchors (levels 0–5) for a capability, sorted by level, at the
 * stored rubric_version (§7). Empty array if the capability has no rubrics yet.
 */
export function getRubric(capabilityId: string): Rubric[] {
  return rubricsByCapability.get(capabilityId) ?? [];
}

/* ---- display helpers derived from enums / scoring_policy -------------- */

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** Human label for an enum value: snake_case → words, "ai" → "AI". */
export function prettyEnum(value: string): string {
  return value
    .split("_")
    .map((w) => (w === "ai" ? "AI" : w))
    .join(" ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Difficulty options with title-cased labels (enum values are UPPERCASE). */
export function getDifficultyLevels(): { value: string; label: string }[] {
  return getEnum("difficulty").map((o) => ({ value: o.value, label: titleCase(o.value) }));
}

/** Evaluator roles with title-cased labels. */
export function getEvaluatorRoles(): { value: string; label: string }[] {
  return getEnum("evaluator_role").map((o) => ({ value: o.value, label: titleCase(o.value) }));
}

/** Capabilities grouped by family (non-dormant), for catalogue displays. */
export function getCapabilityFamilies(): { family: string; capabilities: Capability[] }[] {
  const groups = new Map<string, Capability[]>();
  for (const c of getCapabilities()) {
    const arr = groups.get(c.family) ?? [];
    arr.push(c);
    groups.set(c.family, arr);
  }
  return [...groups.entries()].map(([family, capabilities]) => ({ family, capabilities }));
}

// Score bounds from scoring_policy (e.g. "integer 0-5") — never hardcoded.
const scoreBounds = (getScoringParam("score_scale") ?? "0-5").match(/(\d+)\D+(\d+)/);
export const SCORE_MIN = scoreBounds ? Number(scoreBounds[1]) : 0;
export const SCORE_MAX = scoreBounds ? Number(scoreBounds[2]) : 5;

export type ScoreStep = { value: number; requiresComment: boolean; label?: string };

/**
 * The 0–5 score scale as data (v1.6): holistic integers against the capability's
 * rubric anchors, comment mandatory at the scores in `comment_required_scores`.
 * No generic quality labels — quality language lives only in rubric anchors.
 */
export function getScoreScale(): ScoreStep[] {
  const required = new Set(
    (getScoringParam("comment_required_scores") ?? "0;1;5")
      .split(";")
      .map((n) => Number(n.trim()))
  );
  const steps: ScoreStep[] = [];
  for (let v = SCORE_MIN; v <= SCORE_MAX; v++) {
    steps.push({ value: v, requiresComment: required.has(v) });
  }
  return steps;
}

export const catalogueCounts = {
  capabilities: data.capabilities.length,
  skills: data.skills.length,
  packages: data.packages.length,
};

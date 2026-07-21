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

export const catalogueCounts = {
  capabilities: data.capabilities.length,
  skills: data.skills.length,
  packages: data.packages.length,
};

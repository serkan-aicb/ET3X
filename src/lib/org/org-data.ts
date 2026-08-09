/**
 * Mock organisation dataset (frozen build) — stands in for what Cyprian's org
 * analytics endpoints will return. Deterministic (seeded PRNG) so the dashboards
 * are stable across reloads.
 *
 * It's built from REAL catalogue capabilities that sit inside real packages, so
 * package-gating (commercial_scope) and the other binding rules operate on real
 * ids — the same code paths the live backend will drive.
 * TODO(cyprian): replace with GET /api/org/* endpoints.
 */

import { getCapabilities, getCapabilityIdsInPackages, type Capability } from "@/lib/catalogue";

export const ORG_NAME = "University of Oulu";

/** Packages the org holds data for; a subset is "activated" (see org-analytics). */
export const ORG_PACKAGES = ["U1", "U2", "E1", "E2"];
export const ORG_DEFAULT_ACTIVATED = ["U1", "E1"];

export type OrgUnit = { id: string; name: string };
export type MemberCapability = { capability_id: string; score: number; visibility: "yes" | "no" };
export type OrgMember = {
  id: string;
  name: string;
  unit_id: string;
  evaluations: number;
  verified: number;
  capabilities: MemberCapability[];
};
export type OrgDataset = {
  org_name: string;
  units: OrgUnit[];
  members: OrgMember[];
  capabilities: Capability[]; // the org's tracked capabilities (superset of any activation)
};

// One unit is deliberately < min_group_size (5) to exercise k-anonymity rollup.
const UNIT_DEFS = [
  { id: "cs", name: "Computer Science", size: 46 },
  { id: "se", name: "Software Engineering", size: 52 },
  { id: "ds", name: "Data Science", size: 38 },
  { id: "pd", name: "Product Design", size: 34 },
  { id: "bus", name: "Business", size: 24 },
  { id: "rob", name: "Robotics (new)", size: 3 },
];

const FIRST = [
  "Aino", "Elias", "Sofia", "Onni", "Venla", "Leo", "Aada", "Eino", "Iida", "Väinö",
  "Emma", "Niko", "Sara", "Juho", "Nea", "Lauri", "Helmi", "Otto", "Siiri", "Miro",
  "Anni", "Eetu", "Peppi", "Aleksi", "Lotta", "Daniel", "Maria", "Tom", "Lisa", "Priya",
  "David", "Noah", "Olivia", "Liam", "Aria", "Kai", "Mila", "Ravi", "Yuki", "Omar",
];
const LAST = [
  "Virtanen", "Korhonen", "Mäkinen", "Nieminen", "Mäkelä", "Hämäläinen", "Laine",
  "Heikkinen", "Koskinen", "Järvinen", "Lehtonen", "Saarinen", "Salminen", "Heinonen",
  "Niemi", "Aaltonen", "Turunen", "Rantanen", "Karjalainen", "Jokinen", "Johnson",
  "Kim", "Chen", "Williams", "Singh",
];

/** Deterministic PRNG so the org numbers never jump between renders. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cached: OrgDataset | null = null;

export function getOrgDataset(): OrgDataset {
  if (cached) return cached;

  // Org capabilities: real ones covered by the org's packages (so gating is real).
  const covered = getCapabilityIdsInPackages(ORG_PACKAGES);
  let caps = getCapabilities().filter((c) => covered.has(c.capability_id));
  if (caps.length < 6) {
    // Defensive fallback: pad with other non-dormant capabilities.
    const extra = getCapabilities().filter((c) => !covered.has(c.capability_id));
    caps = [...caps, ...extra];
  }
  caps = caps.slice(0, 8);

  const rand = mulberry32(20260809);

  // Per (unit, capability) baseline gives the heatmap real structure.
  const baseline = new Map<string, number>();
  for (const u of UNIT_DEFS) {
    for (const c of caps) {
      baseline.set(`${u.id}:${c.capability_id}`, 2.8 + rand() * 1.9); // 2.8–4.7
    }
  }

  const units: OrgUnit[] = UNIT_DEFS.map((u) => ({ id: u.id, name: u.name }));
  const members: OrgMember[] = [];
  let i = 0;
  for (const u of UNIT_DEFS) {
    for (let n = 0; n < u.size; n++, i++) {
      const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
      // Each member covers ~60–100% of the org capabilities.
      const memberCaps: MemberCapability[] = [];
      for (const c of caps) {
        if (rand() < 0.28) continue; // not everyone touches every capability
        const base = baseline.get(`${u.id}:${c.capability_id}`) ?? 3.5;
        const score = Math.min(5, Math.max(1, Math.round((base + (rand() - 0.5) * 1.2) * 10) / 10));
        memberCaps.push({
          capability_id: c.capability_id,
          score,
          visibility: rand() < 0.12 ? "no" : "yes", // R10: some keep it private
        });
      }
      const evaluations = memberCaps.length + Math.round(rand() * 4);
      const verified = Math.round(evaluations * (0.8 + rand() * 0.15));
      members.push({ id: `m${i}`, name, unit_id: u.id, evaluations, verified, capabilities: memberCaps });
    }
  }

  cached = { org_name: ORG_NAME, units, members, capabilities: caps };
  return cached;
}

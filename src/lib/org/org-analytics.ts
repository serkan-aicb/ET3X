/**
 * Org analytics — the governed read layer over the mock org dataset. EVERY view
 * here applies the binding rules so the dashboards can't leak:
 *
 *  - Package-gating (v1.7 Activation "Check 2"): only capabilities inside the
 *    org's ACTIVATED packages are ever returned. Toggling a package changes what
 *    is visible, retroactively — intended behaviour (R10 note).
 *  - org_visibility (R10): a member-capability marked "no" never enters an
 *    aggregate, ever.
 *  - k-anonymity: a group is only shown at >= min_group_size contributors;
 *    smaller groups are masked / rolled up to the parent.
 *
 * TODO(cyprian): these become GET /api/org/* — the engine owns the real numbers.
 */

import { getCapability, getCapabilityIdsInPackages, getScoringParam } from "@/lib/catalogue";
import type { OrgDataset, OrgMember } from "./org-data";

export function minGroupSize(): number {
  const n = parseInt(getScoringParam("min_group_size") ?? "5", 10);
  return Number.isFinite(n) ? n : 5;
}

/** Capabilities visible under the given activated packages (name-resolved). */
export function activatedCapabilities(dataset: OrgDataset, activated: string[]) {
  const gate = getCapabilityIdsInPackages(activated);
  return dataset.capabilities.filter((c) => gate.has(c.capability_id));
}

type Entry = { member: OrgMember; capability_id: string; unit_id: string; score: number };

function visibleEntries(dataset: OrgDataset, gate: Set<string>): Entry[] {
  const out: Entry[] = [];
  for (const m of dataset.members) {
    for (const c of m.capabilities) {
      if (c.visibility !== "yes") continue; // R10
      if (!gate.has(c.capability_id)) continue; // package gate
      out.push({ member: m, capability_id: c.capability_id, unit_id: m.unit_id, score: c.score });
    }
  }
  return out;
}

export type OrgKpis = {
  contributors: number;
  evaluations: number;
  verified: number;
  coverage: number; // %
  avgScore: number; // /5
};

export function orgKpis(dataset: OrgDataset, activated: string[]): OrgKpis {
  const gate = getCapabilityIdsInPackages(activated);
  const entries = visibleEntries(dataset, gate);
  const contributingMembers = new Map<string, OrgMember>();
  for (const e of entries) contributingMembers.set(e.member.id, e.member);
  const members = [...contributingMembers.values()];

  const evaluations = members.reduce((s, m) => s + m.evaluations, 0);
  const verified = members.reduce((s, m) => s + m.verified, 0);
  const avg = entries.length ? entries.reduce((s, e) => s + e.score, 0) / entries.length : 0;

  return {
    contributors: members.length,
    evaluations,
    verified,
    coverage: evaluations ? Math.round((verified / evaluations) * 100) : 0,
    avgScore: Math.round(avg * 10) / 10,
  };
}

export type CapabilityAverage = {
  capability_id: string;
  name: string;
  value: number;
  contributors: number;
};

/** Per-capability org average (gated + visibility-filtered), sorted high→low. */
export function capabilityAverages(dataset: OrgDataset, activated: string[]): CapabilityAverage[] {
  const gate = getCapabilityIdsInPackages(activated);
  const entries = visibleEntries(dataset, gate);
  const acc = new Map<string, { sum: number; members: Set<string> }>();
  for (const e of entries) {
    const a = acc.get(e.capability_id) ?? { sum: 0, members: new Set<string>() };
    a.sum += e.score;
    a.members.add(e.member.id);
    acc.set(e.capability_id, a);
  }
  const min = minGroupSize();
  const rows: CapabilityAverage[] = [];
  for (const [capability_id, a] of acc) {
    if (a.members.size < min) continue; // k-anon: whole-capability group too small
    rows.push({
      capability_id,
      name: getCapability(capability_id)?.name ?? capability_id,
      value: Math.round((a.sum / a.members.size) * 10) / 10,
      contributors: a.members.size,
    });
  }
  return rows.sort((x, y) => y.value - x.value);
}

export type ScoreBand = { label: string; min: number; max: number; count: number; percent: number };

/** Distribution of member-capability scores into bands (design: 4 bands). */
export function scoreDistribution(dataset: OrgDataset, activated: string[]): ScoreBand[] {
  const gate = getCapabilityIdsInPackages(activated);
  const entries = visibleEntries(dataset, gate);
  const bands: ScoreBand[] = [
    { label: "4.5 – 5.0", min: 4.5, max: 5.0, count: 0, percent: 0 },
    { label: "3.5 – 4.4", min: 3.5, max: 4.49, count: 0, percent: 0 },
    { label: "2.5 – 3.4", min: 2.5, max: 3.49, count: 0, percent: 0 },
    { label: "1.0 – 2.4", min: 1.0, max: 2.49, count: 0, percent: 0 },
  ];
  for (const e of entries) {
    const b = bands.find((b) => e.score >= b.min && e.score <= b.max);
    if (b) b.count++;
  }
  const total = entries.length || 1;
  for (const b of bands) b.percent = Math.round((b.count / total) * 100);
  return bands;
}

export type GrowthSeries = { capability_id: string; name: string; points: { label: string; value: number }[] };

/** Synthetic monthly trend per top capability (deterministic, ends at today's avg). */
export function capabilityGrowth(dataset: OrgDataset, activated: string[], topN = 5): GrowthSeries[] {
  const months = ["Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"];
  return capabilityAverages(dataset, activated)
    .slice(0, topN)
    .map((c) => ({
      capability_id: c.capability_id,
      name: c.name,
      points: months.map((label, i) => ({
        label,
        // ramp up to the current average over the window (illustrative).
        value: Math.round((c.value - (months.length - 1 - i) * 0.12) * 10) / 10,
      })),
    }));
}

export type MapCell = { value: number | null; masked: boolean; contributors: number };
export type CapabilityTeamMap = {
  units: { id: string; name: string }[];
  rows: { capability_id: string; name: string; cells: MapCell[] }[];
  maskedNote: boolean; // any cell masked by k-anon
};

/**
 * Capability × team heatmap. Units below min_group_size are dropped as columns
 * (rolled up), and any individual cell with fewer than min_group_size visible
 * contributors is masked.
 */
export function capabilityTeamMap(dataset: OrgDataset, activated: string[]): CapabilityTeamMap {
  const gate = getCapabilityIdsInPackages(activated);
  const min = minGroupSize();
  const entries = visibleEntries(dataset, gate);

  // Units shown as columns: those with >= min members overall.
  const unitMemberCount = new Map<string, Set<string>>();
  for (const e of entries) {
    const s = unitMemberCount.get(e.unit_id) ?? new Set<string>();
    s.add(e.member.id);
    unitMemberCount.set(e.unit_id, s);
  }
  const units = dataset.units.filter((u) => (unitMemberCount.get(u.id)?.size ?? 0) >= min);

  const caps = activatedCapabilities(dataset, activated);
  let maskedNote = false;
  const rows = caps.map((cap) => {
    const cells: MapCell[] = units.map((u) => {
      const cellEntries = entries.filter(
        (e) => e.unit_id === u.id && e.capability_id === cap.capability_id
      );
      const members = new Set(cellEntries.map((e) => e.member.id));
      if (members.size < min) {
        maskedNote = true;
        return { value: null, masked: true, contributors: members.size };
      }
      const avg = cellEntries.reduce((s, e) => s + e.score, 0) / cellEntries.length;
      return { value: Math.round(avg * 10) / 10, masked: false, contributors: members.size };
    });
    return { capability_id: cap.capability_id, name: cap.name, cells };
  });

  return { units: units.map((u) => ({ id: u.id, name: u.name })), rows, maskedNote };
}

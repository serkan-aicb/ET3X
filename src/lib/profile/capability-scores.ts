/**
 * R9 capability scoring — FRONTEND STUB (Week 5, frozen build).
 *
 * Implements the deterministic R9 formula from scoring_policy over the Week-4
 * evaluations and returns rows shaped exactly like Cyprian's
 * `profile_capability_scores` table, so this swaps for his engine/endpoint with
 * no UI change.
 * TODO(cyprian): replace with a read of profile_capability_scores.
 *
 * v6 (skill-level): the evaluator rates each SKILL; a capability is COMPUTED
 * from its rated skills. Each rated skill carries its evaluation's weight
 *   w = difficulty_weight(difficulty_confirmed) * (0.5 + 0.1*evidence_quality)
 *   capability_score = sum(skill_score*w) / sum(w)   (weighted mean — stub)
 *   display_status = confirmed at >= threshold rated skills, else provisional
 * The difficulty driving the weight is the EVALUATOR-CONFIRMED value (R9).
 * TODO(cyprian): the exact skill→capability roll-up formula is the engine's;
 * this weighted mean is a faithful stub until that lands.
 */

import { getScoringParam } from "@/lib/catalogue";
import type { Evaluation } from "@/lib/actions/types";
import type { CapabilityScore } from "./profile-types";

function difficultyWeight(difficultyConfirmed: string): number {
  const raw = getScoringParam(`difficulty_weight.${difficultyConfirmed.toUpperCase()}`);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : 1.0;
}

function confidenceWeight(evidenceQuality: number): number {
  // scoring_policy: "0.5 + 0.1 * evidence_quality", range 0.5–1.0.
  return Math.min(1, Math.max(0.5, 0.5 + 0.1 * evidenceQuality));
}

function confirmedThreshold(): number {
  // min_evaluations_for_display is a descriptive string, e.g. "3 (full) / 1-2 …";
  // v6 keys the same number off RATED SKILLS.
  const parsed = parseInt(getScoringParam("min_evaluations_for_display") ?? "3", 10);
  return Number.isFinite(parsed) ? parsed : 3;
}

export function computeCapabilityScores(evaluations: Evaluation[]): CapabilityScore[] {
  const scoringVersion = getScoringParam("scoring_version") ?? "1.1";
  const confirmedAt = confirmedThreshold();

  // Flatten rated skills → group by capability, each carrying its evaluation weight.
  const byCapability = new Map<string, { score: number; w: number }[]>();
  for (const e of evaluations) {
    // Guard against stale/legacy records that predate the skill-level shape.
    if (!Array.isArray(e?.skill_scores)) continue;
    const w = difficultyWeight(e.difficulty_confirmed) * confidenceWeight(e.evidence_quality);
    for (const s of e.skill_scores) {
      if (!s.capability_id_resolved) continue;
      const arr = byCapability.get(s.capability_id_resolved) ?? [];
      arr.push({ score: s.score, w });
      byCapability.set(s.capability_id_resolved, arr);
    }
  }

  const out: CapabilityScore[] = [];
  for (const [capabilityId, rated] of byCapability) {
    let num = 0;
    let den = 0;
    for (const r of rated) {
      num += r.score * r.w;
      den += r.w;
    }
    out.push({
      capability_id: capabilityId,
      capability_score: den > 0 ? Math.round((num / den) * 100) / 100 : 0,
      rated_skill_count: rated.length,
      display_status: rated.length >= confirmedAt ? "confirmed" : "provisional",
      scoring_version: scoringVersion,
    });
  }
  return out;
}

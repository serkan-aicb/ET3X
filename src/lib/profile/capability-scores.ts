/**
 * R9 capability scoring — FRONTEND STUB (Week 5, frozen build).
 *
 * Implements the deterministic R9 formula from scoring_policy over the Week-4
 * evaluations and returns rows shaped exactly like Cyprian's
 * `profile_capability_scores` table, so this swaps for his engine/endpoint with
 * no UI change.
 * TODO(cyprian): replace with a read of profile_capability_scores.
 *
 * R9 (all constants read from scoring_policy, never hardcoded):
 *   w = difficulty_weight(difficulty_confirmed) * (0.5 + 0.1*evidence_quality)
 *   capability_score = sum(score*w) / sum(w)
 *   display_status = full at >= min_evaluations_for_display, else provisional
 * The difficulty driving the weight is the EVALUATOR-CONFIRMED value (R9),
 * never the creator-declared one.
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

function fullThreshold(): number {
  // min_evaluations_for_display is a descriptive string, e.g. "3 (full) / 1-2 …".
  const parsed = parseInt(getScoringParam("min_evaluations_for_display") ?? "3", 10);
  return Number.isFinite(parsed) ? parsed : 3;
}

export function computeCapabilityScores(evaluations: Evaluation[]): CapabilityScore[] {
  const scoringVersion = getScoringParam("scoring_version") ?? "1.1";
  const full = fullThreshold();

  const byCapability = new Map<string, Evaluation[]>();
  for (const e of evaluations) {
    const arr = byCapability.get(e.capability_id) ?? [];
    arr.push(e);
    byCapability.set(e.capability_id, arr);
  }

  const out: CapabilityScore[] = [];
  for (const [capabilityId, evals] of byCapability) {
    let num = 0;
    let den = 0;
    for (const e of evals) {
      const w = difficultyWeight(e.difficulty_confirmed) * confidenceWeight(e.evidence_quality);
      num += e.score * w;
      den += w;
    }
    out.push({
      capability_id: capabilityId,
      capability_score: den > 0 ? Math.round((num / den) * 100) / 100 : 0,
      evaluation_count: evals.length,
      display_status: evals.length >= full ? "full" : "provisional",
      scoring_version: scoringVersion,
    });
  }
  return out;
}

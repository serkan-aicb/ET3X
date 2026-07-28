/**
 * Shared shapes for Actions, invites and evaluations (frozen build, localStorage).
 * These mirror the handover v1.6 entities (§4). When Cyprian's APIs land, these
 * become the response/request types and the localStorage reads become fetches.
 */

export type ActionSkill = {
  skill_id: string;
  capability_id_resolved: string | null; // snapshot at selection (R4)
};

export type ActionRecord = {
  action_id: string;
  title: string;
  description: string;
  action_skills: ActionSkill[];
  ai_involvement: string;
  difficulty_declared: string;
  evidence: {
    note: string;
    link: string;
    mode: string;
    files: { name: string; size?: number; hash?: string }[];
  };
  org_visibility: string;
  created_at: string;
};

/** Single-use invite token (stub of Cyprian's invitations). */
export type EvaluationInvite = {
  token: string;
  action_id: string;
  action_title: string;
  created_at: string;
  status: "pending" | "used";
};

/** One evaluation = one (action, evaluator, capability) — v1.6 §4 / R6. */
export type Evaluation = {
  evaluation_id: string;
  action_id: string;
  capability_id: string;
  score: number; // 0–5 holistic vs rubric anchors
  evidence_quality: number; // 0–5, measurement confidence
  difficulty_confirmed: string;
  comment: string;
  evaluator_role: string;
  evaluator_relationship: string;
  evaluator_verification_tier: number; // 0–3 (backend-assigned; stub = 0)
  rubric_version: string;
  scoring_version: string;
  created_at: string;
};

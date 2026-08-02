/**
 * Shared shapes for Actions, invites and evaluations (frozen build, localStorage).
 * These mirror the handover v1.6 entities (§4). When Cyprian's APIs land, these
 * become the response/request types and the localStorage reads become fetches.
 */

export type ActionSkill = {
  skill_id: string;
  capability_id_resolved: string | null; // snapshot at selection (R4)
};

/**
 * Rudimentary profile — the minimum identity to create OR receive an action, or
 * to evaluate one (Handover v1.7 R12 / spec v6 §2). Email + organisation +
 * function only; the full CV/LinkedIn build ("Journey 1") is separate and later.
 * There is no token-only / no-account evaluation path.
 */
export type RudimentaryProfile = {
  email: string;
  organisation: string;
  function: string; // role/function label
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
    mode: string; // evidence_storage_mode: "external_reference" | "stored" (v1.7 R13)
    files: { name: string; size?: number; hash?: string }[]; // hash computed for every file
  };
  org_visibility: string;
  created_at: string;
};

/**
 * Path B — prospective / issued actions (v6 §5a). An evaluator creates action
 * content once and ISSUES it to one or many recipients (class/team broadcast);
 * the system makes one read-only instance per recipient, grouped under one
 * Assignment. Recipients can't change title/description/skills; each submits
 * their own evidence + sets their own org_visibility consent (§5c).
 */
export type AssignmentRecipient = {
  token: string; // single-use receive link
  email: string;
  status: "assigned" | "submitted";
  submitted_at?: string;
};

export type Assignment = {
  assignment_id: string;
  title: string;
  description: string;
  action_skills: ActionSkill[]; // fixed at issuance (recipients can't edit)
  issued_by: string; // the issuing evaluator
  created_at: string;
  recipients: AssignmentRecipient[];
};

/** Single-use invite token (stub of Cyprian's invitations). */
export type EvaluationInvite = {
  token: string;
  action_id: string;
  action_title: string;
  created_at: string;
  status: "pending" | "used";
};

/** One rated skill within an evaluation (v6 §7 — skills are rated directly). */
export type SkillScore = {
  skill_id: string;
  capability_id_resolved: string | null; // R4 snapshot mapping
  score: number; // 0–5
};

/**
 * One evaluation = one evaluator, one action (v6 §7 — skill-level). The evaluator
 * rates each selected SKILL 0–5; the capability is COMPUTED from rated skills
 * (Confirmed at ≥3 rated skills). One evidence_quality and one shared comment per
 * evaluation; comment required if any skill is scored 0/1/5 (R6). Difficulty is
 * evaluator-confirmed and drives the R9 weight.
 */
export type Evaluation = {
  evaluation_id: string;
  action_id: string;
  skill_scores: SkillScore[];
  evidence_quality: number; // 0–5, one per evaluation
  difficulty_confirmed: string;
  comment: string; // one shared comment
  evaluator_role: string;
  evaluator_relationship: string;
  evaluator_verification_tier: number; // 0–3 (backend-assigned; stub = 0)
  rubric_version: string;
  scoring_version: string;
  created_at: string;
};

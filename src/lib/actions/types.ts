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

/** Evidence attached to an action, or submitted for an issued instance (v1.7 R13). */
export type Evidence = {
  note: string;
  link: string;
  mode: string; // evidence_storage_mode: "external_reference" | "stored"
  files: { name: string; size?: number; hash?: string }[]; // hash computed for every file
};

export type ActionRecord = {
  action_id: string;
  title: string;
  description: string;
  action_skills: ActionSkill[];
  ai_involvement: string;
  difficulty_declared: string;
  evidence: Evidence;
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
export type RecipientStatus = "assigned" | "submitted" | "evaluated" | "declined";

export type AssignmentRecipient = {
  token: string; // single-use receive link
  email: string;
  status: RecipientStatus;
  evidence?: Evidence; // the recipient's own submitted evidence
  org_visibility?: string; // each recipient sets their own consent (§5c)
  submitted_at?: string;
  decline_reason?: string; // optional, one-click decline (v6 §6)
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

/**
 * Path B — prospective, WORKER-proposed (v6 §5b). The worker drafts the scope
 * (title/description/skills) plus their own org_visibility consent, then sends it
 * to an evaluator who Accepts & locks / Adjusts & locks / Declines. Once LOCKED
 * the scope is final on both sides (no negotiation). The worker then does the
 * work, submits evidence, and it is scored via the standard evaluate flow.
 */
export type ProposalStatus =
  | "proposed" // sent to the evaluator, awaiting their decision
  | "locked" // accepted/adjusted & locked — scope final
  | "declined" // evaluator declined before work (one click, optional reason)
  | "submitted" // worker submitted evidence on the locked scope
  | "evaluated"; // scored via /evaluate

export type Proposal = {
  proposal_id: string;
  token: string; // single-use link to the evaluator (/propose/<token>)
  title: string;
  description: string;
  action_skills: ActionSkill[];
  org_visibility: string; // worker's own consent, set at draft (§5c)
  proposed_by: string; // worker email
  status: ProposalStatus;
  created_at: string;
  adjusted?: boolean; // evaluator changed the scope before locking
  locked_by?: string; // evaluator email
  locked_at?: string;
  decline_reason?: string;
  evidence?: Evidence; // worker's evidence, added after lock
  submitted_at?: string;
};

/** Single-use invite token (stub of Cyprian's invitations). */
export type EvaluationInvite = {
  token: string;
  action_id: string;
  action_title: string;
  created_at: string;
  status: "pending" | "used";
  // Set when this invite evaluates a Path-B assignment submission — links back so
  // submitting the evaluation flips the recipient's status to "evaluated".
  assignment_id?: string;
  recipient_token?: string;
  // Set when this invite evaluates a Path-B-5b worker proposal — links back so
  // submitting the evaluation flips the proposal's status to "evaluated".
  proposal_id?: string;
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
  // Who evaluated (R12: evaluations.evaluator_id is NOT NULL → profiles(id)).
  // Frozen-build stand-in = the evaluator's rudimentary-profile email.
  evaluator_id: string;
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

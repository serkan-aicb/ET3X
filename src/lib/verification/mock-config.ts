// Stub of the verification layer's evaluation configuration.
//
// Per the 2026-07-07 architecture adjustments, evaluator roles, action
// categories, difficulty levels, the score scale and the capability catalogue
// are supplied by the external verification layer per context
// (enterprise / university / freelancer). The UI must render what the layer
// returns and never hardcode these lists.
//
// This module mirrors the expected response shape so screens can be built
// against it today and swapped to the real API call later.

export type ScoreStep = {
  value: number
  label: string
  /** When true, the evaluation form must require a written comment. */
  requiresComment: boolean
}

export type DifficultyLevel = {
  id: string
  label: string
}

export type EvaluatorRole = {
  id: string
  label: string
}

export type ActionCategory = {
  id: string
  label: string
}

export type CapabilityFamily = {
  id: string
  label: string
  capabilities: { id: string; label: string }[]
}

export type VerificationTier = {
  id: string
  label: string
}

export type EvidenceStorageMode = {
  id: string
  label: string
}

export type EvaluatorFamiliarity = {
  id: string
  label: string
}

export type EvaluationConfig = {
  context: "university" | "enterprise" | "freelancer"
  scoreScale: ScoreStep[]
  difficultyLevels: DifficultyLevel[]
  evaluatorRoles: EvaluatorRole[]
  actionCategories: ActionCategory[]
  capabilityCatalogue: CapabilityFamily[]
  verificationTiers: VerificationTier[]
  evaluatorFamiliarity: EvaluatorFamiliarity[]
  evidenceStorageModes: EvidenceStorageMode[]
}

// Fixed in every context (architecture adjustments §1).
const SCORE_SCALE: ScoreStep[] = [
  { value: 0, label: "Not demonstrated", requiresComment: false },
  { value: 1, label: "Weak", requiresComment: true },
  { value: 2, label: "Limited", requiresComment: false },
  { value: 3, label: "Adequate", requiresComment: false },
  { value: 4, label: "Strong", requiresComment: false },
  { value: 5, label: "Excellent", requiresComment: true },
]

const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { id: "foundational", label: "Foundational" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "exceptional", label: "Exceptional" },
]

// Context-specific sample values. The real layer returns these per context.
export const mockEvaluationConfig: EvaluationConfig = {
  context: "university",
  scoreScale: SCORE_SCALE,
  difficultyLevels: DIFFICULTY_LEVELS,
  evaluatorRoles: [
    { id: "professor", label: "Professor" },
    { id: "lecturer", label: "Lecturer" },
    { id: "supervisor", label: "Supervisor" },
    { id: "peer", label: "Peer" },
  ],
  // Action types per the 260618 User Journey (Step 2).
  actionCategories: [
    { id: "project", label: "Project" },
    { id: "research", label: "Research" },
    { id: "presentation", label: "Presentation" },
    { id: "assessment", label: "Assessment" },
    { id: "other", label: "Other" },
  ],
  capabilityCatalogue: [
    {
      id: "thinking",
      label: "Thinking & Problem Solving",
      capabilities: [
        { id: "critical-thinking", label: "Critical Thinking" },
        { id: "problem-solving", label: "Problem Solving" },
        { id: "solution-design", label: "Solution Design" },
      ],
    },
    {
      id: "collaboration",
      label: "Collaboration & Communication",
      capabilities: [
        { id: "communication", label: "Communication" },
        { id: "inclusive-collaboration", label: "Inclusive Collaboration" },
        { id: "constructive-feedback", label: "Constructive Feedback" },
      ],
    },
    {
      id: "leadership",
      label: "Leadership & Strategy",
      capabilities: [
        { id: "leadership", label: "Leadership" },
        { id: "strategic-thinking", label: "Strategic Thinking" },
      ],
    },
  ],
  verificationTiers: [
    { id: "verified-institution", label: "Verified Institution" },
    { id: "verified-evaluator", label: "Verified Evaluator" },
    { id: "unverified", label: "Unverified" },
  ],
  evaluatorFamiliarity: [
    { id: "low", label: "Low familiarity" },
    { id: "medium", label: "Medium familiarity" },
    { id: "high", label: "High familiarity" },
  ],
  // Per the 260618 User Journey / Database Model ("Hash Only": file is
  // hashed and the document deleted; raw evidence never leaves the app).
  evidenceStorageModes: [
    { id: "store", label: "Store Evidence" },
    { id: "hash-only", label: "Hash Only" },
    { id: "external-reference", label: "External Reference" },
  ],
}

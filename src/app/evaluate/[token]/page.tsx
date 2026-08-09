"use client";

/**
 * Evaluator flow — Week 4 (handover v1.6 §7, R6/R9). Reached via a single-use
 * token link; the link resolves publicly but scoring requires a rudimentary
 * profile (v1.7 R12 / spec v6 §2) — gated in-page by <AccountGate>. The evaluator:
 *   Context & role → Difficulty → Score each capability → Review → Done.
 *
 * v1.6 rules encoded:
 *  - Capability-level, holistic integer 0–5 against that capability's six rubric
 *    anchors (shown, at the stored rubric_version).
 *  - evidence_quality 0–5 required per capability; comment required at 0/1/5.
 *  - evaluator_role + evaluator_relationship declared; verification_tier stored
 *    (stub = 0). rubric_version + scoring_version stored on every evaluation.
 *  - No self-evaluation (stated; enforced server-side by Cyprian).
 *  - Difficulty confirmed/corrected by the evaluator drives the weight (R9).
 *
 * Persistence is a localStorage stub; the real submit + token consume are
 * Cyprian's (workspace doc 15). One evaluation row is written per capability.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AccountGate } from "@/components/account/account-gate";
import { FocusedFlowShell } from "@/components/layout/focused-flow-shell";
import {
  getCapability,
  getDifficultyLevels,
  getEnum,
  getRubric,
  getScoreScale,
  getScoringParam,
  getSkill,
  prettyEnum,
  resolveCapability,
  SCORE_MAX,
} from "@/lib/catalogue";
import { DRAFT_KEYS, readDraft, useLocalDraft, writeDraft } from "@/lib/local-draft";
import type {
  ActionRecord,
  Assignment,
  Evaluation,
  EvaluationInvite,
  RudimentaryProfile,
} from "@/lib/actions/types";

const NO_ACTIONS: ActionRecord[] = [];
const NO_INVITES: EvaluationInvite[] = [];
const NO_EVALS: Evaluation[] = [];

const COMMENT_REQUIRED = new Set(
  getScoreScale().filter((s) => s.requiresComment).map((s) => s.value)
);

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** A capability with its selected skills + rubric anchors, for the score step. */
type CapGroup = {
  capability_id: string;
  name: string;
  description: string;
  anchors: { level: number; anchor_text: string }[];
  skills: { skill_id: string; label: string }[];
};

export default function EvaluatePage() {
  const { token } = useParams<{ token: string }>();
  const invites = useLocalDraft<EvaluationInvite[]>(DRAFT_KEYS.evaluationInvites, NO_INVITES);
  const actions = useLocalDraft<ActionRecord[]>(DRAFT_KEYS.actionsDrafts, NO_ACTIONS);

  const invite = invites.find((i) => i.token === token);
  const action = invite ? actions.find((a) => a.action_id === invite.action_id) : undefined;

  if (!invite || !action) {
    return <InvalidLink used={invite?.status === "used"} />;
  }
  // R12: the link resolves, but scoring needs a rudimentary profile first.
  return (
    <AccountGate
      title="Sign in to evaluate"
      subtitle="Evaluators need a minimal profile before scoring — email, organisation and your role. No full account required."
    >
      <Evaluator token={token} action={action} />
    </AccountGate>
  );
}

function Evaluator({ token, action }: { token: string; action: ActionRecord }) {
  const invites = useLocalDraft<EvaluationInvite[]>(DRAFT_KEYS.evaluationInvites, NO_INVITES);
  const evaluations = useLocalDraft<Evaluation[]>(DRAFT_KEYS.evaluations, NO_EVALS);

  const capGroups = capabilitiesWithSkills(action);
  const allSkills = capGroups.flatMap((g) => g.skills);
  const roleOptions = getEnum("evaluator_role");
  const relationshipOptions = getEnum("evaluator_relationship");
  const difficultyLevels = getDifficultyLevels();

  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [role, setRole] = useState("");
  const [relationship, setRelationship] = useState("");
  const [difficulty, setDifficulty] = useState(action.difficulty_declared);
  const [skillScores, setSkillScores] = useState<Record<string, number | null>>(
    Object.fromEntries(allSkills.map((s) => [s.skill_id, null]))
  );
  const [evidenceQuality, setEvidenceQuality] = useState(3);
  const [comment, setComment] = useState("");

  const setSkill = (id: string, score: number) =>
    setSkillScores((s) => ({ ...s, [id]: score }));

  // Comment required if any skill was scored 0, 1 or 5 (R6).
  const anyExtreme = Object.values(skillScores).some(
    (v) => v !== null && COMMENT_REQUIRED.has(v)
  );
  const scoringComplete =
    allSkills.every((s) => skillScores[s.skill_id] !== null) &&
    (!anyExtreme || comment.trim() !== "");

  const submit = () => {
    const scoringVersion = getScoringParam("scoring_version") ?? "1.1";
    const rubricVersion = capGroups[0]
      ? getRubric(capGroups[0].capability_id)[0]?.rubric_version ?? "0.9-draft"
      : "0.9-draft";
    // One evaluation, carrying a score per selected skill (v6 §7).
    // R12: the evaluator passed the account gate, so a rudimentary profile
    // exists — stamp its email as the evaluator identity (NOT NULL).
    const evaluatorProfile = readDraft<RudimentaryProfile>(DRAFT_KEYS.rudimentaryProfile);
    const row: Evaluation = {
      evaluation_id: `ev_${Math.random().toString(36).slice(2, 10)}`,
      action_id: action.action_id,
      evaluator_id: evaluatorProfile?.email ?? "unknown",
      skill_scores: action.action_skills
        .filter((as) => skillScores[as.skill_id] != null)
        .map((as) => ({
          skill_id: as.skill_id,
          capability_id_resolved: as.capability_id_resolved,
          score: skillScores[as.skill_id] as number,
        })),
      evidence_quality: evidenceQuality,
      difficulty_confirmed: difficulty,
      comment: comment.trim(),
      evaluator_role: role,
      evaluator_relationship: relationship,
      evaluator_verification_tier: 0,
      rubric_version: rubricVersion,
      scoring_version: scoringVersion,
      created_at: new Date().toISOString(),
    };
    writeDraft(DRAFT_KEYS.evaluations, [row, ...evaluations]);
    // Consume the single-use token.
    writeDraft(
      DRAFT_KEYS.evaluationInvites,
      invites.map((i) => (i.token === token ? { ...i, status: "used" as const } : i))
    );
    // Path B: if this invite evaluates an assignment submission, mark it evaluated.
    const invite = invites.find((i) => i.token === token);
    if (invite?.assignment_id && invite.recipient_token) {
      const assignments = readDraft<Assignment[]>(DRAFT_KEYS.assignments) ?? [];
      writeDraft(
        DRAFT_KEYS.assignments,
        assignments.map((a) =>
          a.assignment_id !== invite.assignment_id
            ? a
            : {
                ...a,
                recipients: a.recipients.map((r) =>
                  r.token !== invite.recipient_token ? r : { ...r, status: "evaluated" as const }
                ),
              }
        )
      );
    }
    setDone(true);
  };

  const STEPS = ["Context", "Difficulty", "Score", "Review"];

  if (done) {
    return (
      <FocusedFlowShell steps={STEPS} currentStep={STEPS.length} saveExitLabel="">
        <Confirmation skills={allSkills.length} capabilities={capGroups.length} />
      </FocusedFlowShell>
    );
  }

  return (
    <FocusedFlowShell steps={STEPS} currentStep={step} saveExitLabel="">
      {step === 0 && (
        <ContextStep
          action={action}
          role={role}
          relationship={relationship}
          roleOptions={roleOptions}
          relationshipOptions={relationshipOptions}
          onRole={setRole}
          onRelationship={setRelationship}
          onContinue={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <DifficultyStep
          declared={action.difficulty_declared}
          value={difficulty}
          options={difficultyLevels}
          onChange={setDifficulty}
          onBack={() => setStep(0)}
          onContinue={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <ScoreStep
          capGroups={capGroups}
          skillScores={skillScores}
          setSkill={setSkill}
          evidenceQuality={evidenceQuality}
          setEvidenceQuality={setEvidenceQuality}
          comment={comment}
          setComment={setComment}
          anyExtreme={anyExtreme}
          canContinue={scoringComplete}
          onBack={() => setStep(1)}
          onContinue={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <ReviewStep
          role={role}
          relationship={relationship}
          difficulty={difficulty}
          capGroups={capGroups}
          skillScores={skillScores}
          evidenceQuality={evidenceQuality}
          comment={comment}
          onBack={() => setStep(2)}
          onSubmit={submit}
        />
      )}
    </FocusedFlowShell>
  );
}

/* ------------------------------------------------------------------ */
/* Step 0 — Context & role                                           */
/* ------------------------------------------------------------------ */

function ContextStep({
  action,
  role,
  relationship,
  roleOptions,
  relationshipOptions,
  onRole,
  onRelationship,
  onContinue,
}: {
  action: ActionRecord;
  role: string;
  relationship: string;
  roleOptions: { value: string; meaning: string }[];
  relationshipOptions: { value: string; meaning: string }[];
  onRole: (v: string) => void;
  onRelationship: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        title="You're evaluating an Action"
        subtitle="Review the work, then tell us who you are to the person who did it."
      />

      <ActionSummary action={action} />

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
        <span>
          Evaluate honestly against the rubric. You can&apos;t evaluate your own work.
        </span>
      </div>

      <section className="mt-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">
          Your role <span className="text-danger">*</span>
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {roleOptions.map((o) => (
            <Chip key={o.value} selected={role === o.value} onClick={() => onRole(o.value)}>
              {titleCase(o.value)}
            </Chip>
          ))}
        </div>

        <h2 className="mt-5 text-sm font-semibold text-foreground">
          Relationship to them <span className="text-danger">*</span>
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {relationshipOptions.map((o) => (
            <Chip
              key={o.value}
              selected={relationship === o.value}
              onClick={() => onRelationship(o.value)}
            >
              {titleCase(o.value.replace(/_/g, " "))}
            </Chip>
          ))}
        </div>
      </section>

      <div className="mt-8 flex justify-end">
        <Button onClick={onContinue} disabled={!role || !relationship}>
          Continue <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Difficulty confirm/correct                               */
/* ------------------------------------------------------------------ */

function DifficultyStep({
  declared,
  value,
  options,
  onChange,
  onBack,
  onContinue,
}: {
  declared: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <StepHeading
        title="Confirm the difficulty"
        subtitle="The creator estimated this. Confirm it or correct it — your confirmed value is what counts."
      />
      <section className="rounded-xl border bg-card p-6 shadow-card">
        <p className="text-xs text-muted-foreground">
          Creator declared:{" "}
          <span className="font-medium text-foreground">{titleCase(declared)}</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                value === o.value
                  ? "border-primary bg-primary-soft text-primary"
                  : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>
      <NavRow onBack={onBack}>
        <Button onClick={onContinue}>
          Continue <ArrowRight />
        </Button>
      </NavRow>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Rate each selected skill 0–5 (v6 §7)                      */
/* ------------------------------------------------------------------ */

function ScoreStep({
  capGroups,
  skillScores,
  setSkill,
  evidenceQuality,
  setEvidenceQuality,
  comment,
  setComment,
  anyExtreme,
  canContinue,
  onBack,
  onContinue,
}: {
  capGroups: CapGroup[];
  skillScores: Record<string, number | null>;
  setSkill: (id: string, score: number) => void;
  evidenceQuality: number;
  setEvidenceQuality: (n: number) => void;
  comment: string;
  setComment: (v: string) => void;
  anyExtreme: boolean;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const commentMissing = anyExtreme && !comment.trim();
  return (
    <div>
      <StepHeading
        title="Rate the skills"
        subtitle="Score each skill 0–5 against the evidence. Capability scores are calculated from these."
      />
      <div className="space-y-4">
        {capGroups.map((g) => (
          <section key={g.capability_id} className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="text-base font-semibold text-foreground">{g.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
            <AnchorGuide anchors={g.anchors} />
            <div className="mt-4 space-y-3">
              {g.skills.map((sk) => (
                <div
                  key={sk.skill_id}
                  className="flex flex-col gap-2 border-b border-muted pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-medium text-foreground">{sk.label}</span>
                  <ScoreButtons
                    value={skillScores[sk.skill_id]}
                    onChange={(n) => setSkill(sk.skill_id, n)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* One evidence_quality for the whole evaluation (v6 §7) */}
        <section className="rounded-xl border bg-card p-6 shadow-card">
          <h2 className="text-sm font-semibold text-foreground">
            Evidence quality{" "}
            <span className="font-normal text-muted-foreground/70">
              (how confident are you in the evidence?)
            </span>
          </h2>
          <div className="mt-3">
            <ScoreButtons value={evidenceQuality} onChange={setEvidenceQuality} />
          </div>
        </section>

        {/* One shared comment; required if any skill is 0/1/5 (R6) */}
        <section className="rounded-xl border bg-card p-6 shadow-card">
          <label className="text-sm font-semibold text-foreground">
            Comment{" "}
            {anyExtreme ? (
              <span className="text-danger">(required — you gave a 0, 1 or 5)</span>
            ) : (
              <span className="font-normal text-muted-foreground/70">(optional)</span>
            )}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="What in the evidence supports these scores?"
            className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
              commentMissing ? "border-danger ring-2 ring-danger/15" : ""
            }`}
          />
          {commentMissing && (
            <p className="mt-1 text-xs text-danger">
              A comment is required when any skill is scored 0, 1 or 5.
            </p>
          )}
        </section>
      </div>
      <NavRow onBack={onBack}>
        <Button onClick={onContinue} disabled={!canContinue}>
          Continue <ArrowRight />
        </Button>
      </NavRow>
    </div>
  );
}

/* 0–5 selector shared by skill scores and evidence quality. */
function ScoreButtons({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: SCORE_MAX + 1 }, (_, n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`size-9 rounded-lg border text-sm font-semibold tabular-nums transition-colors ${
            value === n
              ? "border-primary bg-primary text-primary-foreground"
              : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

/* Collapsible rubric-anchor reference (levels 0–5) for the capability. */
function AnchorGuide({ anchors }: { anchors: { level: number; anchor_text: string }[] }) {
  if (anchors.length === 0) return null;
  return (
    <details className="mt-3 rounded-lg border bg-background px-3 py-2">
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
        Level guide (0–5)
      </summary>
      <ul className="mt-2 space-y-1.5">
        {anchors.map((a) => (
          <li key={a.level} className="flex items-start gap-2 text-xs text-foreground/90">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
              {a.level}
            </span>
            <span>{a.anchor_text}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Review & submit                                          */
/* ------------------------------------------------------------------ */

function ReviewStep({
  role,
  relationship,
  difficulty,
  capGroups,
  skillScores,
  evidenceQuality,
  comment,
  onBack,
  onSubmit,
}: {
  role: string;
  relationship: string;
  difficulty: string;
  capGroups: CapGroup[];
  skillScores: Record<string, number | null>;
  evidenceQuality: number;
  comment: string;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <StepHeading
        title="Review your evaluation"
        subtitle="Your rated skills roll up into capability scores. You can’t change this after submitting."
      />
      <div className="space-y-4">
        <section className="rounded-xl border bg-card p-6 shadow-card">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            You
          </h2>
          <Row k="Role" v={titleCase(role)} />
          <Row k="Relationship" v={titleCase(relationship.replace(/_/g, " "))} />
          <Row k="Difficulty confirmed" v={titleCase(difficulty)} />
          <Row k="Evidence quality" v={`${evidenceQuality}/${SCORE_MAX}`} />
        </section>

        {capGroups.map((g) => (
          <section key={g.capability_id} className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              {g.name}
            </h2>
            <ul className="space-y-2">
              {g.skills.map((sk) => (
                <li
                  key={sk.skill_id}
                  className="flex items-center justify-between gap-3 border-b border-muted py-2 last:border-0"
                >
                  <span className="min-w-0 truncate text-sm text-foreground">{sk.label}</span>
                  <span className="shrink-0 rounded-lg bg-primary-soft px-2.5 py-1 text-sm font-bold tabular-nums text-primary">
                    {skillScores[sk.skill_id]}/{SCORE_MAX}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {comment && (
          <section className="rounded-xl border bg-card p-6 shadow-card">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              Comment
            </h2>
            <p className="text-sm text-muted-foreground">{comment}</p>
          </section>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-primary-soft px-4 py-3 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            Rated skills are combined by the capability engine. A capability shows as{" "}
            <span className="font-medium text-foreground">Confirmed</span> once it has 3 or more
            rated skills; fewer than that displays as provisional.
          </span>
        </div>
      </div>
      <NavRow onBack={onBack}>
        <Button onClick={onSubmit}>
          <CheckCircle2 /> Submit evaluation
        </Button>
      </NavRow>
    </div>
  );
}

function Confirmation({ skills, capabilities }: { skills: number; capabilities: number }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-9" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Evaluation submitted</h1>
      <p className="mt-2 max-w-[440px] text-[15px] leading-relaxed text-muted-foreground">
        Thank you. You rated {skills} skill{skills === 1 ? "" : "s"} across {capabilities}{" "}
        capabilit{capabilities === 1 ? "y" : "ies"}. This link is now used and can&apos;t be reopened.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                       */
/* ------------------------------------------------------------------ */

function ActionSummary({ action }: { action: ActionRecord }) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-card">
      <h2 className="text-base font-semibold text-foreground">{action.title}</h2>
      {action.description && (
        <p className="mt-1.5 text-sm text-muted-foreground">{action.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="size-3.5" /> {prettyEnum(action.ai_involvement)}
        </span>
        {action.evidence.files.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3.5" /> {action.evidence.files.length} evidence file
            {action.evidence.files.length === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {/* Selected skills with the capability each counts toward (§7) */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {action.action_skills.map((s) => {
          const skill = getSkill(s.skill_id);
          const cap = s.capability_id_resolved
            ? getCapability(s.capability_id_resolved)
            : resolveCapability(s.skill_id);
          if (!skill) return null;
          return (
            <span
              key={s.skill_id}
              className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80"
              title={cap ? `counts toward ${cap.name}` : undefined}
            >
              {skill.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        selected ? "border-primary bg-primary-soft text-primary" : "bg-card text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function InvalidLink({ used }: { used: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-[420px] rounded-xl border bg-card p-8 text-center shadow-card">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldAlert className="size-6" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-foreground">
          {used ? "This link was already used" : "Invalid or expired link"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {used
            ? "Each invite can be used once. Ask for a fresh link if you need to evaluate again."
            : "We couldn't find an evaluation for this link. Check the URL, or ask for a new invite."}
        </p>
      </div>
    </div>
  );
}

function capabilitiesWithSkills(action: ActionRecord): CapGroup[] {
  const map = new Map<string, CapGroup>();
  for (const s of action.action_skills) {
    const cap = s.capability_id_resolved
      ? getCapability(s.capability_id_resolved)
      : resolveCapability(s.skill_id);
    const skill = getSkill(s.skill_id);
    if (!cap || !skill) continue;
    if (!map.has(cap.capability_id)) {
      map.set(cap.capability_id, {
        capability_id: cap.capability_id,
        name: cap.name,
        description: cap.description,
        anchors: getRubric(cap.capability_id),
        skills: [],
      });
    }
    map.get(cap.capability_id)!.skills.push({ skill_id: s.skill_id, label: skill.label });
  }
  return [...map.values()];
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-muted py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-sm font-medium text-foreground">{v}</span>
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function NavRow({ onBack, children }: { onBack: () => void; children?: React.ReactNode }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <Button type="button" variant="ghost" onClick={onBack}>
        <ArrowLeft /> Back
      </Button>
      {children}
    </div>
  );
}

"use client";

/**
 * Action Creation — Week 3 (handover v1.6 §7). New individual flow:
 * Details → Skills → About the work → Evidence → Review.
 *
 * v1.6 model & rules encoded:
 *  - Skills are the governed catalogue (SkillPicker); each "counts toward" a
 *    capability. capability_id_resolved is snapshotted per skill at submit (R4).
 *  - ai_involvement REQUIRED at creation (R5); rendered from the enums.
 *  - difficulty declared by the creator (confirmed by the evaluator later, R9);
 *    rendered from the enums. No action categories (removed in v1.6).
 *  - Evidence (v1.7 R13 / spec v6 §5d): link-preferred, file-fallback; storage
 *    mode external_reference (default) / stored. A SHA-256 hash is computed for
 *    every submission regardless of mode (not a third "hash-only" mode).
 *  - org_visibility consent set by the individual, who can always restrict (R10).
 *  - Evaluator selection / invitation / scoring are NOT here — Week 4.
 *
 * Persistence is localStorage only (frozen build); real schema is Cyprian's.
 * Archetype: focused flow via FocusedFlowShell.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FocusedFlowShell } from "@/components/layout/focused-flow-shell";
import { SkillPicker } from "@/components/catalogue/skill-picker";
import { getEnum, getSkill, prettyEnum, resolveCapability } from "@/lib/catalogue";
import { sha256Hex } from "@/lib/evidence/hash";
import { DRAFT_KEYS, readDraft, useLocalDraft, writeDraft, clearDraft } from "@/lib/local-draft";

type EvidenceFile = { name: string; size: number; hash?: string };

// Evidence storage modes per Handover v1.7 R13 / spec v6 §5d: TWO modes only,
// link-preferred / file-fallback. A content hash is computed for every
// submission regardless of mode (a property, not a third mode).
// Not yet in the ingestion enums sheet.
// TODO(cyprian): add evidence_storage_mode {external_reference, stored} to enums.
const EVIDENCE_MODES = [
  { value: "external_reference", label: "External link", meaning: "Link to evidence hosted elsewhere. Preferred — Talent3X isn't a file host." },
  { value: "stored", label: "Upload file", meaning: "Capped fallback when there's no external host. Hashed at submission." },
] as const;

type ActionDraft = {
  step: number;
  title: string;
  description: string;
  expectedOutcome: string;
  skillIds: string[];
  aiInvolvement: string;
  difficulty: string;
  note: string;
  link: string;
  evidenceMode: string;
  files: EvidenceFile[];
  orgVisibility: string;
};

const STEPS = ["Details", "Skills", "About the work", "Evidence", "Review"];

const EMPTY: ActionDraft = {
  step: 0,
  title: "",
  description: "",
  expectedOutcome: "",
  skillIds: [],
  aiInvolvement: "",
  difficulty: "",
  note: "",
  link: "",
  evidenceMode: "external_reference",
  files: [],
  orgVisibility: "yes", // default per deployment agreement; individual can restrict (R10)
};

const titleCase = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export default function CreateActionPage() {
  const router = useRouter();
  const stored = useLocalDraft<ActionDraft>(DRAFT_KEYS.actionInProgress, EMPTY);
  const draft = { ...EMPTY, ...stored };

  const patch = (p: Partial<ActionDraft>) =>
    writeDraft(DRAFT_KEYS.actionInProgress, { ...draft, ...p });

  const saveExit = () => router.push("/s/actions");

  const submit = () => {
    // Snapshot the skill→capability mapping at submit (R4).
    const actionSkills = draft.skillIds.map((id) => ({
      skill_id: id,
      capability_id_resolved: resolveCapability(id)?.capability_id ?? null,
    }));
    const record = {
      action_id: `act_${Date.now().toString(36)}`,
      title: draft.title.trim(),
      description: draft.description.trim(),
      expected_outcome: draft.expectedOutcome.trim(),
      action_skills: actionSkills,
      ai_involvement: draft.aiInvolvement,
      difficulty_declared: draft.difficulty,
      evidence: {
        note: draft.note.trim(),
        link: draft.link.trim(),
        mode: draft.evidenceMode,
        files: draft.files,
      },
      org_visibility: draft.orgVisibility,
      created_at: new Date().toISOString(),
    };
    const list = readDraft<unknown[]>(DRAFT_KEYS.actionsDrafts) ?? [];
    writeDraft(DRAFT_KEYS.actionsDrafts, [record, ...list]);
    clearDraft(DRAFT_KEYS.actionInProgress);
    router.push("/s/actions");
  };

  return (
    <FocusedFlowShell steps={STEPS} currentStep={draft.step} onSaveExit={saveExit}>
      {draft.step === 0 && (
        <DetailsStep draft={draft} onContinue={(p) => patch({ ...p, step: 1 })} />
      )}
      {draft.step === 1 && (
        <SkillsStep
          draft={draft}
          onBack={() => patch({ step: 0 })}
          onContinue={(skillIds) => patch({ skillIds, step: 2 })}
        />
      )}
      {draft.step === 2 && (
        <AboutStep
          draft={draft}
          onBack={() => patch({ step: 1 })}
          onContinue={(p) => patch({ ...p, step: 3 })}
        />
      )}
      {draft.step === 3 && (
        <EvidenceStep
          draft={draft}
          onBack={() => patch({ step: 2 })}
          onContinue={(p) => patch({ ...p, step: 4 })}
        />
      )}
      {draft.step === 4 && (
        <ReviewStep draft={draft} onBack={() => patch({ step: 3 })} onSubmit={submit} />
      )}
    </FocusedFlowShell>
  );
}

/* ------------------------------------------------------------------ */
/* Step 0 — Details                                                   */
/* ------------------------------------------------------------------ */

const detailsSchema = z.object({
  title: z.string().trim().min(3, "Give your Action a clear title (3+ characters)."),
  description: z
    .string()
    .trim()
    .min(1, "Add a short description of the work.")
    .max(1000, "Keep the description under 1000 characters."),
  expectedOutcome: z
    .string()
    .trim()
    .min(1, "Describe what a good outcome looks like.")
    .max(1000, "Keep it under 1000 characters."),
});
type DetailsValues = z.infer<typeof detailsSchema>;

function DetailsStep({
  draft,
  onContinue,
}: {
  draft: ActionDraft;
  onContinue: (p: Partial<ActionDraft>) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      title: draft.title,
      description: draft.description,
      expectedOutcome: draft.expectedOutcome,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) =>
        onContinue({
          title: v.title.trim(),
          description: v.description.trim(),
          expectedOutcome: v.expectedOutcome.trim(),
        })
      )}
    >
      <StepHeading
        title="Create an Action"
        subtitle="An Action is a piece of real work. Describe it, then choose the skills it demonstrates."
      />
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
        <input
          {...register("title")}
          placeholder="e.g. Market entry analysis for a fintech launch"
          aria-invalid={!!errors.title}
          className={`h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            errors.title ? "border-danger ring-2 ring-danger/15" : ""
          }`}
        />
        {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}

        <label className="mb-1 mt-4 block text-xs font-medium text-muted-foreground">Description</label>
        <textarea
          {...register("description")}
          rows={4}
          placeholder="What was the work, and what did you do?"
          aria-invalid={!!errors.description}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            errors.description ? "border-danger ring-2 ring-danger/15" : ""
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-danger">{errors.description.message}</p>
        )}

        <label className="mb-1 mt-4 block text-xs font-medium text-muted-foreground">
          Expected outcome
        </label>
        <textarea
          {...register("expectedOutcome")}
          rows={3}
          placeholder="What does a good result look like, and how will it be judged?"
          aria-invalid={!!errors.expectedOutcome}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
            errors.expectedOutcome ? "border-danger ring-2 ring-danger/15" : ""
          }`}
        />
        {errors.expectedOutcome && (
          <p className="mt-1 text-xs text-danger">{errors.expectedOutcome.message}</p>
        )}
      </div>
      <div className="mt-8 flex justify-end">
        <Button type="submit">
          Continue <ArrowRight />
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Skills                                                    */
/* ------------------------------------------------------------------ */

function SkillsStep({
  draft,
  onBack,
  onContinue,
}: {
  draft: ActionDraft;
  onBack: () => void;
  onContinue: (skillIds: string[]) => void;
}) {
  const [skillIds, setSkillIds] = useState<string[]>(draft.skillIds);
  const capabilities = distinctCapabilities(skillIds);

  return (
    <div>
      <StepHeading
        title="Which skills does this demonstrate?"
        subtitle="Search the catalogue. Each skill counts toward a capability others can evaluate."
      />
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <SkillPicker selectedIds={skillIds} onChange={setSkillIds} />
      </div>

      {capabilities.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          These count toward{" "}
          <span className="font-medium text-foreground">{capabilities.length}</span>{" "}
          {capabilities.length === 1 ? "capability" : "capabilities"}:{" "}
          {capabilities.map((c) => c.name).join(", ")}.
        </p>
      )}

      <NavRow onBack={onBack}>
        <Button onClick={() => onContinue(skillIds)} disabled={skillIds.length === 0}>
          Continue <ArrowRight />
        </Button>
      </NavRow>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — About the work (ai_involvement required + difficulty)     */
/* ------------------------------------------------------------------ */

function AboutStep({
  draft,
  onBack,
  onContinue,
}: {
  draft: ActionDraft;
  onBack: () => void;
  onContinue: (p: Partial<ActionDraft>) => void;
}) {
  const [aiInvolvement, setAi] = useState(draft.aiInvolvement);
  const [difficulty, setDifficulty] = useState(draft.difficulty);
  const aiOptions = getEnum("ai_involvement");
  const difficultyOptions = getEnum("difficulty");

  const canContinue = aiInvolvement !== "" && difficulty !== "";

  return (
    <div>
      <StepHeading
        title="About the work"
        subtitle="Two quick questions so your Action is evaluated fairly."
      />

      <section className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            How was AI involved? <span className="text-danger">*</span>
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Describe your work, not the platform. Required on every Action.
        </p>
        <div className="mt-3 space-y-2">
          {aiOptions.map((o) => (
            <OptionRow
              key={o.value}
              selected={aiInvolvement === o.value}
              onClick={() => setAi(o.value)}
              label={prettyEnum(o.value)}
              meaning={o.meaning}
            />
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">
          How difficult was it? <span className="text-danger">*</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Your estimate. An evaluator confirms it — it never inflates your score on its own.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {difficultyOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setDifficulty(o.value)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                difficulty === o.value
                  ? "border-primary bg-primary-soft text-primary"
                  : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              {titleCase(o.value)}
            </button>
          ))}
        </div>
      </section>

      <NavRow onBack={onBack}>
        <Button
          onClick={() => onContinue({ aiInvolvement, difficulty })}
          disabled={!canContinue}
        >
          Continue <ArrowRight />
        </Button>
      </NavRow>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Evidence & visibility                                     */
/* ------------------------------------------------------------------ */

function EvidenceStep({
  draft,
  onBack,
  onContinue,
}: {
  draft: ActionDraft;
  onBack: () => void;
  onContinue: (p: Partial<ActionDraft>) => void;
}) {
  const [note, setNote] = useState(draft.note);
  const [link, setLink] = useState(draft.link);
  const [evidenceMode, setEvidenceMode] = useState(draft.evidenceMode);
  const [files, setFiles] = useState<EvidenceFile[]>(draft.files);
  const [orgVisibility, setOrgVisibility] = useState(draft.orgVisibility);
  const [hashing, setHashing] = useState(false);

  const onFiles = async (list: FileList | null) => {
    if (!list) return;
    setHashing(true);
    const next: EvidenceFile[] = [];
    for (const f of Array.from(list)) {
      // A content hash is computed for every submission, regardless of mode (R13).
      const hash = await sha256Hex(f);
      next.push({ name: f.name, size: f.size, hash });
    }
    setFiles((prev) => [...prev, ...next]);
    setHashing(false);
  };

  const visibilityOptions = getEnum("org_visibility");

  return (
    <div>
      <StepHeading
        title="Add evidence"
        subtitle="Proof of the work. You choose how it's stored and who can see it."
      />

      <section className="rounded-xl border bg-card p-6 shadow-card">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          How should evidence be stored?
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {EVIDENCE_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setEvidenceMode(m.value)}
              className={`rounded-lg border p-3 text-left transition-colors ${
                evidenceMode === m.value
                  ? "border-primary bg-primary-soft"
                  : "bg-card hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {m.value === "stored" && <Lock className="size-3.5 text-primary" />}
                {m.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground/80">{m.meaning}</span>
            </button>
          ))}
        </div>

        {evidenceMode === "external_reference" ? (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Evidence link</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        ) : (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Files <span className="font-normal text-primary">· hashed at submission</span>
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card px-6 py-8 text-center hover:border-primary">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
              {hashing ? (
                <span className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="size-4 animate-spin" /> Processing…
                </span>
              ) : (
                <>
                  <Upload className="mb-2 size-6 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Drop files or <span className="text-primary">browse</span>
                  </span>
                </>
              )}
            </label>
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    {f.hash && (
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                        {f.hash.slice(0, 10)}…
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, x) => x !== i))}
                      className="text-muted-foreground/70 hover:text-danger"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <label className="mb-1 mt-4 block text-xs font-medium text-muted-foreground">
          Note <span className="font-normal text-muted-foreground/70">(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Anything an evaluator should know about the evidence."
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </section>

      {/* org_visibility consent (R10) */}
      <section className="mt-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="text-sm font-semibold text-foreground">Organisation visibility</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          You decide whether this Action may appear in an organisation&apos;s analytics. You can
          always restrict it later.
        </p>
        <div className="mt-3 space-y-2">
          {visibilityOptions.map((o) => (
            <OptionRow
              key={o.value}
              selected={orgVisibility === o.value}
              onClick={() => setOrgVisibility(o.value)}
              label={o.value === "yes" ? "Visible to organisations" : "Keep private"}
              meaning={o.meaning}
            />
          ))}
        </div>
      </section>

      <NavRow onBack={onBack}>
        <Button
          onClick={() => onContinue({ note, link, evidenceMode, files, orgVisibility })}
        >
          Continue <ArrowRight />
        </Button>
      </NavRow>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4 — Review                                                    */
/* ------------------------------------------------------------------ */

function ReviewStep({
  draft,
  onBack,
  onSubmit,
}: {
  draft: ActionDraft;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const capabilities = distinctCapabilities(draft.skillIds);
  const aiLabel = prettyEnum(draft.aiInvolvement);
  const evidenceCount =
    draft.evidenceMode === "external_reference"
      ? draft.link
        ? "1 link"
        : "none"
      : `${draft.files.length} file${draft.files.length === 1 ? "" : "s"}`;

  return (
    <div>
      <StepHeading
        title="Review your Action"
        subtitle="Check everything, then create it. Evaluation comes next."
      />

      <div className="space-y-4">
        <SummaryCard title="Action">
          <div className="text-sm font-semibold text-foreground">{draft.title}</div>
          {draft.description && (
            <p className="mt-1 text-sm text-muted-foreground">{draft.description}</p>
          )}
          {draft.expectedOutcome && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Expected outcome:</span>{" "}
              {draft.expectedOutcome}
            </p>
          )}
        </SummaryCard>

        <SummaryCard title="Skills & capabilities">
          <div className="flex flex-wrap gap-1.5">
            {draft.skillIds.map((id) => {
              const s = getSkill(id);
              return s ? (
                <span
                  key={id}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80"
                >
                  {s.label}
                </span>
              ) : null;
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Counts toward: {capabilities.map((c) => c.name).join(", ") || "—"}
          </p>
        </SummaryCard>

        <SummaryCard title="About the work">
          <Row k="AI involvement" v={aiLabel} />
          <Row k="Difficulty (declared)" v={titleCase(draft.difficulty)} />
        </SummaryCard>

        <SummaryCard title="Evidence & visibility">
          <Row
            k="Storage"
            v={EVIDENCE_MODES.find((m) => m.value === draft.evidenceMode)?.label ?? draft.evidenceMode}
          />
          <Row k="Evidence" v={evidenceCount} />
          <Row
            k="Organisation visibility"
            v={draft.orgVisibility === "yes" ? "Visible to organisations" : "Private"}
          />
        </SummaryCard>

        {/* Week 4 seam */}
        <div className="flex items-start gap-2 rounded-lg bg-primary-soft px-4 py-3 text-sm text-muted-foreground">
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            After you create this Action, you&apos;ll{" "}
            <span className="font-medium text-foreground">request an evaluation</span> — someone
            other than you scores it. (Evaluation flow arrives next.)
          </span>
        </div>
      </div>

      <NavRow onBack={onBack}>
        <Button onClick={onSubmit}>
          <CheckCircle2 /> Create Action
        </Button>
      </NavRow>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                        */
/* ------------------------------------------------------------------ */

function distinctCapabilities(skillIds: string[]) {
  const map = new Map<string, { capability_id: string; name: string }>();
  for (const id of skillIds) {
    const cap = resolveCapability(id);
    if (cap && !map.has(cap.capability_id)) {
      map.set(cap.capability_id, { capability_id: cap.capability_id, name: cap.name });
    }
  }
  return [...map.values()];
}

function OptionRow({
  selected,
  onClick,
  label,
  meaning,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  meaning: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected ? "border-primary bg-primary-soft" : "bg-card hover:bg-muted"
      }`}
    >
      <span
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
        }`}
      >
        {selected && <span className="size-1.5 rounded-full bg-current" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground/80">{meaning}</span>
      </span>
    </button>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-card">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
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

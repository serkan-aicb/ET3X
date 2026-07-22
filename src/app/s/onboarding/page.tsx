"use client";

/**
 * Profile Onboarding — real Week-2 build (No Profile → Profile Created).
 * ------------------------------------------------------------------
 * Welcome → Import (CV upload / LinkedIn) → Review → Done.
 *
 * Frozen-build wiring (grill decisions):
 *  - Import calls the stub extraction API (POST /api/onboarding/extract);
 *    swap the URL for Nivin's real service later. TODO(nivin).
 *  - Suggested capabilities come from the central catalogue via
 *    suggestCapabilities() — never hardcoded (260707 §8).
 *  - Persistence is localStorage only (no Supabase). TODO(cyprian: schema).
 *  - Basics (name/headline) validated with react-hook-form + zod (T7).
 *  - Save & exit + Back preserve state; the draft rehydrates on mount.
 *
 * Archetype: focused flow (docs 14 S6/S7) via FocusedFlowShell.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Linkedin,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { FocusedFlowShell } from "@/components/layout/focused-flow-shell";
import { SkillPicker } from "@/components/catalogue/skill-picker";
import { DRAFT_KEYS, useLocalDraft, writeDraft } from "@/lib/local-draft";

type Method = "cv" | "linkedin";
type Status = "idle" | "uploading" | "done";
type EduRow = { school: string; degree: string; year: string };
type ExpRow = { role: string; org: string; period: string };
// Skills are the governed catalogue (v1.6): store skill_ids, not free text.
type Extraction = { education: EduRow[]; experience: ExpRow[]; skillIds: string[] };

type OnboardingDraft = {
  step: number;
  method: Method;
  name: string;
  headline: string;
  education: EduRow[];
  experience: ExpRow[];
  skillIds: string[];
};

const STEPS = ["Welcome", "Import", "Review", "Done"];

const EMPTY: OnboardingDraft = {
  step: 0,
  method: "cv",
  name: "",
  headline: "",
  education: [],
  experience: [],
  skillIds: [],
};

export default function OnboardingPage() {
  const router = useRouter();

  // The draft lives in localStorage; useLocalDraft keeps this component in sync
  // (Back/refresh/Save & exit all restore state) without setState-in-effect.
  const stored = useLocalDraft<OnboardingDraft>(DRAFT_KEYS.onboardingDraft, EMPTY);
  const draft = { ...EMPTY, ...stored };

  const patch = (p: Partial<OnboardingDraft>) =>
    writeDraft(DRAFT_KEYS.onboardingDraft, { ...draft, ...p });

  const saveExit = () => router.push("/s/dashboard");

  const finish = () => {
    writeDraft(DRAFT_KEYS.onboardingComplete, true);
    router.push("/s/dashboard");
  };

  return (
    <FocusedFlowShell steps={STEPS} currentStep={draft.step} onSaveExit={saveExit}>
      {draft.step === 0 && (
        <Welcome
          method={draft.method}
          onPick={(m) => patch({ method: m, step: 1 })}
          onScratch={() =>
            patch({ education: [], experience: [], skillIds: [], step: 2 })
          }
        />
      )}
      {draft.step === 1 && (
        <ImportStep
          method={draft.method}
          onMethodChange={(m) => patch({ method: m })}
          onBack={() => patch({ step: 0 })}
          onExtracted={(e) =>
            patch({
              education: e.education,
              experience: e.experience,
              skillIds: e.skillIds,
              step: 2,
            })
          }
        />
      )}
      {draft.step === 2 && (
        <ReviewStep
          draft={draft}
          onBack={() => patch({ step: 1 })}
          onContinue={(p) => patch({ ...p, step: 3 })}
        />
      )}
      {draft.step === 3 && <Confirmation onFinish={finish} />}
    </FocusedFlowShell>
  );
}

/* ------------------------------------------------------------------ */
/* Step 0 — Welcome / choose method                                  */
/* ------------------------------------------------------------------ */

function Welcome({
  method,
  onPick,
  onScratch,
}: {
  method: Method;
  onPick: (m: Method) => void;
  onScratch: () => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Let&apos;s build your capability profile
      </h1>
      <p className="mt-2 max-w-[560px] text-[15px] leading-relaxed text-muted-foreground">
        Start from your CV or LinkedIn. We&apos;ll turn it into a profile you can
        grow into <span className="font-medium text-foreground">verified capabilities</span> —
        evidence of what you can actually do, not just claims. Takes a few minutes.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ChoiceCard
          icon={<Upload className="size-5" />}
          title="Upload your CV"
          desc="Drag in a PDF or Word file. We extract the details."
          selected={method === "cv"}
          onClick={() => onPick("cv")}
        />
        <ChoiceCard
          icon={<Linkedin className="size-5" />}
          title="Import from LinkedIn"
          desc="Paste your profile URL and we'll pull it in."
          selected={method === "linkedin"}
          onClick={() => onPick("linkedin")}
        />
      </div>

      {/* Third path (9-July grill Q4): no CV or LinkedIn required. */}
      <button
        onClick={onScratch}
        className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Or start from scratch — add your details manually
        <ArrowRight className="size-4" />
      </button>

      <p className="mt-4 text-sm text-muted-foreground/70">
        Nothing is published until you say so. You can edit everything in the next step.
      </p>
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`card-interactive group flex flex-col items-start gap-3 rounded-xl border bg-card p-6 shadow-card text-left ${
        selected ? "border-primary ring-1 ring-primary" : ""
      }`}
    >
      <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="text-base font-semibold text-foreground">{title}</span>
      <span className="text-sm leading-relaxed text-muted-foreground">{desc}</span>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Continue <ArrowRight className="size-4" />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Import (CV upload or LinkedIn) → stub extraction API       */
/* ------------------------------------------------------------------ */

function ImportStep({
  method,
  onMethodChange,
  onBack,
  onExtracted,
}: {
  method: Method;
  onMethodChange: (m: Method) => void;
  onBack: () => void;
  onExtracted: (e: Extraction) => void;
}) {
  return (
    <div>
      <StepHeading
        title={method === "cv" ? "Upload your CV" : "Import from LinkedIn"}
        subtitle={
          method === "cv"
            ? "We'll read your CV and pull out education, experience and skills."
            : "Paste your public LinkedIn URL — we'll import your background."
        }
      />

      <div className="mb-6 inline-flex rounded-lg border bg-card p-1">
        {(["cv", "linkedin"] as Method[]).map((m) => (
          <button
            key={m}
            onClick={() => onMethodChange(m)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              method === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "cv" ? "CV file" : "LinkedIn"}
          </button>
        ))}
      </div>

      {method === "cv" ? (
        <CvUpload onExtracted={onExtracted} />
      ) : (
        <LinkedInImport onExtracted={onExtracted} />
      )}

      <NavRow onBack={onBack} />
    </div>
  );
}

function CvUpload({ onExtracted }: { onExtracted: (e: Extraction) => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const handleFile = async (file: File) => {
    setError("");
    if (!accept.includes(file.type) && !/\.(pdf|docx?)$/i.test(file.name)) {
      setError("Unsupported file. Upload a PDF or Word document.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("That file is over 10 MB. Try a smaller one.");
      return;
    }
    setFileName(file.name);
    setStatus("uploading");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/onboarding/extract", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("extract failed");
      const data: Extraction = await res.json();
      setStatus("done");
      // Small beat so the "Extracted successfully" state is visible before advancing.
      setTimeout(() => onExtracted(data), 400);
    } catch {
      setStatus("idle");
      setFileName("");
      setError("We couldn't read that file. Please try again.");
    }
  };

  if (status === "done") {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-foreground">{fileName}</div>
            <div className="text-xs text-success">Extracted successfully</div>
          </div>
          <Loader2 className="size-4 animate-spin text-muted-foreground/70" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => status === "idle" && inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card px-6 py-14 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {status === "uploading" ? (
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Loader2 className="size-4 animate-spin" /> Reading {fileName}…
          </div>
        ) : (
          <>
            <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-6" />
            </span>
            <p className="text-sm font-semibold text-foreground">
              Drag your CV here, or <span className="text-primary">browse</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">PDF or Word · up to 10 MB</p>
          </>
        )}
      </div>
      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
          <X className="size-4" /> {error}
        </p>
      )}
    </div>
  );
}

function LinkedInImport({ onExtracted }: { onExtracted: (e: Extraction) => void }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const start = async () => {
    if (!url.trim()) return;
    setError("");
    setStatus("uploading");
    try {
      const res = await fetch("/api/onboarding/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ linkedinUrl: url.trim() }),
      });
      if (!res.ok) throw new Error("extract failed");
      const data: Extraction = await res.json();
      setStatus("done");
      setTimeout(() => onExtracted(data), 400);
    } catch {
      setStatus("idle");
      setError("We couldn't import that profile. Check the URL and try again.");
    }
  };

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <label className="text-sm font-medium text-foreground">LinkedIn profile URL</label>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <Linkedin className="size-4 text-muted-foreground/70" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="linkedin.com/in/your-name"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </div>
        <Button onClick={start} disabled={!url.trim() || status !== "idle"}>
          {status === "uploading" ? <Loader2 className="animate-spin" /> : null}
          {status === "uploading" ? "Importing…" : status === "done" ? "Imported" : "Import"}
        </Button>
      </div>
      {status === "done" && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="size-4" /> Imported. Loading your details…
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-danger">
          <X className="size-4" /> {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Review extracted data (editable, validated)              */
/* ------------------------------------------------------------------ */

const basicsSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name."),
  headline: z.string().trim().max(120, "Keep your headline under 120 characters.").optional(),
});
type BasicsValues = z.infer<typeof basicsSchema>;

function ReviewStep({
  draft,
  onBack,
  onContinue,
}: {
  draft: OnboardingDraft;
  onBack: () => void;
  onContinue: (p: Partial<OnboardingDraft>) => void;
}) {
  const [education, setEducation] = useState<EduRow[]>(draft.education);
  const [experience, setExperience] = useState<ExpRow[]>(draft.experience);
  const [skillIds, setSkillIds] = useState<string[]>(draft.skillIds);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicsValues>({
    resolver: zodResolver(basicsSchema),
    defaultValues: { name: draft.name, headline: draft.headline },
  });

  const submit = (values: BasicsValues) =>
    onContinue({
      name: values.name.trim(),
      headline: values.headline?.trim() ?? "",
      education,
      experience,
      skillIds,
    });

  return (
    <form onSubmit={handleSubmit(submit)}>
      <StepHeading
        title="Review what we found"
        subtitle="Edit anything that's off, then confirm. You can always change it later."
      />

      {/* Rule 3 — be honest about verification state */}
      <div className="mb-6 flex items-start gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-warning" />
        <span>
          Imported from your profile — <strong>not yet verified</strong>. Your skills
          become <strong>verified Capabilities</strong> once educators evaluate your work.
        </span>
      </div>

      <div className="space-y-4">
        <ReviewCard title="Basics">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Full name
            </label>
            <input
              {...register("name")}
              aria-invalid={!!errors.name}
              className={`h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.name ? "border-danger ring-2 ring-danger/15" : ""
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Headline{" "}
              <span className="font-normal text-muted-foreground/70">(optional)</span>
            </label>
            <input
              {...register("headline")}
              placeholder="e.g. Blockchain Strategy & Implementation"
              aria-invalid={!!errors.headline}
              className={`h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                errors.headline ? "border-danger ring-2 ring-danger/15" : ""
              }`}
            />
            {errors.headline && (
              <p className="mt-1 text-xs text-danger">{errors.headline.message}</p>
            )}
          </div>
        </ReviewCard>

        <ReviewCard title="Education" icon={<GraduationCap className="size-4" />}>
          {education.length === 0 && <EmptyRow label="No education added yet." />}
          {education.map((e, i) => (
            <RowItem
              key={i}
              primary={e.degree}
              secondary={`${e.school} · ${e.year}`}
              onRemove={() => setEducation(education.filter((_, x) => x !== i))}
            />
          ))}
        </ReviewCard>

        <ReviewCard title="Experience" icon={<Briefcase className="size-4" />}>
          {experience.length === 0 && <EmptyRow label="No experience added yet." />}
          {experience.map((e, i) => (
            <RowItem
              key={i}
              primary={e.role}
              secondary={`${e.org} · ${e.period}`}
              onRemove={() => setExperience(experience.filter((_, x) => x !== i))}
            />
          ))}
        </ReviewCard>

        <ReviewCard title="Skills" hint="each counts toward a capability you can get evaluated on">
          <SkillPicker selectedIds={skillIds} onChange={setSkillIds} />
        </ReviewCard>
      </div>

      <NavRow onBack={onBack}>
        <Button type="submit">
          Looks good — create my profile <ArrowRight />
        </Button>
      </NavRow>
    </form>
  );
}

function ReviewCard({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-6 shadow-card">
      <header className="mb-3 flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {hint && <span className="text-xs text-muted-foreground/70">· {hint}</span>}
      </header>
      {children}
    </section>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground/70">{label}</p>;
}

function RowItem({
  primary,
  secondary,
  onRemove,
}: {
  primary: string;
  secondary: string;
  onRemove: () => void;
}) {
  return (
    <div className="row-interactive flex items-center justify-between border-b border-muted py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{primary}</div>
        <div className="truncate text-xs text-muted-foreground/70">{secondary}</div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-3 flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 hover:bg-danger/10 hover:text-danger"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Confirmation                                             */
/* ------------------------------------------------------------------ */

function Confirmation({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-9" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Your profile is ready</h1>
      <p className="mt-2 max-w-[460px] text-[15px] leading-relaxed text-muted-foreground">
        You went from no profile to a live one. Right now it holds your claims —
        the next step turns them into{" "}
        <span className="font-medium text-foreground">verified capabilities</span>.
      </p>

      <div className="mt-8 w-full max-w-[420px] rounded-xl border bg-card p-6 shadow-card text-left">
        <h2 className="text-sm font-semibold text-foreground">What happens next</h2>
        <ol className="mt-3 space-y-3">
          {[
            "Create your first Action — real work that becomes a verified Capability.",
            "Invite an educator to evaluate it.",
            "Their evaluation turns skills into verified Capabilities.",
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onFinish}>
          Go to my dashboard <ArrowRight />
        </Button>
        {/* Consumer-facing CTA uses outcome language (Capability); the route is
            the Week-3 Action wizard. */}
        <Button size="lg" variant="outline" asChild>
          <a href="/s/actions/create">Create my first Capability</a>
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                        */
/* ------------------------------------------------------------------ */

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function NavRow({
  onBack,
  children,
}: {
  onBack: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <Button type="button" variant="ghost" onClick={onBack}>
        <ArrowLeft /> Back
      </Button>
      {children}
    </div>
  );
}

"use client";

/**
 * Profile Onboarding — flow preview (Week 2)
 * ------------------------------------------------------------------
 * Welcome → Import (CV upload / LinkedIn) → Review → Confirmation
 * Goal: "No Profile → Profile Created in minutes."
 *
 * Mock data; NOT wired to Supabase. Design preview only.
 *
 * Built on the 8-July grill decisions (workspace docs 10–11):
 *  - Tokens only; DM Sans; real logo asset; Button component variants.
 *  - Focused-flow archetype (D4): minimal chrome, stepper, 760px column.
 *  - Vocabulary: Actions (D3 amended); raw imported "Skills" are the
 *    allowed input-stage use — they become verified Capabilities only
 *    after evaluation.
 *  - Forms spec (T7): h-10 inputs, primary focus ring, semantic states.
 *
 * UX rules: Rule 1 (always show progress), Rule 2 (one decision per
 * screen), Rule 3 (state nothing is verified yet), Rule 5 (every screen
 * says why it matters).
 */

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  GraduationCap,
  Linkedin,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { TopBar, TopBarBrand } from "@/components/ui/top-bar";

type Method = "cv" | "linkedin";
type Status = "idle" | "uploading" | "done";

const STEPS = ["Welcome", "Import", "Review", "Done"];

/* Mock "extracted" data shown on the Review step */
const initialEducation = [
  { school: "Quinnipiac University", degree: "BSc Business Analytics", year: "2024–2026" },
];
const initialExperience = [
  { role: "Finance & Strategy Intern", org: "XYZ Capital Partners", period: "2025" },
  { role: "Business Foundations", org: "Quinnipiac University", period: "2024" },
];
const initialSkills = [
  "Strategic Planning",
  "Data Analysis",
  "Blockchain Technology",
  "Financial Modeling",
  "Project Management",
];

export default function OnboardingPreview() {
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<Method>("cv");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Minimal chrome (focused flow, S6/S7): ink bar + stepper travel as
          ONE sticky unit so the stepper is always visible (T8). */}
      <div className="sticky top-0 z-20">
        <TopBar className="static">
          <TopBarBrand />
          <button className="text-sm font-medium text-white/70 hover:text-white">
            Save &amp; exit
          </button>
        </TopBar>

        {/* Progress stepper (Rule 1) — light row under the ink bar */}
        <Stepper current={step} />
      </div>

      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-6 py-10">
        {step === 0 && (
          <Welcome
            method={method}
            onPick={(m) => {
              setMethod(m);
              setStep(1);
            }}
            onScratch={() => setStep(2)}
          />
        )}
        {step === 1 && (
          <ImportStep
            method={method}
            onMethodChange={setMethod}
            onBack={() => setStep(0)}
            onContinue={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <ReviewStep onBack={() => setStep(1)} onContinue={() => setStep(3)} />
        )}
        {step === 3 && <Confirmation />}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stepper                                                            */
/* ------------------------------------------------------------------ */

function Stepper({ current }: { current: number }) {
  return (
    <div className="border-b bg-card">
      <ol className="mx-auto flex max-w-[760px] items-center gap-2 px-6 py-4">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? "bg-success text-success-foreground"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground/70"
                }`}
              >
                {done ? <Check className="size-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span
                className={`text-sm font-medium ${
                  active ? "text-foreground" : "text-muted-foreground/70"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={`mx-1 h-px flex-1 ${done ? "bg-success" : "bg-border"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
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

      {/* Third path (9-July grill Q4): no CV or LinkedIn required.
          In the real build this opens Review with empty fields. */}
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
/* Step 1 — Import (CV upload or LinkedIn)                            */
/* ------------------------------------------------------------------ */

function ImportStep({
  method,
  onMethodChange,
  onBack,
  onContinue,
}: {
  method: Method;
  onMethodChange: (m: Method) => void;
  onBack: () => void;
  onContinue: () => void;
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

      {/* method toggle */}
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

      {method === "cv" ? <CvUpload onDone={onContinue} /> : <LinkedInImport onDone={onContinue} />}

      <NavRow onBack={onBack} />
    </div>
  );
}

function CvUpload({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

  const handleFile = (file: File) => {
    setError("");
    if (!accept.includes(file.type) && !/\.(pdf|docx?|)$/i.test(file.name)) {
      setError("Unsupported file. Upload a PDF or Word document.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("That file is over 10 MB. Try a smaller one.");
      return;
    }
    setFileName(file.name);
    setStatus("uploading");
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setStatus("done");
          return 100;
        }
        return p + 12;
      });
    }, 140);
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
          <button
            onClick={() => {
              setStatus("idle");
              setProgress(0);
              setFileName("");
            }}
            className="text-xs font-medium text-muted-foreground/70 hover:text-muted-foreground"
          >
            Replace
          </button>
        </div>
        <Button onClick={onDone} className="mt-5 w-full">
          Review what we found <ArrowRight />
        </Button>
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
          <div className="w-full max-w-[320px]">
            <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="size-4 animate-spin" /> Reading {fileName}…
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
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

function LinkedInImport({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const start = () => {
    if (!url.trim()) return;
    setStatus("uploading");
    setTimeout(() => setStatus("done"), 1400);
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
        {status === "done" ? (
          <Button onClick={onDone}>
            Review <ArrowRight />
          </Button>
        ) : (
          <Button onClick={start} disabled={!url.trim() || status === "uploading"}>
            {status === "uploading" ? <Loader2 className="animate-spin" /> : null}
            {status === "uploading" ? "Importing…" : "Import"}
          </Button>
        )}
      </div>
      {status === "done" && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="size-4" /> Imported. Review your details next.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Review extracted data (editable)                         */
/* ------------------------------------------------------------------ */

/* AI-suggested canonical capabilities (mock — AI suggestion service in
   Week 2). Pattern: AI suggests, user confirms; nothing auto-applies. */
const initialSuggestions = ["Strategic Thinking", "Communication", "Solution Design"];

function ReviewStep({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [name, setName] = useState("André Pager");
  const [headline, setHeadline] = useState("Blockchain Strategy & Implementation");
  const [education, setEducation] = useState(initialEducation);
  const [experience, setExperience] = useState(initialExperience);
  const [skills, setSkills] = useState(initialSkills);
  const [newSkill, setNewSkill] = useState("");
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState(initialSuggestions);

  return (
    <div>
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
          <Field label="Full name" value={name} onChange={setName} />
          <Field label="Headline" value={headline} onChange={setHeadline} />
        </ReviewCard>

        <ReviewCard title="Education" icon={<GraduationCap className="size-4" />}>
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
          {experience.map((e, i) => (
            <RowItem
              key={i}
              primary={e.role}
              secondary={`${e.org} · ${e.period}`}
              onRemove={() => setExperience(experience.filter((_, x) => x !== i))}
            />
          ))}
        </ReviewCard>

        <ReviewCard title="Skills" hint="become Capabilities after evaluation">
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted py-1 pl-3 pr-1.5 text-sm font-medium text-foreground/80"
              >
                {s}
                <button
                  onClick={() => setSkills(skills.filter((x) => x !== s))}
                  className="flex size-4 items-center justify-center rounded-full text-muted-foreground/70 hover:bg-border hover:text-muted-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSkill.trim()) {
                  setSkills([...skills, newSkill.trim()]);
                  setNewSkill("");
                }
              }}
              placeholder="Add a skill"
              className="h-9 flex-1 rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (newSkill.trim()) {
                  setSkills([...skills, newSkill.trim()]);
                  setNewSkill("");
                }
              }}
            >
              <Plus /> Add
            </Button>
          </div>
        </ReviewCard>

        {/* AI signature surface (T2): sparkle + light blue, explicit label,
            confirm/dismiss per suggestion — never auto-applied. */}
        <section className="rounded-xl border border-primary-border bg-primary-soft p-6 shadow-card">
          <header className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">
              Suggested capabilities
            </h2>
            <span className="text-xs text-muted-foreground/70">· AI</span>
          </header>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Suggested from your skills — nothing is applied until you confirm.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const isConfirmed = confirmed.includes(s);
              return (
                <span
                  key={s}
                  className={`inline-flex items-center gap-1 rounded-full py-1 pl-3 pr-1.5 text-sm font-medium transition-colors ${
                    isConfirmed
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground ring-1 ring-primary/25"
                  }`}
                >
                  {isConfirmed && <Check className="size-3.5" />}
                  {s}
                  {!isConfirmed && (
                    <>
                      <button
                        onClick={() => setConfirmed([...confirmed, s])}
                        aria-label={`Confirm ${s}`}
                        className="flex size-5 items-center justify-center rounded-full text-success hover:bg-success/10"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setSuggestions(suggestions.filter((x) => x !== s))}
                        aria-label={`Dismiss ${s}`}
                        className="flex size-5 items-center justify-center rounded-full text-muted-foreground/70 hover:bg-danger/10 hover:text-danger"
                      >
                        <X className="size-3.5" />
                      </button>
                    </>
                  )}
                </span>
              );
            })}
            {suggestions.length === 0 && (
              <span className="text-sm text-muted-foreground/70">
                All suggestions handled.
              </span>
            )}
          </div>
        </section>
      </div>

      <NavRow onBack={onBack}>
        <Button onClick={onContinue}>
          Looks good — create my profile <ArrowRight />
        </Button>
      </NavRow>
    </div>
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

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
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

function Confirmation() {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      {/* Imagery slot (S5): the Done step may carry a flat brand-tint spot
          illustration; the icon chip below is the placeholder until assets exist. */}
      <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-9" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Your profile is ready</h1>
      <p className="mt-2 max-w-[460px] text-[15px] leading-relaxed text-muted-foreground">
        You went from no profile to a live one. Right now it holds your claims —
        the next step turns them into <span className="font-medium text-foreground">verified capabilities</span>.
      </p>

      {/* Rule 5 — what's next, and why it matters */}
      <div className="mt-8 w-full max-w-[420px] rounded-xl border bg-card p-6 shadow-card text-left">
        <h2 className="text-sm font-semibold text-foreground">What happens next</h2>
        <ol className="mt-3 space-y-3">
          {[
            "Create your first Action (a piece of real work).",
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
        <Button size="lg" asChild>
          <a href="/profile-studio-preview">
            View my Profile Studio <ArrowRight />
          </a>
        </Button>
        <Button size="lg" variant="outline">
          Create my first Action
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
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft /> Back
      </Button>
      {children}
    </div>
  );
}

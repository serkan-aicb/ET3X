"use client";

/**
 * Profile Onboarding — flow preview (Week 2)
 * ------------------------------------------------------------------
 * Covers the ClickUp subtasks in one walkable flow:
 *   Welcome → Import (CV upload / LinkedIn) → Review → Confirmation
 * Goal: "No Profile → Profile Created in minutes."
 *
 * Mock data; NOT wired to Supabase. Design preview only.
 *
 * Decisions applied:
 *  - D1  blue #2563EB chrome, green #10B981 = verified/trust.
 *  - D2  light-only.
 *  - D3  raw imported "Skills" are the ALLOWED input-stage use of the
 *        word — they become verified Capabilities only after evaluation.
 *  - D4  "focused flow" archetype: minimal chrome, progress stepper,
 *        no app sidebar.
 *  - D5  consumer-light (pride-first), reuses the frozen visual language.
 *
 * UX rules: Rule 1 (always show progress — stepper + upload progress),
 * Rule 2 (one decision per screen), Rule 3 (state nothing is verified yet),
 * Rule 5 (every screen says why it matters).
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
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#111827]">
      {/* Minimal chrome (focused flow — no app sidebar) */}
      <header className="flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-[#22B8CF] to-[#2563EB] text-sm font-bold text-white">
            X
          </div>
          <span className="text-[15px] font-semibold tracking-tight">Talent3X</span>
        </div>
        <button className="text-sm font-medium text-[#94A3B8] hover:text-[#64748B]">
          Save &amp; exit
        </button>
      </header>

      {/* Progress stepper (Rule 1) */}
      <Stepper current={step} />

      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-6 py-10">
        {step === 0 && (
          <Welcome
            method={method}
            onPick={(m) => {
              setMethod(m);
              setStep(1);
            }}
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
    <div className="border-b border-[#E2E8F0] bg-white">
      <ol className="mx-auto flex max-w-[760px] items-center gap-2 px-6 py-4">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  done
                    ? "bg-[#10B981] text-white"
                    : active
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#F1F5F9] text-[#94A3B8]"
                }`}
              >
                {done ? <Check className="size-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span
                className={`text-sm font-medium ${
                  active ? "text-[#111827]" : "text-[#94A3B8]"
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={`mx-1 h-px flex-1 ${done ? "bg-[#10B981]" : "bg-[#E2E8F0]"}`}
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
}: {
  method: Method;
  onPick: (m: Method) => void;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Let&apos;s build your capability profile
      </h1>
      <p className="mt-2 max-w-[560px] text-[15px] leading-relaxed text-[#64748B]">
        Start from your CV or LinkedIn. We&apos;ll turn it into a profile you can
        grow into <span className="font-medium text-[#111827]">verified capabilities</span> —
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

      <p className="mt-6 text-sm text-[#94A3B8]">
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
      className={`group flex flex-col items-start gap-3 rounded-xl border bg-white p-5 text-left transition-all hover:border-[#2563EB] hover:shadow-sm ${
        selected ? "border-[#2563EB] ring-1 ring-[#2563EB]" : "border-[#E2E8F0]"
      }`}
    >
      <span className="flex size-11 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
        {icon}
      </span>
      <span className="text-base font-semibold text-[#111827]">{title}</span>
      <span className="text-sm leading-relaxed text-[#64748B]">{desc}</span>
      <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#2563EB] opacity-0 transition-opacity group-hover:opacity-100">
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
      <div className="mb-6 inline-flex rounded-lg border border-[#E2E8F0] bg-white p-1">
        {(["cv", "linkedin"] as Method[]).map((m) => (
          <button
            key={m}
            onClick={() => onMethodChange(m)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              method === m ? "bg-[#2563EB] text-white" : "text-[#64748B] hover:text-[#111827]"
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
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[#ECFDF5] text-[#10B981]">
            <CheckCircle2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-[#111827]">{fileName}</div>
            <div className="text-xs text-[#10B981]">Extracted successfully</div>
          </div>
          <button
            onClick={() => {
              setStatus("idle");
              setProgress(0);
              setFileName("");
            }}
            className="text-xs font-medium text-[#94A3B8] hover:text-[#64748B]"
          >
            Replace
          </button>
        </div>
        <button
          onClick={onDone}
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
        >
          Review what we found <ArrowRight className="size-4" />
        </button>
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white px-6 py-14 text-center transition-colors ${
          dragging ? "border-[#2563EB] bg-[#EFF6FF]" : "border-[#CBD5E1] hover:border-[#2563EB]"
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
            <div className="mb-3 flex items-center justify-center gap-2 text-sm font-medium text-[#2563EB]">
              <Loader2 className="size-4 animate-spin" /> Reading {fileName}…
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className="h-full rounded-full bg-[#2563EB] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
              <Upload className="size-6" />
            </span>
            <p className="text-sm font-semibold text-[#111827]">
              Drag your CV here, or <span className="text-[#2563EB]">browse</span>
            </p>
            <p className="mt-1 text-xs text-[#94A3B8]">PDF or Word · up to 10 MB</p>
          </>
        )}
      </div>
      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-[#EF4444]">
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
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-6">
      <label className="text-sm font-medium text-[#111827]">LinkedIn profile URL</label>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-[#E2E8F0] px-3 focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]">
          <Linkedin className="size-4 text-[#94A3B8]" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="linkedin.com/in/your-name"
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-[#94A3B8]"
          />
        </div>
        {status === "done" ? (
          <button
            onClick={onDone}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#2563EB] px-5 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
          >
            Review <ArrowRight className="size-4" />
          </button>
        ) : (
          <button
            onClick={start}
            disabled={!url.trim() || status === "uploading"}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#2563EB] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
          >
            {status === "uploading" ? <Loader2 className="size-4 animate-spin" /> : null}
            {status === "uploading" ? "Importing…" : "Import"}
          </button>
        )}
      </div>
      {status === "done" && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-[#10B981]">
          <CheckCircle2 className="size-4" /> Imported. Review your details next.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Review extracted data (editable)                         */
/* ------------------------------------------------------------------ */

function ReviewStep({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [name, setName] = useState("André Pager");
  const [headline, setHeadline] = useState("Blockchain Strategy & Implementation");
  const [education, setEducation] = useState(initialEducation);
  const [experience, setExperience] = useState(initialExperience);
  const [skills, setSkills] = useState(initialSkills);
  const [newSkill, setNewSkill] = useState("");

  return (
    <div>
      <StepHeading
        title="Review what we found"
        subtitle="Edit anything that's off, then confirm. You can always change it later."
      />

      {/* Rule 3 — be honest about verification state */}
      <div className="mb-6 flex items-start gap-2 rounded-lg bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        <span>
          Imported from your {`profile`} — <strong>not yet verified</strong>. Your skills
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
                className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] py-1 pl-3 pr-1.5 text-sm font-medium text-[#334155]"
              >
                {s}
                <button
                  onClick={() => setSkills(skills.filter((x) => x !== s))}
                  className="flex size-4 items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#E2E8F0] hover:text-[#475569]"
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
              className="h-9 flex-1 rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
            <button
              onClick={() => {
                if (newSkill.trim()) {
                  setSkills([...skills, newSkill.trim()]);
                  setNewSkill("");
                }
              }}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 text-sm font-medium text-[#334155] hover:bg-[#F8FAFC]"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>
        </ReviewCard>
      </div>

      <NavRow onBack={onBack}>
        <button
          onClick={onContinue}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#2563EB] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
        >
          Looks good — create my profile <ArrowRight className="size-4" />
        </button>
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
    <section className="rounded-xl border border-[#E2E8F0] bg-white p-5">
      <header className="mb-3 flex items-center gap-2">
        {icon && <span className="text-[#64748B]">{icon}</span>}
        <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
        {hint && <span className="text-xs text-[#94A3B8]">· {hint}</span>}
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
      <label className="mb-1 block text-xs font-medium text-[#64748B]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
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
    <div className="flex items-center justify-between border-b border-[#F1F5F9] py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-[#111827]">{primary}</div>
        <div className="truncate text-xs text-[#94A3B8]">{secondary}</div>
      </div>
      <button
        onClick={onRemove}
        className="ml-3 flex size-7 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#EF4444]"
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
      <span className="flex size-16 items-center justify-center rounded-full bg-[#ECFDF5] text-[#10B981]">
        <CheckCircle2 className="size-9" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Your profile is ready</h1>
      <p className="mt-2 max-w-[460px] text-[15px] leading-relaxed text-[#64748B]">
        You went from no profile to a live one. Right now it holds your claims —
        the next step turns them into <span className="font-medium text-[#111827]">verified capabilities</span>.
      </p>

      {/* Rule 5 — what's next, and why it matters */}
      <div className="mt-8 w-full max-w-[420px] rounded-xl border border-[#E2E8F0] bg-white p-5 text-left">
        <h2 className="text-sm font-semibold text-[#111827]">What happens next</h2>
        <ol className="mt-3 space-y-3">
          {[
            "Create your first Action (a piece of real work).",
            "Invite an educator to evaluate it.",
            "Their evaluation turns skills into verified Capabilities.",
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-[#475569]">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[11px] font-semibold text-[#2563EB]">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <a
          href="/profile-studio-preview"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
        >
          View my Profile Studio <ArrowRight className="size-4" />
        </a>
        <button className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-6 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#F8FAFC]">
          Create my first Action
        </button>
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
      <p className="mt-1.5 text-[15px] text-[#64748B]">{subtitle}</p>
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
      <button
        onClick={onBack}
        className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-[#64748B] transition-colors hover:text-[#111827]"
      >
        <ArrowLeft className="size-4" /> Back
      </button>
      {children}
    </div>
  );
}

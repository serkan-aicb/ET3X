"use client";

/**
 * AccountGate — rudimentary-profile gate (Handover v1.7 R12 / spec v6 §2).
 * Every actor needs a minimum profile (email + organisation + function) before
 * they can evaluate or receive an action — there is NO token-only / no-account
 * path. The invite link still resolves (the page renders); this gate sits in
 * front of the flow and reveals `children` once a profile exists.
 *
 * Nothing is written until the signup fully completes — no partial/pending row.
 * Frozen build: the "profile" is a localStorage record.
 * TODO(cyprian): create the real profiles row on rudimentary signup.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DRAFT_KEYS, useLocalDraft, writeDraft } from "@/lib/local-draft";
import type { RudimentaryProfile } from "@/lib/actions/types";

const NO_PROFILE: RudimentaryProfile | null = null;

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  organisation: z.string().trim().min(1, "Enter your organisation."),
  function: z.string().trim().min(1, "Enter your role or function."),
});
type Values = z.infer<typeof schema>;

export function AccountGate({
  title = "Create your profile to continue",
  subtitle = "The minimum we need before you can take part — no full profile required.",
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const profile = useLocalDraft<RudimentaryProfile | null>(
    DRAFT_KEYS.rudimentaryProfile,
    NO_PROFILE
  );

  if (profile && profile.email) return <>{children}</>;
  return <SignupCard title={title} subtitle={subtitle} />;
}

function SignupCard({ title, subtitle }: { title: string; subtitle: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", organisation: "", function: "" },
  });

  // Only write on a fully-valid submit — no partial row (R12).
  const onSubmit = (v: Values) =>
    writeDraft<RudimentaryProfile>(DRAFT_KEYS.rudimentaryProfile, {
      email: v.email.trim(),
      organisation: v.organisation.trim(),
      function: v.function.trim(),
    });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-[440px] rounded-xl border bg-card p-8 shadow-card">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3">
          <Field label="Email" error={errors.email?.message}>
            <input
              type="email"
              autoComplete="email"
              {...register("email")}
              placeholder="you@work.com"
              className={inputCls(!!errors.email)}
            />
          </Field>
          <Field label="Organisation" error={errors.organisation?.message}>
            <input
              {...register("organisation")}
              placeholder="Company or university"
              className={inputCls(!!errors.organisation)}
            />
          </Field>
          <Field label="Role / function" error={errors.function?.message}>
            <input
              {...register("function")}
              placeholder="e.g. Professor, Manager, Engineer"
              className={inputCls(!!errors.function)}
            />
          </Field>
          <Button type="submit" className="mt-2 w-full">
            Continue
          </Button>
        </form>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/70">
          This is the minimum needed to take part. You can build a full profile
          (CV / LinkedIn) later — it&apos;s never required to participate.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

const inputCls = (err: boolean) =>
  `h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
    err ? "border-danger ring-2 ring-danger/15" : ""
  }`;

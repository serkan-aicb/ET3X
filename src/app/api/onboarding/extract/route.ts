import { NextResponse } from "next/server";

/**
 * STUB — Profile extraction endpoint (Week 2 frozen build).
 *
 * The UI calls this after a CV upload or LinkedIn URL submit and renders the
 * returned structured data on the Review step. This stub returns fixed mock
 * data after a short delay so the flow is demoable end-to-end today.
 *
 * Contract (stable — the real service must match this shape):
 *   POST /api/onboarding/extract
 *     • CV:       multipart/form-data with field `file` (PDF/Word)
 *     • LinkedIn: application/json { "linkedinUrl": string }
 *   200 → {
 *     source: "cv" | "linkedin",
 *     education:  { school: string; degree: string; year: string }[],
 *     experience: { role: string; org: string; period: string }[],
 *     skillIds:   string[]   // resolved to the governed 497-skill catalogue
 *   }
 *   400 → { error: string }
 *
 * v1.6 alignment: skills are the governed catalogue (497 labels), not free text.
 * The extractor returns catalogue skill_ids; the UI shows each as
 * "counts toward <capability>" and lets the user add more via typeahead.
 * TODO(nivin): replace this stub with the real AI extraction + skill-normalisation
 * service. This route does NOT touch Supabase (persistence is client-side
 * localStorage for the frozen build; real persistence is Cyprian's schema).
 */

const MOCK_EXTRACTION = {
  education: [
    { school: "Quinnipiac University", degree: "BSc Business Analytics", year: "2024–2026" },
  ],
  experience: [
    { role: "Finance & Strategy Intern", org: "XYZ Capital Partners", period: "2025" },
    { role: "Business Foundations", org: "Quinnipiac University", period: "2024" },
  ],
  // Real catalogue skill_ids across several capabilities (Critical Thinking,
  // Problem Solving, Teamwork, Written Communication).
  skillIds: ["SK-001", "SK-011", "SK-096", "SK-056"],
} as const;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let source: "cv" | "linkedin";

  if (contentType.includes("application/json")) {
    let body: { linkedinUrl?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    if (!body.linkedinUrl || !body.linkedinUrl.trim()) {
      return NextResponse.json({ error: "Missing linkedinUrl." }, { status: 400 });
    }
    source = "linkedin";
  } else if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing CV file." }, { status: 400 });
    }
    source = "cv";
  } else {
    return NextResponse.json(
      { error: "Send multipart/form-data (CV) or application/json (LinkedIn)." },
      { status: 400 }
    );
  }

  // Simulate processing latency so the loading UI is exercised.
  await new Promise((r) => setTimeout(r, 900));

  return NextResponse.json({ source, ...MOCK_EXTRACTION }, { status: 200 });
}

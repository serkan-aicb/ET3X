import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = {
  title: "How It Works — Talent3X",
  description: "From work to verified capability record — five steps explained.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      n: "01",
      label: "Work",
      color: "bg-slate-700",
      headline: "A student completes a task",
      details: [
        "Tasks exist within courses, group projects, or supervised placements.",
        "Each task is defined by an educator or supervisor and assigned to one or more students.",
        "Tasks include defined skill areas, difficulty levels, and submission requirements.",
        "Students submit their work directly through the platform — files, links, and notes.",
      ],
    },
    {
      n: "02",
      label: "Evaluation",
      color: "bg-blue-600",
      headline: "An educator evaluates the submission",
      details: [
        "The responsible educator reviews the submitted work.",
        "Each evaluation is structured — skills are rated on a defined scale.",
        "Evaluation is tied to the specific educator who assessed the work, creating accountability.",
        "Students are notified when their work has been evaluated.",
      ],
    },
    {
      n: "03",
      label: "Skill Mapping",
      color: "bg-blue-600",
      headline: "Evaluations are mapped to a consistent skill taxonomy",
      details: [
        "Every evaluation maps to a shared skill taxonomy across the institution.",
        "This creates comparability — the same skill assessed in different courses produces a consistent data point.",
        "Educators do not need to redesign their evaluation approach. The mapping is handled by the platform.",
        "Skills can be institution-defined or aligned with recognised external frameworks.",
      ],
    },
    {
      n: "04",
      label: "Capability Record",
      color: "bg-blue-600",
      headline: "Evaluations accumulate into a continuous record",
      details: [
        "Each evaluation adds to the student's capability record — it is never a single snapshot.",
        "The record reflects capability across all contexts: courses, projects, and real-world work.",
        "Institutions gain aggregate views across programs, cohorts, and time periods.",
        "The record is structured, consistent, and auditable.",
      ],
    },
    {
      n: "05",
      label: "Student Profile",
      color: "bg-emerald-600",
      headline: "The student receives a verified, portable profile",
      details: [
        "Students can view and share their capability profile at any time.",
        "The profile reflects verified capability — not self-reported claims.",
        "Profiles travel beyond the institution: students retain access after graduation.",
        "Employers and partners can view shared profiles to assess real capability.",
      ],
    },
  ];

  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">How It Works</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6 max-w-2xl">
            From work to verified capability — five steps
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl">
            Making student capability visible, portable and valuable — without changing existing course structures.
          </p>
        </div>
      </section>

      {/* Step-by-step */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 space-y-16">
          {steps.map((s) => (
            <div key={s.n} className="grid sm:grid-cols-[80px_1fr] gap-8 items-start">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-full ${s.color} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                  {s.n}
                </div>
                <p className="text-xs font-semibold text-slate-500 text-center">{s.label}</p>
              </div>
              <div className="border border-slate-200 rounded-xl p-7">
                <h2 className="text-xl font-bold text-slate-900 mb-5">{s.headline}</h2>
                <ul className="space-y-3">
                  {s.details.map((d) => (
                    <li key={d} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key principles */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Key Principles</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-12">What makes this different</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "No system replacement",
                desc: "Talent3X does not require any change to existing LMS, grading, or course structures. It connects what already exists.",
              },
              {
                title: "Continuous, not episodic",
                desc: "The capability record builds over time across all contexts — not just at graduation or in a single assessment.",
              },
              {
                title: "Structured and consistent",
                desc: "A shared skill taxonomy ensures that evaluations across different courses and departments are comparable.",
              },
              {
                title: "Verified, not self-reported",
                desc: "Every data point in a student's profile is verified by an educator or supervisor — not self-declared.",
              },
              {
                title: "Portable and student-owned",
                desc: "Students retain access to their profiles after graduation. Their record is theirs — not locked to any institution.",
              },
              {
                title: "Institutionally actionable",
                desc: "Aggregate data enables institutions to identify curriculum gaps, track program performance, and generate outcome evidence.",
              },
            ].map((p) => (
              <div key={p.title} className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-700">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-blue-200 mb-10">
            Whether you are a student or an institution, Talent3X is live and ready to use.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://app.talent3x.com/signup?role=student"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors"
            >
              Start as Student
            </a>
            <Link
              href="/universities#request"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white text-white font-semibold hover:bg-white hover:text-blue-700 transition-colors"
            >
              Request Institutional Access
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

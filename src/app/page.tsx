import Link from "next/link";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

function CapabilityMockup() {
  const skills = [
    { name: "Critical Thinking", val: 82 },
    { name: "Communication", val: 90 },
    { name: "Problem Solving", val: 68 },
    { name: "Data Analysis", val: 74 },
    { name: "Project Management", val: 80 },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 shadow-2xl bg-white overflow-hidden w-full max-w-sm mx-auto lg:mx-0">
      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
        <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
        <span className="ml-3 text-slate-500 text-xs font-mono truncate">app.talent3x.com/profile</span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            AW
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Anna Weber</p>
            <p className="text-xs text-slate-500 truncate">Computer Science · Year 3</p>
          </div>
          <span className="ml-auto shrink-0 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
            ✓ Verified
          </span>
        </div>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Capability Profile</p>
        <div className="space-y-2.5 mb-5">
          {skills.map((s) => (
            <div key={s.name}>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{s.name}</span>
                <span className="text-slate-400">{s.val}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${s.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap pt-4 border-t border-slate-100">
          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">3 Courses</span>
          <span className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">2 Projects</span>
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">1 Internship</span>
        </div>
      </div>
    </div>
  );
}

function StepFlow() {
  const steps = [
    { n: "01", label: "Work", desc: "Students complete tasks across courses, projects, and real-world placements." },
    { n: "02", label: "Evaluation", desc: "Lecturers and supervisors evaluate and rate performance against defined skills." },
    { n: "03", label: "Skill Mapping", desc: "Each evaluation is mapped to a structured, consistent skill taxonomy." },
    { n: "04", label: "Capability Record", desc: "All evaluations are aggregated into a continuous, verified capability record." },
    { n: "05", label: "Student Profile", desc: "Students receive a portable, shareable profile that travels with them." },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
      {steps.map((s, i) => (
        <div key={s.n} className="relative flex flex-col items-center text-center">
          {i < steps.length - 1 && (
            <div className="hidden sm:block absolute top-5 left-[calc(50%+20px)] right-0 h-px bg-blue-200" />
          )}
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mb-3 z-10 relative shrink-0">
            {s.n}
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">{s.label}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <MarketingNav />

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 lg:pb-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">
              Capability Infrastructure for Higher Education
            </p>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Making student capability visible across contexts —{" "}
              <span className="text-blue-600">not just courses</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-3">
              Extending internal learning and real-world work into a continuous capability layer.
            </p>
            <p className="text-sm text-slate-500 mb-10 pb-10 border-b border-slate-100">
              Built on what exists. No change to course structures.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/universities"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                For Universities
              </Link>
              <Link
                href="/students"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-blue-600 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                For Students
              </Link>
              <a
                href="/auth"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Open Talent3X →
              </a>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <CapabilityMockup />
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="why" className="py-20 lg:py-28 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">The Problem</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-10">
              Student capability is difficult to understand at scale
            </h2>
            <ul className="space-y-5 mb-12">
              {[
                "Results remain tied to individual courses — with no consistent view across programs.",
                "Internal learning and real-world work remain entirely disconnected.",
                "There is no shared language for what a graduate can actually do.",
                "Institutions cannot compare, interpret, or communicate capability over time.",
              ].map((item) => (
                <li key={item} className="flex gap-4 text-slate-300 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="border-l-4 border-blue-500 pl-6 py-2">
              <p className="text-white font-semibold text-lg leading-snug">
                Institutions lack a continuous, defensible view of graduate capability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">The Solution</p>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-8">
              A capability layer that connects evaluation across contexts
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6 text-lg">
              Evaluation already exists across courses, projects, and real-world work.
            </p>
            <p className="text-slate-600 leading-relaxed mb-10">
              Talent3X connects all of this into a single, continuous capability record — structured, verified, and portable. Students build a meaningful profile. Institutions gain defensible graduate outcomes. Employers see evidence, not claims.
            </p>
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-6">
              <p className="text-sm font-semibold text-blue-900 mb-1">Important</p>
              <p className="text-blue-800 leading-relaxed">
                This layer does not replace existing systems — it connects what already exists. No change to course structures, grading systems, or administrative workflows is required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">How It Works</p>
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 lg:max-w-xl">
              Five steps from work to verified capability
            </h2>
            <p className="text-slate-500 lg:ml-auto lg:max-w-xs lg:text-right text-sm leading-relaxed">
              Making student capability visible, portable and valuable — without changing existing course structures.
            </p>
          </div>
          <StepFlow />
          <div className="mt-14 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-blue-600 text-sm font-semibold hover:underline"
            >
              See the full process →
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROOF ── */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Evidence</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 max-w-2xl">
            The gap is documented across mature education systems
          </h2>
          <p className="text-slate-500 mb-14 max-w-2xl">
            Independent evidence from leading education markets confirms the structural challenge Talent3X addresses.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-14">
            <div className="border border-slate-200 rounded-xl p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Finland</p>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Competency-led, yet capability remains local
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Finland leads global education benchmarks and has embedded competency-based learning at a national level. Yet capability achieved in coursework remains invisible beyond the institution — there is no infrastructure to make it portable or comparable.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">United Kingdom</p>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Institutions are measured, graduates are not
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                The UK&apos;s Teaching Excellence Framework and Graduate Outcomes Survey demonstrate that institutions are already held accountable for outcomes. Yet graduate capability remains assessable only in aggregate — not at the individual level that students and employers need.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">United States</p>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Skills-based hiring, without the infrastructure
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Major employers are actively shifting to skills-based hiring. The demand for verified, context-rich capability records is growing rapidly — but the infrastructure to deliver this at scale across institutions does not yet exist.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center">
            <p className="text-slate-700 font-medium">
              This is not institution-specific — it is a systemic gap that exists across mature higher education markets.
            </p>
          </div>
        </div>
      </section>

      {/* ── VALUE SPLIT ── */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Who Benefits</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-14">
            Clear value for both sides
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-xl bg-white border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">For Students</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Visibility of real, provable capability — not just grades",
                  "Stronger positioning with employers through verified output",
                  "A profile that travels beyond the institution",
                  "Ownership and control over your own capability data",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/auth?mode=register&role=student"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start as Student
                </Link>
              </div>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">For Universities</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Defensible graduate outcomes with structured evidence",
                  "Continuous visibility across programs, projects, and placements",
                  "Consistent evaluation language across departments",
                  "Institutional differentiation and accreditation alignment",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/universities#request"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-slate-900 text-slate-900 text-sm font-semibold hover:bg-slate-900 hover:text-white transition-colors"
                >
                  Request Institutional Access
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 lg:py-28 bg-blue-700">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 text-center">
            Start building capability — today
          </h2>
          <p className="text-blue-200 text-center mb-14 max-w-xl mx-auto">
            Talent3X is live. Choose your path below.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl bg-white/10 border border-white/20 p-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-3">Students</p>
              <h3 className="text-lg font-bold mb-3">Build your capability record</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Create a verified, portable profile of your work across courses, projects, and placements.
              </p>
              <a
                href="/auth?mode=register&role=student"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-white text-blue-700 text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                Start as Student
              </a>
            </div>

            <div className="rounded-xl bg-white/10 border border-white/20 p-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-3">Universities</p>
              <h3 className="text-lg font-bold mb-3">Get institutional access</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Connect your courses, programs, and placements into a defensible capability layer.
              </p>
              <Link
                href="/universities#request"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-white text-white text-sm font-semibold hover:bg-white hover:text-blue-700 transition-colors"
              >
                Request Institutional Access
              </Link>
            </div>

            <div className="rounded-xl bg-white/10 border border-white/20 p-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-3">Existing Users</p>
              <h3 className="text-lg font-bold mb-3">Access the platform</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Already on Talent3X? Log in or open the platform directly.
              </p>
              <a
                href="/auth"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-white text-white text-sm font-semibold hover:bg-white hover:text-blue-700 transition-colors"
              >
                Open Talent3X
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL STATEMENT ── */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm uppercase tracking-widest mb-4">In summary</p>
          <p className="text-2xl lg:text-3xl font-semibold text-slate-900 leading-snug">
            This is not a new system —<br />
            it makes what already exists{" "}
            <span className="text-blue-600">visible, measurable, and defensible.</span>
          </p>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

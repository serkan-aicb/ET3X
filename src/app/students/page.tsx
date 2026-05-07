import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

function ProfileMockup() {
  const skills = [
    { name: "Critical Thinking", val: 82, context: "Courses + Projects" },
    { name: "Communication", val: 90, context: "Courses" },
    { name: "Problem Solving", val: 68, context: "Internship" },
    { name: "Data Analysis", val: 74, context: "Projects" },
    { name: "Project Management", val: 80, context: "Projects + Internship" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 shadow-2xl bg-white overflow-hidden w-full max-w-md mx-auto">
      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
        <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
        <span className="ml-3 text-slate-500 text-xs font-mono">app.talent3x.com/profile</span>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
            AW
          </div>
          <div>
            <p className="font-semibold text-slate-900">Anna Weber</p>
            <p className="text-sm text-slate-500">Computer Science · University of Helsinki</p>
          </div>
          <span className="ml-auto text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full shrink-0">
            ✓ Verified
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-slate-900">12</p>
            <p className="text-xs text-slate-500 mt-0.5">Tasks</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-slate-900">4</p>
            <p className="text-xs text-slate-500 mt-0.5">Contexts</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-slate-900">5</p>
            <p className="text-xs text-slate-500 mt-0.5">Skills</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Verified Skills</p>
        <div className="space-y-3">
          {skills.map((s) => (
            <div key={s.name}>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span className="font-medium">{s.name}</span>
                <span className="text-slate-400">{s.context}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${s.val}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "For Students — Talent3X",
  description: "Build a verified capability record across courses, projects, and real-world work.",
};

export default function StudentsPage() {
  const values = [
    {
      title: "Track your capability across contexts",
      desc: "Every task you complete — in courses, projects, and placements — is mapped to a consistent skill set and added to your record.",
    },
    {
      title: "Verified by lecturers and supervisors",
      desc: "Your capabilities are not self-reported. They are evaluated and verified by educators who worked with you directly.",
    },
    {
      title: "Share your profile with employers",
      desc: "Your capability profile is portable. Share it in applications, interviews, or anywhere you want to demonstrate what you can do.",
    },
    {
      title: "Own your data",
      desc: "Your capability record is yours. You control what you share and with whom — it travels with you beyond any single institution.",
    },
  ];

  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">For Students</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Your capability. Visible. Portable. Yours.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-10">
              Build a verified record of your work across courses, projects, and real-world experience — and take it anywhere.
            </p>
            <a
              href="/auth?mode=register&role=student"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Start as Student
            </a>
          </div>
        </div>
      </section>

      {/* Value */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">What You Get</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-10">
                A record that reflects what you can actually do
              </h2>
              <div className="space-y-8">
                {values.map((v) => (
                  <div key={v.title} className="flex gap-5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{v.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ProfileMockup />
          </div>
        </div>
      </section>

      {/* How it works for students */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Getting Started</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Three steps to your capability profile</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                n: "1",
                title: "Create your account",
                desc: "Sign up as a student. Your profile starts empty and fills as you complete and submit work.",
              },
              {
                n: "2",
                title: "Complete and submit tasks",
                desc: "Work on tasks assigned within your courses, projects, or placements. Submit your work directly through the platform.",
              },
              {
                n: "3",
                title: "Receive verified evaluations",
                desc: "Your lecturer or supervisor evaluates your work. Each evaluation maps to your capability profile — automatically.",
              },
            ].map((step) => (
              <div key={step.n} className="border border-slate-200 rounded-xl p-6">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mb-4">
                  {step.n}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-blue-700">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start building your capability record
          </h2>
          <p className="text-blue-200 mb-8">
            Join students who are making their work visible and their capability defensible.
          </p>
          <a
            href="/auth?mode=register&role=student"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-50 transition-colors"
          >
            Start as Student
          </a>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

"use client";

import { useState } from "react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

function DashboardMockup() {
  const programs = [
    { name: "Computer Science", avg: 78, students: 142 },
    { name: "Business & Management", avg: 72, students: 89 },
    { name: "Engineering", avg: 81, students: 203 },
    { name: "Social Sciences", avg: 69, students: 67 },
  ];
  const skills = [
    { name: "Critical Thinking", vals: [82, 74, 88, 70] },
    { name: "Communication", vals: [85, 80, 76, 82] },
    { name: "Problem Solving", vals: [79, 68, 90, 64] },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 shadow-2xl bg-white overflow-hidden w-full">
      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
        <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
        <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
        <span className="ml-3 text-slate-500 text-xs font-mono">app.talent3x.com/admin/overview</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-5 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xl font-bold text-blue-700">501</p>
            <p className="text-xs text-slate-500 mt-0.5">Active Students</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xl font-bold text-slate-900">4</p>
            <p className="text-xs text-slate-500 mt-0.5">Programs</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xl font-bold text-green-700">76%</p>
            <p className="text-xs text-slate-500 mt-0.5">Avg. Capability</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Program Comparison</p>
        <div className="space-y-2 mb-5">
          {programs.map((p) => (
            <div key={p.name}>
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{p.name}</span>
                <span className="text-slate-400">{p.students} students · {p.avg}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.avg}%` }} />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Skill Heatmap</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-slate-500 font-medium pb-2 pr-3">Skill</th>
                {programs.map((p) => (
                  <th key={p.name} className="text-slate-500 font-medium pb-2 px-1.5 text-center whitespace-nowrap">
                    {p.name.split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr key={s.name}>
                  <td className="py-1.5 pr-3 text-slate-700 whitespace-nowrap">{s.name}</td>
                  {s.vals.map((v, i) => (
                    <td key={i} className="py-1.5 px-1.5 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-white text-xs font-medium"
                        style={{ backgroundColor: `hsl(${Math.round(v * 1.2)}, 70%, 45%)` }}
                      >
                        {v}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    institution: "",
    role: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Request received</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Thank you for your interest. We will review your request and get back to you within 2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="req-name">
            Name
          </label>
          <input
            id="req-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="req-institution">
            Institution
          </label>
          <input
            id="req-institution"
            type="text"
            required
            value={form.institution}
            onChange={(e) => setForm({ ...form, institution: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="University or institution"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="req-role">
            Role
          </label>
          <input
            id="req-role"
            type="text"
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="e.g. Dean, Programme Director"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="req-email">
            Email
          </label>
          <input
            id="req-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="your@university.edu"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="req-message">
          Message
        </label>
        <textarea
          id="req-message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
          placeholder="Tell us about your institution and what you are looking to achieve"
        />
      </div>
      <button
        type="submit"
        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        Request Access
      </button>
    </form>
  );
}

export default function UniversitiesPage() {
  const values = [
    {
      title: "Continuous visibility across programs",
      desc: "See capability aggregated across courses, projects, and placements — not as isolated results, but as a continuous record.",
    },
    {
      title: "Defensible graduate outcomes",
      desc: "Generate evidence-based outcome data that can be used for accreditation, reporting, and institutional positioning.",
    },
    {
      title: "Accreditation alignment",
      desc: "Map institutional evaluations to recognised skill taxonomies and competency frameworks relevant to your accreditation requirements.",
    },
    {
      title: "Data-driven curriculum insights",
      desc: "Identify where students consistently develop strong capability and where gaps persist — across departments and programs.",
    },
    {
      title: "Institutional differentiation",
      desc: "Position your institution as one that produces graduates with measurable, verified, portable capability — not just credentials.",
    },
  ];

  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">For Universities</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Defensible outcomes.<br />Measurable impact.<br />Institutional advantage.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-10">
              See the full picture of graduate capability — and prove the impact of education.
            </p>
            <a
              href="#request"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Request Institutional Access
            </a>
          </div>
        </div>
      </section>

      {/* Value */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Institutional Value</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-10">
                Infrastructure for graduate outcomes at scale
              </h2>
              <div className="space-y-7">
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
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* How it works for institutions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Implementation</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">How institutional onboarding works</h2>
          <p className="text-slate-500 mb-12 max-w-2xl">
            Talent3X connects with existing course and evaluation structures. No system replacement. No additional administrative burden.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "1", title: "Request access", desc: "Submit the form below. We review and schedule an onboarding call within 2 business days." },
              { n: "2", title: "Define your context", desc: "We map your programs, tasks, and evaluation roles into the platform structure." },
              { n: "3", title: "Invite educators and students", desc: "Educators and students are onboarded via a simple invitation flow — no complex provisioning." },
              { n: "4", title: "Start generating outcomes data", desc: "As evaluations are completed, capability records accumulate automatically." },
            ].map((s) => (
              <div key={s.n} className="border border-slate-200 rounded-xl p-6">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mb-4">
                  {s.n}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request form */}
      <section id="request" className="py-20 bg-slate-50 scroll-mt-16">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Get Started</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Request Institutional Access</h2>
          <p className="text-slate-500 mb-10">
            Complete the form below and a member of our team will be in touch within 2 business days.
          </p>
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <RequestForm />
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

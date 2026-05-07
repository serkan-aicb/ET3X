"use client";

import { useState } from "react";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", organisation: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Message received</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Thank you for reaching out. We will review your message and be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="p-name">Name</label>
          <input
            id="p-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="p-org">Organisation</label>
          <input
            id="p-org"
            type="text"
            required
            value={form.organisation}
            onChange={(e) => setForm({ ...form, organisation: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="Organisation or fund"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="p-email">Email</label>
        <input
          id="p-email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          placeholder="you@organisation.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="p-message">Message</label>
        <textarea
          id="p-message"
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
          placeholder="Tell us about your interest in Talent3X"
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
      >
        Request Conversation
      </button>
    </form>
  );
}

export default function PartnersPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Partners &amp; Investors</p>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
              Building the infrastructure layer for graduate capability
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Talent3X addresses a structural gap in higher education that exists across every mature market. We are building the infrastructure that connects evaluation to outcome — at scale.
            </p>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Vision</p>
              <h2 className="text-3xl font-bold text-slate-900 mb-8">
                A capability layer between education and employment
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Higher education produces outcomes that are poorly communicated to the world outside the institution. Students graduate with credentials that signal completion — not capability. Employers make hiring decisions based on proxies — not evidence.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                Talent3X builds the missing layer: a continuous, verified, portable capability record that travels from the first course to the first job — and beyond.
              </p>
              <p className="text-slate-600 leading-relaxed">
                This is not an edtech product. It is infrastructure — analogous to what credit bureaus did for financial identity, applied to professional capability.
              </p>
            </div>

            <div className="space-y-6">
              <div className="border border-slate-200 rounded-xl p-6 bg-white">
                <h3 className="font-semibold text-slate-900 mb-3">Why this matters structurally</h3>
                <ul className="space-y-3">
                  {[
                    "The gap between graduate output and employer expectations is growing across all markets.",
                    "Institutions are increasingly held accountable for outcomes — without the tools to demonstrate them.",
                    "Students bear the reputational cost of institutions that cannot communicate their value.",
                    "The infrastructure to connect evaluation to evidence does not yet exist at scale.",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-blue-200 bg-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-3">Market context</h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  There are over 25,000 higher education institutions globally, educating more than 235 million students. The structural gap Talent3X addresses is universal — it is not specific to any country, system, or discipline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Evidence */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Evidence</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-12">Validation from institutions</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                stat: "Live",
                label: "Platform status",
                desc: "Talent3X is operational and in active use with partner institutions. This is not a concept or prototype.",
              },
              {
                stat: "Multi-context",
                label: "Evaluation coverage",
                desc: "Evaluations are captured across courses, group projects, and supervised real-world placements — all within a single record.",
              },
              {
                stat: "Portable",
                label: "Graduate continuity",
                desc: "Student profiles persist after graduation. The capability record is not lost when the institutional relationship ends.",
              },
            ].map((item) => (
              <div key={item.label} className="border border-slate-200 rounded-xl p-6">
                <p className="text-3xl font-bold text-blue-600 mb-1">{item.stat}</p>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{item.label}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-slate-950 text-white p-8">
            <p className="text-xl font-semibold mb-3">
              &ldquo;The problem is not that institutions lack good graduates — it is that they lack the infrastructure to prove it.&rdquo;
            </p>
            <p className="text-slate-400 text-sm">Talent3X — Core Thesis</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Get in Touch</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Request a conversation</h2>
          <p className="text-slate-500 mb-10">
            If you are a potential partner, investor, or institutional leader interested in what Talent3X is building, we would welcome the conversation.
          </p>
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <ContactForm />
          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

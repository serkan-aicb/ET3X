import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = {
  title: "Terms of Use — Talent3X",
  description: "Terms and conditions governing use of the Talent3X platform.",
};

export default function TermsOfUsePage() {
  return (
    <>
      <MarketingNav />

      <section className="pt-32 pb-8 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Legal</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Terms of Use</h1>
          <p className="text-slate-500">Last updated: May 2026</p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-6 space-y-10 text-slate-600">

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              Talent3X (available at talent3x.com) is operated by AI.COREBLOCK Ltd, a private limited company registered in England and Wales (Company No. 16356921), registered office at 128 City Road, London, EC1V 2NX, United Kingdom. By accessing or using the Talent3X platform, you agree to be bound by these Terms of Use. If you do not agree to these terms, you may not use the platform.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Description of Service</h2>
            <p className="leading-relaxed">
              Talent3X is a capability record platform that enables students to build verified profiles of their work and allows educators and institutions to evaluate and track graduate capability. The platform connects evaluations from courses, projects, and real-world placements into a continuous capability record.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. User Roles</h2>
            <p className="leading-relaxed mb-4">The platform supports three user roles:</p>
            <div className="space-y-3">
              {[
                { role: "Student", desc: "May submit work, view their capability profile, and share their profile externally." },
                { role: "Educator", desc: "May create tasks, review student submissions, provide evaluations, and view program-level data." },
                { role: "Administrator", desc: "May manage institutional settings, users, and platform configuration." },
              ].map((item) => (
                <div key={item.role} className="p-4 border border-slate-200 rounded-lg">
                  <p className="font-semibold text-slate-800 text-sm">{item.role}</p>
                  <p className="text-sm mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Account Responsibilities</h2>
            <ul className="space-y-2">
              {[
                "You are responsible for maintaining the confidentiality of your account credentials.",
                "You must provide accurate and truthful information when creating your account.",
                "You may not share your account with others or allow others to access the platform through your credentials.",
                "You are responsible for all activity that occurs under your account.",
              ].map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Acceptable Use</h2>
            <p className="leading-relaxed mb-4">You agree not to:</p>
            <ul className="space-y-2">
              {[
                "Submit work that is not your own without appropriate attribution",
                "Attempt to manipulate or falsify evaluations or capability records",
                "Access or attempt to access data belonging to other users",
                "Use the platform for any unlawful purpose",
                "Upload files containing malware, viruses, or other harmful code",
                "Reverse-engineer, scrape, or systematically extract data from the platform",
              ].map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Content and Submissions</h2>
            <p className="leading-relaxed mb-3">
              By uploading content to the platform, you confirm that you have the right to share that content. You retain ownership of your submitted work. You grant Talent3X a limited licence to store and process your submissions for the purpose of operating the service.
            </p>
            <p className="leading-relaxed">
              File uploads are limited to 3MB per file. Accepted file types are: PDF, Word (.doc/.docx), Excel (.xls/.xlsx/.csv), and PowerPoint (.ppt/.pptx).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Intellectual Property</h2>
            <p className="leading-relaxed">
              All platform software, design, and content (excluding user-submitted content) is the property of Talent3X and protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without express written permission.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Availability and Service Changes</h2>
            <p className="leading-relaxed">
              We aim to maintain platform availability but do not guarantee uninterrupted service. We reserve the right to modify, suspend, or discontinue any part of the service with reasonable notice where practicable.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the maximum extent permitted by applicable law, Talent3X shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the platform. Our total liability for direct damages shall not exceed the amount paid by you for the service in the twelve months preceding the claim.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Termination</h2>
            <p className="leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these Terms of Use. Users may request account deletion at any time by contacting us. Capability records may be retained in anonymised form for institutional reporting purposes after account deletion.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Governing Law</h2>
            <p className="leading-relaxed">
              These terms are governed by the laws of England and Wales. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the competent courts of England and Wales.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">12. Changes to Terms</h2>
            <p className="leading-relaxed">
              We may update these Terms of Use from time to time. Material changes will be communicated via email or in-platform notification. Continued use of the platform after changes take effect constitutes acceptance.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">13. Contact</h2>
            <p className="leading-relaxed">
              For questions about these terms:{" "}
              <a href="mailto:hello@talent3x.com" className="text-blue-600 hover:underline">hello@talent3x.com</a>
            </p>
          </div>

        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

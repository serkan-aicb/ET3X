import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = {
  title: "Privacy Policy — Talent3X",
  description: "How Talent3X collects, processes, and protects personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <MarketingNav />

      <section className="pt-32 pb-8 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Legal</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Privacy Policy</h1>
          <p className="text-slate-500">Last updated: May 2026</p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="prose prose-slate max-w-none space-y-10">

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">1. Controller</h2>
              <p className="text-slate-600 leading-relaxed">
                The data controller responsible for personal data processed through the Talent3X platform (talent3x.com and app.talent3x.com) is:
              </p>
              <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-sm">
                <p>Talent3X</p>
                <p>[Registered address — to be completed]</p>
                <p>Email: <a href="mailto:privacy@talent3x.com" className="text-blue-600 hover:underline">privacy@talent3x.com</a></p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">2. Data We Collect</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We collect and process the following categories of personal data:
              </p>
              <ul className="space-y-2 text-slate-600">
                {[
                  "Account information: name, email address, username, institutional role",
                  "Profile data: academic programme, year of study, matriculation number (optional)",
                  "Submission data: uploaded files, links, and notes submitted as part of task work",
                  "Evaluation data: skill ratings and evaluations created by educators",
                  "Usage data: login timestamps, page visits, and platform interactions",
                ].map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">3. Legal Basis for Processing (GDPR)</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We process personal data on the following legal bases under the EU General Data Protection Regulation (GDPR):
              </p>
              <div className="space-y-4">
                {[
                  { basis: "Contract performance (Art. 6(1)(b))", desc: "Processing necessary to provide the Talent3X platform and its core features to registered users." },
                  { basis: "Legitimate interests (Art. 6(1)(f))", desc: "Improving platform security, preventing fraud, and maintaining platform integrity." },
                  { basis: "Consent (Art. 6(1)(a))", desc: "Where explicitly requested — for example, optional profile sharing or communications." },
                  { basis: "Legal obligation (Art. 6(1)(c))", desc: "Where required by applicable law." },
                ].map((item) => (
                  <div key={item.basis} className="p-4 border border-slate-200 rounded-lg">
                    <p className="font-semibold text-slate-800 text-sm mb-1">{item.basis}</p>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">4. How We Use Your Data</h2>
              <ul className="space-y-2 text-slate-600">
                {[
                  "To provide and operate the Talent3X platform",
                  "To create and maintain user accounts and capability profiles",
                  "To enable educators to evaluate and rate student submissions",
                  "To generate institutional reporting and outcome summaries",
                  "To send transactional notifications (e.g. evaluation completed, task assigned)",
                  "To maintain platform security and prevent abuse",
                ].map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Retention</h2>
              <p className="text-slate-600 leading-relaxed">
                We retain personal data for as long as necessary to provide our services and comply with legal obligations. Account data is retained for the duration of the account. Capability records may be retained beyond account closure to support the portability of student profiles, unless deletion is explicitly requested.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">6. Data Sharing</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We do not sell personal data. We may share data with:
              </p>
              <ul className="space-y-2 text-slate-600">
                {[
                  "Supabase (database and authentication infrastructure) — operating within the EU",
                  "Pinata (IPFS storage for ratings data)",
                  "Your institution — if access has been provisioned through an institutional account",
                  "Legal authorities — if required by law",
                ].map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">7. Cookies</h2>
              <p className="text-slate-600 leading-relaxed">
                Talent3X uses session cookies for authentication and security purposes. No third-party tracking or advertising cookies are used. Session cookies are automatically deleted when you close your browser.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">8. Your Rights (GDPR)</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Under the GDPR, you have the following rights:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { right: "Right of access", desc: "Request a copy of your personal data." },
                  { right: "Right to rectification", desc: "Request correction of inaccurate data." },
                  { right: "Right to erasure", desc: "Request deletion of your personal data." },
                  { right: "Right to portability", desc: "Receive your data in a structured, machine-readable format." },
                  { right: "Right to object", desc: "Object to processing based on legitimate interests." },
                  { right: "Right to restrict", desc: "Request restricted processing of your data." },
                ].map((item) => (
                  <div key={item.right} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <p className="font-semibold text-slate-800">{item.right}</p>
                    <p className="text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-slate-600 text-sm mt-4">
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:privacy@talent3x.com" className="text-blue-600 hover:underline">privacy@talent3x.com</a>.
                You also have the right to lodge a complaint with your national data protection authority.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">9. Security</h2>
              <p className="text-slate-600 leading-relaxed">
                We implement appropriate technical and organisational measures to protect personal data against unauthorised access, loss, or disclosure. All data is transmitted over encrypted connections (HTTPS). Database access is protected by row-level security policies.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">10. Changes to This Policy</h2>
              <p className="text-slate-600 leading-relaxed">
                We may update this privacy policy from time to time. Where changes are material, we will notify users by email or through the platform. Continued use of Talent3X after changes take effect constitutes acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">11. Contact</h2>
              <p className="text-slate-600 leading-relaxed">
                For any questions about this privacy policy or your personal data, contact:{" "}
                <a href="mailto:privacy@talent3x.com" className="text-blue-600 hover:underline">privacy@talent3x.com</a>
              </p>
            </div>

          </div>
        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

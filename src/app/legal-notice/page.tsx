import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";

export const metadata = {
  title: "Legal Notice — Talent3X",
  description: "Legal notice and company information for Talent3X.",
};

export default function LegalNoticePage() {
  return (
    <>
      <MarketingNav />

      <section className="pt-32 pb-8 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-4">Legal</p>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Legal Notice</h1>
          <p className="text-slate-500">Company information and mandatory disclosures for Talent3X.</p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-6 space-y-10 text-slate-600">

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Operator</h2>
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed">
              <p className="font-semibold text-slate-900 mb-2">Talent3X</p>
              <p>
                Email:{" "}
                <a href="mailto:hello@talent3x.com" className="text-blue-600 hover:underline">
                  hello@talent3x.com
                </a>
              </p>
              <p>Website: talent3x.com</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Disclaimer of Liability</h2>
            <p className="leading-relaxed text-sm">
              The content of this website has been prepared with the utmost care. However, we cannot guarantee the accuracy, completeness, or timeliness of the content. The information on this website is provided for general informational purposes only and does not constitute legal, financial, or technical advice.
            </p>
            <p className="leading-relaxed text-sm mt-3">
              Our offering contains links to external third-party websites, over whose content we have no influence. We therefore cannot accept any liability for this external content. The respective provider or operator of the linked pages is always responsible for the content of those pages.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Intellectual Property</h2>
            <p className="leading-relaxed text-sm">
              All content on this website — including text, graphics, logos, icons, and code — is the property of Talent3X and is protected under applicable intellectual property laws. Reproduction or distribution of any material without prior written consent from Talent3X is strictly prohibited.
            </p>
          </div>

        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

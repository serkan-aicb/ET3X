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
          <p className="text-slate-500">Impressum / Mandatory Disclosure</p>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-6 space-y-10 text-slate-600">

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Operator</h2>
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed">
              <p className="font-semibold text-slate-900 mb-2">Talent3X</p>
              <p>[Registered company name — to be completed]</p>
              <p>[Street address]</p>
              <p>[Postal code, City, Country]</p>
              <p className="mt-3">
                Email:{" "}
                <a href="mailto:hello@talent3x.com" className="text-blue-600 hover:underline">
                  hello@talent3x.com
                </a>
              </p>
              <p>Website: talent3x.com</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Responsible for Content</h2>
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed">
              <p>[Name of responsible person — to be completed]</p>
              <p>[Title / Role]</p>
              <p>[Address as above or variation]</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Registration</h2>
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed">
              <p>Commercial register: [Registry and number — to be completed]</p>
              <p>VAT number: [VAT ID — to be completed]</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Supervisory Authority</h2>
            <p className="leading-relaxed text-sm">
              [If applicable — name and address of competent supervisory authority for the sector.]
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Dispute Resolution (EU)</h2>
            <p className="leading-relaxed text-sm">
              The European Commission provides an online dispute resolution platform for consumer disputes:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="leading-relaxed text-sm mt-3">
              We are not obliged to participate in dispute resolution proceedings before a consumer arbitration board and do not voluntarily participate.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Liability for Content</h2>
            <p className="leading-relaxed text-sm">
              The content of this website has been prepared with the utmost care. However, we cannot guarantee the accuracy, completeness, or timeliness of the content. As a service provider, we are responsible for our own content on these pages in accordance with applicable law. We are not obliged to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Liability for Links</h2>
            <p className="leading-relaxed text-sm">
              Our offering contains links to external third-party websites, over whose content we have no influence. We therefore cannot accept any liability for this external content. The respective provider or operator of the linked pages is always responsible for the content of those pages.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Copyright</h2>
            <p className="leading-relaxed text-sm">
              The content and works created by the site operators on these pages are subject to applicable copyright law. Duplication, processing, distribution, or any form of commercialisation of such material beyond the scope of the copyright law shall require the prior written consent of its respective author or creator. Downloads and copies of this site are only permitted for private, non-commercial use.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <p className="font-semibold mb-1">Note</p>
            <p>
              Sections marked with [to be completed] must be filled in with accurate company information before this page is published. Providing incorrect or incomplete legal notice information may violate applicable law in several jurisdictions.
            </p>
          </div>

        </div>
      </section>

      <MarketingFooter />
    </>
  );
}

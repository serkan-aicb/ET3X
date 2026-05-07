import Link from "next/link";
import Image from "next/image";

export function MarketingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Image
              src="/pics/logo-transparent.png"
              alt="Talent3X"
              width={120}
              height={40}
              className="h-8 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
              Making student capability visible, portable, and defensible across university courses, projects, and real-world work.
            </p>
          </div>

          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-widest mb-4">Platform</p>
            <ul className="space-y-2.5">
              <li><Link href="/students" className="hover:text-white transition-colors">For Students</Link></li>
              <li><Link href="/universities" className="hover:text-white transition-colors">For Universities</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/partners" className="hover:text-white transition-colors">Partners &amp; Investors</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-widest mb-4">Access</p>
            <ul className="space-y-2.5">
              <li>
                <a href="https://app.talent3x.com/login" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Login
                </a>
              </li>
              <li>
                <a href="https://app.talent3x.com/signup?role=student" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Student Signup
                </a>
              </li>
              <li>
                <Link href="/universities#request" className="hover:text-white transition-colors">
                  Institutional Access
                </Link>
              </li>
              <li>
                <a href="https://app.talent3x.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Open Platform
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-white text-xs font-semibold uppercase tracking-widest mb-4">Legal</p>
            <ul className="space-y-2.5">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-of-use" className="hover:text-white transition-colors">Terms of Use</Link></li>
              <li><Link href="/legal-notice" className="hover:text-white transition-colors">Legal Notice</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-slate-500">© {new Date().getFullYear()} Talent3X. All rights reserved.</p>
          <p className="text-slate-700 text-xs">Capability infrastructure for higher education</p>
        </div>
      </div>
    </footer>
  );
}

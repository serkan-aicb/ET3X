/**
 * Design Lab — vibrant direction exploration (throwaway preview)
 * Teal→Indigo "aurora" palette · Sora font · photo hero + mesh background · hover everywhere.
 * Not wired to the frozen tokens yet — this is a direction to react to.
 */

import {
  BadgeCheck,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  FileText,
  Share2,
  Download,
  ShieldCheck,
  Zap,
} from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80";

const capabilities = [
  { label: "Strategy Development", value: 4.6, tint: "from-[#0EA5E9] to-[#4F46E5]" },
  { label: "Communication", value: 4.5, tint: "from-[#2DD4BF] to-[#0EA5E9]" },
  { label: "Analytical Thinking", value: 4.2, tint: "from-[#6366F1] to-[#4F46E5]" },
  { label: "Implementation", value: 4.0, tint: "from-[#22D3EE] to-[#3B82F6]" },
];

const stats = [
  { label: "Evaluations", value: "12", icon: FileText, tint: "from-[#0EA5E9] to-[#4F46E5]" },
  { label: "Educators", value: "4", icon: ShieldCheck, tint: "from-[#2DD4BF] to-[#0EA5E9]" },
  { label: "Verified", value: "8", icon: BadgeCheck, tint: "from-[#10B981] to-[#059669]" },
  { label: "Avg score", value: "4.4", icon: Zap, tint: "from-[#6366F1] to-[#4F46E5]" },
];

const contributions = [
  { title: "Blockchain Strategic Implementation White Paper", org: "Quinnipiac University", score: 4.5 },
  { title: "Strategy Presentation & Defense", org: "Quinnipiac University", score: 4.4 },
  { title: "Market Analysis Project", org: "XYZ Capital Partners", score: 4.3 },
];

export default function DesignLab() {
  return (
    <div className="lab-root min-h-screen text-[#0F172A]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        .lab-root {
          font-family: 'Sora', ui-sans-serif, system-ui, sans-serif;
          background:
            radial-gradient(38rem 38rem at 10% 4%, rgba(45,212,191,0.22), transparent 60%),
            radial-gradient(44rem 44rem at 92% 6%, rgba(79,70,229,0.20), transparent 60%),
            radial-gradient(40rem 40rem at 78% 92%, rgba(14,165,233,0.18), transparent 60%),
            radial-gradient(36rem 36rem at 8% 88%, rgba(99,102,241,0.14), transparent 60%),
            #F5FBFF;
          background-attachment: fixed;
        }
        .glass { background: rgba(255,255,255,0.72); backdrop-filter: blur(12px); }
        .lab-card { transition: transform .3s cubic-bezier(.2,.7,.2,1), box-shadow .3s, border-color .3s; }
        .lab-card:hover { transform: translateY(-6px); box-shadow: 0 24px 48px -16px rgba(79,70,229,0.35); border-color: rgba(79,70,229,0.45); }
        .lab-btn { transition: transform .2s, box-shadow .3s, filter .2s; }
        .lab-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -10px rgba(79,70,229,0.55); filter: brightness(1.05); }
        .lab-row { transition: background .25s, transform .25s; border-radius: 12px; }
        .lab-row:hover { background: rgba(79,70,229,0.06); transform: translateX(4px); }
        .grad-text { background: linear-gradient(90deg,#0EA5E9,#4F46E5); -webkit-background-clip: text; background-clip: text; color: transparent; }
      `}</style>

      {/* Top bar */}
      <header className="glass sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/60 px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-[#2DD4BF] via-[#0EA5E9] to-[#4F46E5] text-sm font-bold text-white shadow-lg shadow-[#4F46E5]/30">
            X
          </div>
          <span className="text-[15px] font-bold tracking-tight">Talent3X</span>
          <span className="ml-1 text-sm font-medium text-[#6366F1]">Profile Studio</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="lab-btn inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#4F46E5]/20 bg-white/70 px-4 text-sm font-semibold text-[#4F46E5]">
            <Share2 className="size-4" /> Share
          </button>
          <button className="lab-btn inline-flex h-9 items-center gap-1.5 rounded-xl bg-linear-to-r from-[#0EA5E9] to-[#4F46E5] px-4 text-sm font-semibold text-white shadow-lg shadow-[#4F46E5]/30">
            <Download className="size-4" /> Export PDF
          </button>
        </div>
      </header>

      {/* Photo hero */}
      <section className="relative mx-auto mt-6 w-full max-w-[1180px] overflow-hidden rounded-3xl px-8">
        <div
          className="relative overflow-hidden rounded-3xl border border-white/60 p-8 shadow-xl"
          style={{
            backgroundImage: `linear-gradient(115deg, rgba(79,70,229,0.82), rgba(14,165,233,0.55) 55%, rgba(45,212,191,0.42)), url('${HERO_IMG}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex flex-wrap items-start gap-6 text-white">
            <div className="flex size-24 items-center justify-center rounded-3xl bg-white/15 text-3xl font-extrabold ring-4 ring-white/30 backdrop-blur">
              AP
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight">André Pager</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981] px-3 py-1 text-xs font-bold text-white shadow-lg shadow-[#10B981]/40">
                  <BadgeCheck className="size-4" /> Verified
                </span>
              </div>
              <p className="mt-1 text-lg font-medium text-white/90">Blockchain Strategy &amp; Implementation</p>
              <p className="text-sm text-white/70">Quinnipiac University · Student / Analyst</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
                <TrendingUp className="size-4" /> Strategy Development up 18% over the last 90 days
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1180px] px-8 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="lab-card glass rounded-2xl border border-white/70 p-5 shadow-sm"
              >
                <div className={`mb-3 flex size-11 items-center justify-center rounded-xl bg-linear-to-br ${s.tint} text-white shadow-lg`}>
                  <Icon className="size-5" />
                </div>
                <div className="text-3xl font-extrabold tracking-tight">{s.value}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#6366F1]">{s.label}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* Capabilities with gradient bars */}
          <div className="lab-card glass rounded-2xl border border-white/70 p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Sparkles className="size-5 text-[#4F46E5]" /> Top Verified Capabilities
              </h2>
              <button className="text-sm font-semibold text-[#0EA5E9] hover:underline">View all</button>
            </div>
            <div className="space-y-4">
              {capabilities.map((c) => (
                <div key={c.label} className="lab-row p-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold">{c.label}</span>
                    <span className="grad-text text-sm font-extrabold">{c.value.toFixed(1)}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E0E7FF]">
                    <div
                      className={`h-full rounded-full bg-linear-to-r ${c.tint}`}
                      style={{ width: `${(c.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contributions with hover cards */}
          <div className="lab-card glass rounded-2xl border border-white/70 p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold">Top Contributions</h2>
            <div className="space-y-3">
              {contributions.map((c) => (
                <article
                  key={c.title}
                  className="lab-card group cursor-pointer rounded-xl border border-white/70 bg-white/60 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#0EA5E9] to-[#4F46E5] text-white">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold leading-snug">{c.title}</h3>
                      <p className="text-xs text-[#6366F1]">{c.org}</p>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-[#94A3B8] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#4F46E5]" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="grad-text text-sm font-extrabold">{c.score.toFixed(1)} / 5</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2 py-0.5 text-xs font-bold text-[#059669]">
                      <BadgeCheck className="size-3" /> Verified
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Component showcase — buttons, badges, input */}
        <div className="mt-6 lab-card glass rounded-2xl border border-white/70 p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Components — hover me</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button className="lab-btn rounded-xl bg-linear-to-r from-[#0EA5E9] to-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#4F46E5]/30">
              Primary
            </button>
            <button className="lab-btn rounded-xl border-2 border-[#2DD4BF] bg-white/70 px-5 py-2.5 text-sm font-semibold text-[#0F766E]">
              Teal outline
            </button>
            <button className="lab-btn rounded-xl bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#10B981]/30">
              Verify
            </button>
            <span className="rounded-full bg-linear-to-r from-[#0EA5E9] to-[#4F46E5] px-3 py-1 text-xs font-bold text-white">Published</span>
            <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-bold text-[#4F46E5]">Pending</span>
            <input
              placeholder="Focus me…"
              className="h-10 rounded-xl border border-[#C7D2FE] bg-white/70 px-3 text-sm outline-none transition-all focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/15"
            />
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-[1180px] px-8 pb-10 pt-2">
        <div className="glass flex items-center justify-between rounded-2xl border border-white/70 px-6 py-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#334155]">
            <ShieldCheck className="size-4 text-[#10B981]" /> Evaluations are independently verifiable
          </span>
          <span className="text-sm font-medium text-[#6366F1]">talent3x.com · /p/andre-pager</span>
        </div>
      </footer>
    </div>
  );
}

import { useRef } from "react";
import { ArrowRight, Check, ChevronDown, Lock, Sparkles } from "lucide-react";
import { burstFrom } from "../lib/confetti";
import { Reveal } from "../lib/motion";

const ACTIVITY: { text: string; tag?: string; tone?: "emerald" | "amber" }[] = [
  { text: "Atlas Co. approved “Homepage v2”", tag: "Approved", tone: "emerald" },
  { text: "Round-trip feedback on “App onboarding”: 4h 12m" },
  { text: "Scope locked on “Brand guidelines”", tag: "Locked", tone: "amber" },
  { text: "Nimbus onboarded — 6 deliverables shared" },
  { text: "Invoice #204 auto-sent on approval", tag: "Sent", tone: "emerald" },
  { text: "Two revisions requested on “Packaging concepts”" },
  { text: "Brew & Co. signed off — project 100% complete", tag: "Complete", tone: "emerald" },
];

function ActivityItem({ text, tag, tone }: (typeof ACTIVITY)[number]) {
  return (
    <span className="mr-10 flex shrink-0 items-center gap-3 whitespace-nowrap text-sm text-slate-400">
      <svg className="h-2 w-2 shrink-0 text-quest" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
        <path d="M4 0L8 4L4 8L0 4Z" />
      </svg>
      {text}
      {tag && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            tone === "amber" ? "bg-amber-400/10 text-[#F59E0B]" : "bg-emerald-400/10 text-[#10B981]"
          }`}
        >
          {tag}
        </span>
      )}
    </span>
  );
}

export default function Hero({ onEnter }: { onEnter: () => void }) {
  const ctaRef = useRef<HTMLButtonElement>(null);

  const handleCta = () => {
    if (ctaRef.current) burstFrom(ctaRef.current);
    window.setTimeout(onEnter, 700);
  };

  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-purple-900 via-slate-900 to-black">
      {/* ambient layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-dots absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_32%,black,transparent)]" />
        <div className="absolute -top-40 left-1/2 h-[480px] w-[760px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />
        <div className="absolute bottom-10 right-[6%] h-72 w-72 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute left-[4%] top-1/2 h-56 w-56 rounded-full bg-quest/10 blur-[100px]" />
      </div>

      {/* floating approval cards */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        <div className="animate-float-slow absolute left-[57%] top-36 xl:left-[61%]">
          <div className="w-64 -rotate-3 rounded-2xl border border-slate-700/70 bg-slate-900/85 p-4 shadow-2xl shadow-black/50 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-[#10B981]">
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">Homepage v2</p>
                <p className="text-xs text-slate-500">Approved by Atlas Co.</p>
              </div>
              <span className="ml-auto rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-bold text-[#10B981]">
                Approved
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-[#10B981] to-emerald-400" />
            </div>
          </div>
        </div>

        <div className="animate-float absolute right-[3%] top-[47%] xl:right-[5%]">
          <div className="w-60 rotate-3 rounded-2xl border border-quest/30 bg-slate-900/85 p-4 shadow-2xl shadow-black/50 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-quest/15 text-violet-300">
                <Lock className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Scope locked</p>
                <p className="text-xs text-slate-500">Nimbus · Round 2 signed</p>
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-violet-300/80">Sign-off logged · v2 final</p>
          </div>
        </div>

        <div className="animate-float-slower absolute bottom-28 left-[62%]">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200 shadow-lg shadow-emerald-500/15">
            <Sparkles className="h-3.5 w-3.5" /> Signed off in 4h
          </span>
        </div>
      </div>

      {/* main copy — anchored left, not a centered trio */}
      <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-32 sm:px-8 sm:pt-40 lg:pb-28">
        <div className="max-w-3xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-4 py-1.5 text-sm font-medium text-violet-200 shadow-[0_0_28px_rgba(139,92,246,0.18)]">
              <Sparkles className="h-4 w-4 text-violet-300" />
              The modern client approval portal
            </span>
          </Reveal>

          <Reveal delay={110}>
            <h1 className="mt-7 font-display text-[clamp(1.85rem,5.2vw,3.55rem)] font-bold leading-[1.14] tracking-tight text-white">
              Turn client deliverables into{" "}
              <span className="relative inline-block text-[#10B981]">
                seamless
                <svg
                  className="absolute -bottom-1.5 left-0 h-2.5 w-full"
                  viewBox="0 0 140 10"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M3 7 Q 35 2 70 6 T 137 5"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                </svg>
              </span>{" "}
              <span className="text-[#F59E0B]">approvals</span>.
            </h1>
          </Reveal>

          <Reveal delay={220}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-400">
              ClientQuest gives freelancers and agencies a premium workspace to share work, collect definitive
              feedback, and eliminate approval bottlenecks.
            </p>
          </Reveal>

          <Reveal delay={330}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                ref={ctaRef}
                onClick={handleCta}
                className="group relative inline-flex items-center gap-2.5 rounded-full bg-[#8B5CF6] px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-violet-600/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-violet-400 hover:shadow-2xl hover:shadow-violet-500/45 active:translate-y-0 active:scale-95"
              >
                Start your first project
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <a
                href="#demo"
                className="group inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-base font-medium text-slate-300 transition-all duration-300 hover:border-slate-500 hover:bg-slate-800/60 hover:text-white"
              >
                See the board in action
                <ChevronDown className="h-4 w-4 text-slate-500 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:text-white" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={430}>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#10B981]" strokeWidth={3} /> Free for your first 5 projects
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-[#10B981]" strokeWidth={3} /> No credit card required
              </span>
            </div>
          </Reveal>
        </div>
      </div>

      {/* live activity ticker */}
      <div className="relative border-t border-slate-800/80 bg-slate-950/70 backdrop-blur">
        <div className="flex items-center">
          <div className="z-10 flex shrink-0 items-center gap-2.5 border-r border-slate-800/80 bg-slate-950 px-5 py-4">
            <span className="animate-pulse-ring relative flex h-2 w-2 rounded-full bg-[#10B981]" />
            <span className="text-xs font-bold tracking-[0.22em] text-[#10B981]">LIVE</span>
          </div>
          <div className="marquee-paused relative flex-1 overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
            <div className="animate-marquee flex w-max">
              {[...ACTIVITY, ...ACTIVITY].map((item, i) => (
                <ActivityItem key={i} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

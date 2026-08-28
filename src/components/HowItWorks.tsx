import { ScrollText, ShieldCheck, Swords, Trophy, type LucideIcon } from "lucide-react";
import { CountUp, Reveal } from "../lib/motion";

const STEPS: { icon: LucideIcon; title: string; desc: string; accent: string }[] = [
  {
    icon: ScrollText,
    title: "Post a quest",
    desc: "Scope the deliverable, attach the files, set its XP bounty. It lands in Brief, ready to run.",
    accent: "text-violet-300 border-quest/40",
  },
  {
    icon: Swords,
    title: "Play it live",
    desc: "Work moves across the board while clients watch progress update in real time. No status meetings needed.",
    accent: "text-sky-300 border-sky-500/40",
  },
  {
    icon: ShieldCheck,
    title: "One-click approval",
    desc: "Clients review, leave notes, and sign off on the quest itself. Every decision is logged automatically.",
    accent: "text-[#10B981] border-emerald-500/40",
  },
  {
    icon: Trophy,
    title: "Collect the XP",
    desc: "Sign-off drops XP, fills the bar, and levels the whole project up. Then the next quest begins.",
    accent: "text-[#F59E0B] border-amber-500/40",
  },
];

const STATS: { value: number; decimals?: number; suffix: string; suffixColor: string; label: string }[] = [
  { value: 12400, suffix: "+", suffixColor: "text-quest", label: "quests shipped to date" },
  { value: 3.4, decimals: 1, suffix: "×", suffixColor: "text-[#F59E0B]", label: "faster client approvals" },
  { value: 98, suffix: "%", suffixColor: "text-[#10B981]", label: "on-time deliveries" },
  { value: 26, suffix: "", suffixColor: "text-sky-400", label: "avg. client level reached" },
];

/* Responsive divider borders: 1-col → 2-col (sm) → 4-col (lg) */
const STAT_BORDERS = [
  "",
  "border-t sm:border-t-0 sm:border-l",
  "border-t lg:border-t-0 lg:border-l",
  "border-t sm:border-l lg:border-t-0",
];

export default function HowItWorks() {
  return (
    <section id="loop" className="relative py-24 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-emerald-500/[0.05] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.28em] text-[#F59E0B]">THE LOOP</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Four moves. <span className="text-slate-500">Zero chasing.</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-400">
            The same loop every quest runs — simple enough for clients to learn in one call, addictive enough that
            they keep coming back.
          </p>
        </Reveal>

        {/* steps with dashed connector */}
        <div className="relative mt-16">
          <div
            aria-hidden
            className="absolute left-[12%] right-[12%] top-5 hidden border-t-2 border-dashed border-slate-800 lg:block"
          />
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 130}>
                <div className="group relative">
                  <div className="relative z-10 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-slate-700 bg-slate-950 font-display text-xs font-bold text-slate-400 transition-all duration-300 group-hover:border-quest group-hover:text-quest">
                      0{i + 1}
                    </span>
                    <span
                      className={`grid h-10 w-10 place-items-center rounded-full border bg-slate-950 transition-transform duration-300 group-hover:scale-110 ${step.accent}`}
                    >
                      <step.icon className="h-[18px] w-[18px]" />
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-base font-bold text-white">{step.title}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-slate-400">{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* stats band */}
        <Reveal delay={150}>
          <div className="mt-20 grid rounded-2xl border border-slate-800 bg-slate-900/50 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`group border-slate-800 p-7 transition-colors duration-300 hover:bg-slate-800/40 ${STAT_BORDERS[i]}`}
              >
                <p className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  <CountUp to={s.value} decimals={s.decimals ?? 0} />
                  <span className={s.suffixColor}>{s.suffix}</span>
                </p>
                <p className="mt-2 text-sm text-slate-500 transition-colors duration-300 group-hover:text-slate-400">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

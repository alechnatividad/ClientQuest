import type { ReactNode } from "react";
import { Clock, Check, LayoutDashboard, Shield, Trophy, type LucideIcon } from "lucide-react";
import { Reveal } from "../lib/motion";

function KanbanSketch() {
  const cols = [
    ["bg-slate-600", "bg-slate-700"],
    ["bg-violet-500/70", "bg-slate-700", "bg-slate-600"],
    ["bg-amber-500/70"],
    ["bg-emerald-500/70", "bg-slate-700"],
  ];
  return (
    <div className="flex h-16 items-end gap-1.5">
      {cols.map((bars, i) => (
        <div key={i} className="flex flex-1 flex-col justify-end gap-1.5 rounded-md bg-slate-900/80 p-1.5">
          {bars.map((b, j) => (
            <span
              key={j}
              className={`${b} block h-2 rounded-sm transition-transform duration-300 group-hover:-translate-y-0.5`}
              style={{ transitionDelay: `${(i * 3 + j) * 45}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function XpSketch() {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="text-slate-500">Studio level</span>
        <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[#F59E0B]">LV 7</span>
      </div>
      <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-slate-900/90">
        <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#10B981] to-[#F59E0B]" />
        <span className="animate-shimmer absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        360 / 500 XP · <span className="text-[#10B981]">2 quests to level up</span>
      </p>
    </div>
  );
}

function ApprovalSketch() {
  const rows = [
    { icon: <Check className="h-3 w-3 text-[#10B981]" strokeWidth={3} />, w: "w-3/4", done: true },
    { icon: <Check className="h-3 w-3 text-[#10B981]" strokeWidth={3} />, w: "w-2/3", done: true },
    { icon: <Clock className="h-3 w-3 text-[#F59E0B]" />, w: "w-1/2", done: false },
  ];
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div
          key={i}
          className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors duration-300 ${
            r.done
              ? "border-emerald-500/20 bg-emerald-500/[0.05]"
              : "border-amber-400/20 bg-amber-400/[0.05]"
          }`}
        >
          <span
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
              r.done ? "bg-emerald-500/15" : "bg-amber-400/15"
            }`}
          >
            {r.icon}
          </span>
          <span className={`h-1.5 rounded-full ${r.w} ${r.done ? "bg-slate-600" : "bg-slate-700"}`} />
          <span
            className={`ml-auto text-[10px] font-bold ${r.done ? "text-[#10B981]" : "text-[#F59E0B]"}`}
          >
            {r.done ? "SIGNED" : "REVIEW"}
          </span>
        </div>
      ))}
    </div>
  );
}

type Card = { icon: LucideIcon; title: string; desc: string; sketch: ReactNode };

const CARDS: Card[] = [
  {
    icon: LayoutDashboard,
    title: "Quest board",
    desc: "Every deliverable is a quest card gliding across four columns — Brief, In Progress, Review, Shipped — so clients always know exactly where things stand, without emailing you.",
    sketch: <KanbanSketch />,
  },
  {
    icon: Trophy,
    title: "XP progress",
    desc: "Approvals, milestones, and shipped quests all feed a shared XP bar. Clients watch their level climb in real time, and six-week projects stop feeling endless.",
    sketch: <XpSketch />,
  },
  {
    icon: Shield,
    title: "Clean approvals",
    desc: "One-click sign-offs, threaded notes, and an audit trail that logs itself. Feedback lives on the quest itself — no more archaeology through email chains.",
    sketch: <ApprovalSketch />,
  },
];

export default function FeatureCards() {
  return (
    <section id="features" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.28em] text-quest">WHY IT WORKS</p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built like a game. <span className="text-slate-500">Run like a studio.</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-400">
            Three mechanics borrowed from the games your clients already love — wired straight into your delivery
            workflow.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 120}>
              <div className="group h-full rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-quest/60 hover:bg-slate-800/70 hover:shadow-2xl hover:shadow-quest/10">
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 transition-all duration-300 group-hover:scale-110 group-hover:border-emerald-400/50 group-hover:bg-emerald-500/15 group-hover:shadow-lg group-hover:shadow-emerald-500/20">
                  <card.icon className="h-6 w-6 text-[#10B981]" />
                </div>
                <h3 className="font-display text-lg font-bold text-white">{card.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{card.desc}</p>
                <div className="mt-6 rounded-xl border border-slate-700/40 bg-slate-950/50 p-3.5">{card.sketch}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

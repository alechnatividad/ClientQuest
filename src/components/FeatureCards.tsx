import type { ReactNode } from "react";
import { BarChart3, Check, CheckCircle2, Clock, Layout, type LucideIcon } from "lucide-react";
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

function ProgressSketch() {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="truncate text-slate-500">Website relaunch · Atlas Co.</span>
        <span className="ml-2 shrink-0 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[#10B981]">68%</span>
      </div>
      <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-slate-900/90">
        <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#10B981] to-emerald-400" />
        <span className="animate-shimmer absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        5 of 8 deliverables approved · <span className="text-[#10B981]">on schedule</span>
      </p>
    </div>
  );
}

function ApprovalSketch() {
  const rows = [
    { icon: <Check className="h-3 w-3 text-[#10B981]" strokeWidth={3} />, w: "w-3/4", done: true, label: "APPROVED" },
    { icon: <Check className="h-3 w-3 text-[#10B981]" strokeWidth={3} />, w: "w-2/3", done: true, label: "APPROVED" },
    { icon: <Clock className="h-3 w-3 text-[#F59E0B]" />, w: "w-1/2", done: false, label: "IN REVIEW" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div
          key={i}
          className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors duration-300 ${
            r.done ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-amber-400/20 bg-amber-400/[0.05]"
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
          <span className={`ml-auto text-[10px] font-bold ${r.done ? "text-[#10B981]" : "text-[#F59E0B]"}`}>
            {r.label}
          </span>
        </div>
      ))}
      <div className="mt-0.5 flex items-center gap-2">
        <span className="rounded-lg bg-[#10B981] px-2.5 py-1 text-[10px] font-bold text-slate-950 shadow-sm shadow-emerald-500/30 transition-transform duration-300 group-hover:scale-105">
          Approve
        </span>
        <span className="rounded-lg border border-slate-700 px-2.5 py-1 text-[10px] font-bold text-slate-400 transition-colors duration-300 group-hover:border-slate-600">
          Request revisions
        </span>
      </div>
    </div>
  );
}

type Card = { icon: LucideIcon; title: string; desc: string; sketch: ReactNode };

const CARDS: Card[] = [
  {
    icon: Layout,
    title: "Visual Kanban Board",
    desc: "Four columns from Draft to Approved keep every deliverable and its status instantly visible.",
    sketch: <KanbanSketch />,
  },
  {
    icon: BarChart3,
    title: "Live Progress Tracking",
    desc: "A dynamic progress bar shows clients exactly where the project stands, eliminating status update emails.",
    sketch: <ProgressSketch />,
  },
  {
    icon: CheckCircle2,
    title: "One-Click Approvals",
    desc: "Clients review files and click a single button to approve or request revisions, locking in the scope.",
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
            A premium workspace, <span className="text-slate-500">engineered for sign-off.</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-400">
            Three essentials that turn scattered feedback into decisive approvals — wired straight into your
            delivery workflow.
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

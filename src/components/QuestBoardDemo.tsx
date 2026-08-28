import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Check,
  CheckCircle2,
  ChevronsRight,
  Eye,
  FileText,
  Megaphone,
  Palette,
  PenTool,
  Presentation,
  RotateCcw,
  Smartphone,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cannons, prefersReducedMotion, smallBurstAt } from "../lib/confetti";
import { Reveal } from "../lib/motion";

type Stage = 0 | 1 | 2 | 3;

interface Deliverable {
  id: number;
  title: string;
  client: string;
  meta: string;
  icon: LucideIcon;
  tint: string;
  stage: Stage;
}

const INITIAL_ITEMS: Deliverable[] = [
  { id: 1, title: "Homepage redesign", client: "Atlas Co.", meta: "3 files · v2", icon: PenTool, tint: "bg-violet-500/15 text-violet-300", stage: 2 },
  { id: 2, title: "Q3 impact report", client: "Nimbus", meta: "1 file · v1", icon: TrendingUp, tint: "bg-sky-500/15 text-sky-300", stage: 1 },
  { id: 3, title: "App onboarding flow", client: "Loop Health", meta: "6 screens · v3", icon: Smartphone, tint: "bg-emerald-500/15 text-emerald-300", stage: 0 },
  { id: 4, title: "Packaging concepts", client: "Brew & Co.", meta: "4 concepts · v1", icon: Palette, tint: "bg-amber-500/15 text-amber-300", stage: 0 },
  { id: 5, title: "Launch email sequence", client: "Nimbus", meta: "5 emails · v2", icon: Megaphone, tint: "bg-rose-500/15 text-rose-300", stage: 1 },
  { id: 6, title: "Pitch deck polish", client: "Orbit Labs", meta: "18 slides · v4", icon: Presentation, tint: "bg-violet-500/15 text-violet-300", stage: 2 },
  { id: 7, title: "Brand guidelines v2", client: "Atlas Co.", meta: "PDF · final", icon: FileText, tint: "bg-emerald-500/15 text-emerald-300", stage: 3 },
];

const COLUMNS: { name: string; dot: string; icon: LucideIcon }[] = [
  { name: "Draft", dot: "bg-slate-500", icon: FileText },
  { name: "In Progress", dot: "bg-violet-400", icon: PenTool },
  { name: "In Review", dot: "bg-amber-400", icon: Eye },
  { name: "Approved", dot: "bg-emerald-400", icon: CheckCircle2 },
];

/* How far each stage counts toward overall project progress */
const WEIGHTS = [0, 35, 70, 100];

const progressOf = (items: Deliverable[]) =>
  Math.round(items.reduce((sum, it) => sum + WEIGHTS[it.stage], 0) / items.length);

interface Float {
  id: number;
  amt: number;
  left: number;
}
interface Toast {
  id: number;
  kind: "approved" | "complete";
  title: string;
  sub: string;
}

export default function QuestBoardDemo() {
  const [items, setItems] = useState<Deliverable[]>(INITIAL_ITEMS);
  const [progress, setProgress] = useState(() => progressOf(INITIAL_ITEMS));
  const [shownPct, setShownPct] = useState(() => progressOf(INITIAL_ITEMS));
  const [floats, setFloats] = useState<Float[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const shownRef = useRef(progressOf(INITIAL_ITEMS));
  const toastTimer = useRef<number | undefined>(undefined);

  const approvedCount = items.filter((it) => it.stage === 3).length;

  /* Animate the displayed percentage toward the real value */
  useEffect(() => {
    if (prefersReducedMotion()) {
      shownRef.current = progress;
      setShownPct(progress);
      return;
    }
    const from = shownRef.current;
    const to = progress;
    if (from === to) return;
    const t0 = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (to - from) * eased);
      shownRef.current = v;
      setShownPct(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  const showToast = (t: Omit<Toast, "id">) => {
    window.clearTimeout(toastTimer.current);
    setToast({ ...t, id: Date.now() });
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const advance = (item: Deliverable, e: MouseEvent<HTMLButtonElement>) => {
    if (item.stage >= 3) return;
    const next = (item.stage + 1) as Stage;
    const nextItems = items.map((it) => (it.id === item.id ? { ...it, stage: next } : it));
    const newProgress = progressOf(nextItems);
    const delta = newProgress - progress;

    setItems(nextItems);
    setProgress(newProgress);

    if (delta > 0) {
      setFloats((prev) => [
        ...prev.slice(-4),
        { id: Date.now() + Math.random(), amt: delta, left: 15 + Math.random() * 60 },
      ]);
      window.setTimeout(() => {
        setFloats((prev) => prev.slice(1));
      }, 1200);
    }

    if (next === 3) {
      const r = e.currentTarget.getBoundingClientRect();
      smallBurstAt((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2) / window.innerHeight);
      showToast({ kind: "approved", title: "Deliverable approved", sub: `“${item.title}” — scope locked for ${item.client}` });
    }

    if (newProgress === 100) {
      window.setTimeout(() => {
        cannons();
        showToast({ kind: "complete", title: "Project complete", sub: "Every deliverable approved — beautifully done." });
      }, 380);
    }
  };

  const reset = () => {
    setItems(INITIAL_ITEMS);
    setProgress(progressOf(INITIAL_ITEMS));
    setFloats([]);
    setToast(null);
    showToast({ kind: "approved", title: "Board reset", sub: "A fresh project awaits — get it approved." });
  };

  return (
    <section id="demo" className="relative py-24 sm:py-28">
      {/* ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-16 h-72 w-[560px] -translate-x-1/2 rounded-full bg-quest/[0.07] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.28em] text-[#10B981]">LIVE DEMO</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Go ahead — <span className="text-[#F59E0B]">get something approved.</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-400">
              This is a live mini-board. Click any deliverable to move it one column forward and watch project
              progress update in real time — just like your clients will.
            </p>
          </div>
          <button
            onClick={reset}
            className="group inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-5 py-2.5 text-sm font-medium text-slate-300 transition-all duration-300 hover:border-quest hover:text-white"
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" />
            Reset demo
          </button>
        </Reveal>

        {/* progress HUD */}
        <Reveal delay={120}>
          <div className="relative mt-10 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 sm:p-6">
            {toast && (
              <div
                key={toast.id}
                className={`animate-pop absolute -top-5 right-5 z-20 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur ${
                  toast.kind === "complete"
                    ? "border-[#F59E0B]/50 bg-slate-900/95"
                    : "border-emerald-500/40 bg-slate-900/95"
                }`}
                role="status"
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg ${
                    toast.kind === "complete"
                      ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                      : "bg-emerald-500/15 text-[#10B981]"
                  }`}
                >
                  {toast.kind === "complete" ? (
                    <Sparkles className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{toast.title}</span>
                  <span className="block text-xs text-slate-400">{toast.sub}</span>
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-5">
              {/* percent tile */}
              <div
                key={progress}
                className="animate-pop grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] shadow-lg shadow-emerald-500/25"
              >
                <div className="text-center leading-none">
                  <p className="font-display text-lg font-bold text-white">{Math.round(shownPct)}%</p>
                  <p className="mt-1 text-[9px] font-bold tracking-[0.2em] text-emerald-100">DONE</p>
                </div>
              </div>

              {/* bar */}
              <div className="min-w-[240px] flex-1">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm font-semibold text-white">
                    Nightowl Studio <span className="font-normal text-slate-500">· client: Atlas Co.</span>
                  </p>
                  <p className="font-display text-sm font-bold text-[#10B981]">{Math.round(shownPct)}% complete</p>
                </div>
                <div className="relative mt-2.5">
                  {/* floating +percent labels */}
                  {floats.map((f) => (
                    <span
                      key={f.id}
                      style={{ left: `${f.left}%` }}
                      className="animate-rise pointer-events-none absolute -top-7 z-10 font-display text-sm font-bold text-[#10B981]"
                    >
                      +{f.amt}%
                    </span>
                  ))}
                  <div className="h-3.5 overflow-hidden rounded-full bg-slate-800 ring-1 ring-inset ring-slate-700/60">
                    <div
                      className="relative h-full rounded-full bg-gradient-to-r from-[#10B981] to-[#F59E0B] transition-[width] duration-700 ease-out"
                      style={{ width: `${Math.max(progress, 2)}%` }}
                    >
                      <span className="animate-shimmer absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#10B981]">{approvedCount} of {items.length}</span>{" "}
                  deliverables approved · on schedule
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* board */}
        <Reveal delay={220}>
          <div className="mt-5 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {COLUMNS.map((col, ci) => {
                const inCol = items.filter((it) => it.stage === ci);
                return (
                  <div key={col.name} className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <div className="mb-3 flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                        <span className="text-sm font-semibold text-slate-200">{col.name}</span>
                      </div>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                        {inCol.length}
                      </span>
                    </div>

                    <div className="flex min-h-[130px] flex-col gap-2.5">
                      {inCol.map((q) => {
                        const approved = q.stage === 3;
                        return (
                          <button
                            key={`${q.id}-${q.stage}`}
                            onClick={(e) => advance(q, e)}
                            disabled={approved}
                            className={`animate-pop group/card w-full rounded-xl border p-3 text-left transition-all duration-300 ${
                              approved
                                ? "cursor-default border-emerald-500/30 bg-emerald-500/[0.06]"
                                : "cursor-pointer border-slate-700/60 bg-slate-800/70 hover:-translate-y-0.5 hover:border-quest/60 hover:shadow-lg hover:shadow-quest/10"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${q.tint}`}>
                                <q.icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-white">{q.title}</span>
                                <span className="mt-0.5 block text-xs text-slate-500">{q.client}</span>
                              </span>
                            </div>
                            <div className="mt-2.5 flex items-center justify-between">
                              <span className="rounded-full bg-slate-700/40 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                                {q.meta}
                              </span>
                              {approved ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
                                  <Check className="h-3 w-3" strokeWidth={3} /> Approved
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
                                  Advance
                                  <ChevronsRight className="h-3.5 w-3.5 text-quest" />
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {inCol.length === 0 && (
                        <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-slate-800 py-6 text-xs text-slate-600">
                          Nothing here — yet
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={300}>
          <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
            <Sparkles className="h-4 w-4 text-quest" />
            Tip: approve every deliverable to complete the project — the confetti is on us.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

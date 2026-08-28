import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  Check,
  ChevronsRight,
  Eye,
  FileText,
  Flag,
  Megaphone,
  Palette,
  PenTool,
  Presentation,
  RotateCcw,
  Smartphone,
  Sparkles,
  Swords,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { prefersReducedMotion, smallBurstAt } from "../lib/confetti";
import { Reveal } from "../lib/motion";

type Stage = 0 | 1 | 2 | 3;

interface Quest {
  id: number;
  title: string;
  client: string;
  xp: number;
  icon: LucideIcon;
  tint: string;
  stage: Stage;
}

const INITIAL_QUESTS: Quest[] = [
  { id: 1, title: "Homepage redesign", client: "Atlas Co.", xp: 250, icon: PenTool, tint: "bg-violet-500/15 text-violet-300", stage: 2 },
  { id: 2, title: "Q3 impact report", client: "Nimbus", xp: 300, icon: TrendingUp, tint: "bg-sky-500/15 text-sky-300", stage: 1 },
  { id: 3, title: "App onboarding flow", client: "Loop Health", xp: 400, icon: Smartphone, tint: "bg-emerald-500/15 text-emerald-300", stage: 0 },
  { id: 4, title: "Packaging concepts", client: "Brew & Co.", xp: 200, icon: Palette, tint: "bg-amber-500/15 text-amber-300", stage: 0 },
  { id: 5, title: "Launch email sequence", client: "Nimbus", xp: 180, icon: Megaphone, tint: "bg-rose-500/15 text-rose-300", stage: 1 },
  { id: 6, title: "Pitch deck polish", client: "Orbit Labs", xp: 220, icon: Presentation, tint: "bg-violet-500/15 text-violet-300", stage: 2 },
  { id: 7, title: "Brand guidelines v2", client: "Atlas Co.", xp: 260, icon: FileText, tint: "bg-emerald-500/15 text-emerald-300", stage: 3 },
];

const COLUMNS: { name: string; dot: string; icon: LucideIcon }[] = [
  { name: "Brief", dot: "bg-slate-500", icon: FileText },
  { name: "In Progress", dot: "bg-violet-400", icon: Swords },
  { name: "Review", dot: "bg-amber-400", icon: Eye },
  { name: "Shipped", dot: "bg-emerald-400", icon: Flag },
];

const BASE_LEVEL = 6;
const THRESHOLD = 500;

interface Float {
  id: number;
  amt: number;
  left: number;
}
interface Toast {
  id: number;
  kind: "ship" | "level";
  title: string;
  sub: string;
}

export default function QuestBoardDemo() {
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [total, setTotal] = useState(0);
  const [shownXp, setShownXp] = useState(0);
  const [floats, setFloats] = useState<Float[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const shownRef = useRef(0);
  const toastTimer = useRef<number | undefined>(undefined);

  const level = BASE_LEVEL + Math.floor(total / THRESHOLD);
  const intoLevel = total % THRESHOLD;
  const progress = (intoLevel / THRESHOLD) * 100;
  const toNext = THRESHOLD - intoLevel;

  /* Animate the displayed XP toward the real total */
  useEffect(() => {
    if (prefersReducedMotion()) {
      shownRef.current = total;
      setShownXp(total);
      return;
    }
    const from = shownRef.current;
    const to = total;
    if (from === to) return;
    const t0 = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (to - from) * eased);
      shownRef.current = v;
      setShownXp(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  const showToast = (t: Omit<Toast, "id">) => {
    window.clearTimeout(toastTimer.current);
    setToast({ ...t, id: Date.now() });
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  };

  const advance = (quest: Quest, e: MouseEvent<HTMLButtonElement>) => {
    if (quest.stage >= 3) return;
    const next = (quest.stage + 1) as Stage;
    const chunk = Math.round(quest.xp / 3);
    const gained = next === 3 ? quest.xp - chunk * 2 : chunk;

    setQuests((prev) => prev.map((q) => (q.id === quest.id ? { ...q, stage: next } : q)));
    const prevTotal = total;
    const newTotal = total + gained;
    setTotal(newTotal);

    setFloats((prev) => [
      ...prev.slice(-4),
      { id: Date.now() + Math.random(), amt: gained, left: 15 + Math.random() * 60 },
    ]);
    window.setTimeout(() => {
      setFloats((prev) => prev.slice(1));
    }, 1200);

    if (next === 3) {
      const r = e.currentTarget.getBoundingClientRect();
      smallBurstAt((r.left + r.width / 2) / window.innerWidth, (r.top + r.height / 2) / window.innerHeight);
      showToast({ kind: "ship", title: "Quest shipped!", sub: `“${quest.title}” paid out +${gained} XP` });
    }

    const leveledUp =
      BASE_LEVEL + Math.floor(newTotal / THRESHOLD) > BASE_LEVEL + Math.floor(prevTotal / THRESHOLD);
    if (leveledUp) {
      const newLevel = BASE_LEVEL + Math.floor(newTotal / THRESHOLD);
      window.setTimeout(() => {
        smallBurstAt(0.5, 0.4);
        showToast({ kind: "level", title: `Level up! → Level ${newLevel}`, sub: "Your client just felt that." });
      }, 350);
    }
  };

  const reset = () => {
    setQuests(INITIAL_QUESTS);
    setTotal(0);
    setFloats([]);
    setToast(null);
    showToast({ kind: "ship", title: "Board reset", sub: "A fresh sprint awaits. Ship something!" });
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
              Go ahead — <span className="text-[#F59E0B]">ship something.</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-400">
              This is a real mini-board. Click any quest card to push it one column forward and watch the XP bar
              fill. Shipping pays the full bounty.
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

        {/* XP HUD */}
        <Reveal delay={120}>
          <div className="relative mt-10 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 sm:p-6">
            {toast && (
              <div
                key={toast.id}
                className={`animate-pop absolute -top-5 right-5 z-20 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur ${
                  toast.kind === "level"
                    ? "border-quest/50 bg-slate-900/95"
                    : "border-emerald-500/40 bg-slate-900/95"
                }`}
                role="status"
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg ${
                    toast.kind === "level" ? "bg-quest/20 text-violet-300" : "bg-emerald-500/15 text-[#10B981]"
                  }`}
                >
                  {toast.kind === "level" ? <Trophy className="h-4 w-4" /> : <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{toast.title}</span>
                  <span className="block text-xs text-slate-400">{toast.sub}</span>
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-5">
              {/* level tile */}
              <div
                key={level}
                className="animate-pop grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] shadow-lg shadow-quest/30"
              >
                <div className="text-center leading-none">
                  <p className="text-[9px] font-bold tracking-[0.2em] text-violet-200">LVL</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">{level}</p>
                </div>
              </div>

              {/* bar */}
              <div className="min-w-[240px] flex-1">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm font-semibold text-white">
                    Nightowl Studio <span className="font-normal text-slate-500">· client: Atlas Co.</span>
                  </p>
                  <p className="font-display text-sm font-bold text-[#F59E0B]">
                    {shownXp.toLocaleString("en-US")} XP
                  </p>
                </div>
                <div className="relative mt-2.5">
                  {/* floating +XP labels */}
                  {floats.map((f) => (
                    <span
                      key={f.id}
                      style={{ left: `${f.left}%` }}
                      className="animate-rise pointer-events-none absolute -top-7 z-10 font-display text-sm font-bold text-[#F59E0B]"
                    >
                      +{f.amt} XP
                    </span>
                  ))}
                  <div className="h-3.5 overflow-hidden rounded-full bg-slate-800 ring-1 ring-inset ring-slate-700/60">
                    <div
                      className="relative h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#10B981] to-[#F59E0B] transition-[width] duration-700 ease-out"
                      style={{ width: `${Math.max(progress, 2)}%` }}
                    >
                      <span className="animate-shimmer absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-semibold text-[#F59E0B]">{toNext} XP</span> to Level {level + 1} · keep
                  shipping
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
                const inCol = quests.filter((q) => q.stage === ci);
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
                        const shipped = q.stage === 3;
                        return (
                          <button
                            key={`${q.id}-${q.stage}`}
                            onClick={(e) => advance(q, e)}
                            disabled={shipped}
                            className={`animate-pop group/card w-full rounded-xl border p-3 text-left transition-all duration-300 ${
                              shipped
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
                              <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-bold text-[#F59E0B]">
                                +{q.xp} XP
                              </span>
                              {shipped ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
                                  <Check className="h-3 w-3" strokeWidth={3} /> Shipped
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
            Tip: ship every quest to trigger a level-up — the confetti is on us.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

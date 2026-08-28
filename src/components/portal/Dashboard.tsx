import { Check, CheckCircle2, ChevronRight, Layers, Send } from "lucide-react";
import { FILE_META, PHASES, CURRENT_PHASE_INDEX, type Deliverable, type DeliverableStatus } from "./portalData";

const COLUMNS: { status: DeliverableStatus; name: string; dot: string; hint: string }[] = [
  { status: "draft", name: "Draft", dot: "bg-slate-500", hint: "Being prepared by the studio" },
  { status: "review", name: "In Review", dot: "bg-[#F59E0B]", hint: "Waiting on your approval" },
  { status: "approved", name: "Approved", dot: "bg-[#10B981]", hint: "Signed off & archived" },
];

interface Props {
  deliverables: Deliverable[];
  onOpen: (d: Deliverable) => void;
  onSubmit: (d: Deliverable) => void;
  onApprove: (d: Deliverable, el: Element) => void;
}

export default function Dashboard({ deliverables, onOpen, onSubmit, onApprove }: Props) {
  const approved = deliverables.filter((d) => d.status === "approved").length;
  const progress = Math.round((approved / deliverables.length) * 100);

  return (
    <div>
      {/* project header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Website Relaunch
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-[#F59E0B]">
                <Layers className="h-3.5 w-3.5" />
                Phase 2: Design
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Atlas Co. · 6 deliverables · updated today
            </p>

            {/* phase tracker */}
            <div className="mt-5 flex items-center gap-2">
              {PHASES.map((p, i) => {
                const done = i < CURRENT_PHASE_INDEX;
                const active = i === CURRENT_PHASE_INDEX;
                return (
                  <div key={p} className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                        done
                          ? "bg-emerald-400/10 text-[#10B981]"
                          : active
                            ? "bg-violet-500/15 text-violet-300 ring-1 ring-quest/40"
                            : "bg-slate-800/80 text-slate-600"
                      }`}
                    >
                      {done ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                      {p}
                    </span>
                    {i < PHASES.length - 1 && <span className="h-px w-4 bg-slate-800" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* project progress */}
          <div className="w-full max-w-sm">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold text-white">Project Progress</p>
              <p className="font-display text-lg font-bold text-[#10B981]">{progress}%</p>
            </div>
            <div className="relative mt-2.5 h-3 overflow-hidden rounded-full bg-slate-800 ring-1 ring-inset ring-slate-700/60">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#10B981] to-[#F59E0B] transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(progress, 3)}%` }}
              >
                <span className="animate-shimmer absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              <span className="font-semibold text-[#10B981]">{approved} of {deliverables.length}</span> deliverables
              approved · scope updates lock automatically
            </p>
          </div>
        </div>
      </div>

      {/* board columns */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = deliverables.filter((d) => d.status === col.status);
          return (
            <div key={col.status} className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5">
              <div className="mb-1 flex items-center justify-between px-1.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <span className="text-sm font-bold text-slate-100">{col.name}</span>
                </div>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                  {items.length}
                </span>
              </div>
              <p className="mb-3 px-1.5 text-[11px] text-slate-600">{col.hint}</p>

              <div className="flex min-h-[160px] flex-col gap-2.5">
                {items.map((d) => {
                  const meta = FILE_META[d.type];
                  const Icon = meta.icon;
                  return (
                    <div
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpen(d)}
                      onKeyDown={(e) => e.key === "Enter" && onOpen(d)}
                      className="group cursor-pointer rounded-xl border border-slate-700/60 bg-slate-800/70 p-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-quest/60 hover:bg-slate-800 hover:shadow-lg hover:shadow-quest/10"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${meta.tint}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">{d.title}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {meta.chip} · v{d.version} · {d.size} · {d.updated}
                          </span>
                        </span>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-quest" />
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                          {d.notes.length} note{d.notes.length === 1 ? "" : "s"}
                        </span>

                        {d.status === "draft" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSubmit(d);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-300 transition-all duration-200 hover:border-violet-400/60 hover:bg-quest/15 hover:text-violet-200"
                          >
                            <Send className="h-3 w-3" /> Submit for review
                          </button>
                        )}
                        {d.status === "review" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onApprove(d, e.currentTarget);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-[#10B981] px-2.5 py-1 text-[11px] font-bold text-slate-950 shadow-sm shadow-emerald-500/30 transition-all duration-200 hover:bg-emerald-400 active:scale-95"
                          >
                            <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> Approve
                          </button>
                        )}
                        {d.status === "approved" && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} /> Approved
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-slate-800 py-8 text-xs text-slate-600">
                    Nothing here — yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

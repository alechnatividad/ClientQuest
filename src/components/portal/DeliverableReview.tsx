import { useEffect, useRef } from "react";
import { CheckCircle2, MessageSquare, RotateCcw, X } from "lucide-react";
import { FILE_META, type Deliverable } from "./portalData";

interface Props {
  deliverable: Deliverable | null;
  onClose: () => void;
  onApprove: (d: Deliverable, el: Element) => void;
  onRevise: (d: Deliverable) => void;
}

export default function DeliverableReview({ deliverable, onClose, onApprove, onRevise }: Props) {
  const approveRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!deliverable) return null;
  const d = deliverable;
  const meta = FILE_META[d.type];
  const Icon = meta.icon;
  const approved = d.status === "approved";

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Deliverable Review"
    >
      <div
        className="animate-pop w-full max-w-2xl rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5 sm:p-6">
          <div className="flex items-start gap-3.5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${meta.tint}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold tracking-[0.22em] text-quest">DELIVERABLE REVIEW</p>
              <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-white sm:text-xl">{d.title}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                  {meta.chip} · v{d.version}
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                  {d.size} · updated {d.updated}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    approved
                      ? "bg-emerald-400/10 text-[#10B981]"
                      : d.status === "review"
                        ? "bg-amber-400/10 text-[#F59E0B]"
                        : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {approved ? "Approved" : d.status === "review" ? "In Review" : "Draft"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close review"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-700 text-slate-400 transition-all duration-200 hover:rotate-90 hover:border-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* preview */}
        <div className="p-5 sm:p-6">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
            <div className="absolute left-0 top-0 flex w-full items-center gap-1.5 border-b border-slate-800/80 bg-slate-950/70 px-4 py-2.5 backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 truncate text-[11px] text-slate-500">
                {d.title.toLowerCase().replace(/\s+/g, "-")}.{meta.chip.toLowerCase()}
              </span>
            </div>
            <div aria-hidden className="absolute inset-0 grid place-items-center">
              <div className="flex items-end gap-3">
                {[42, 64, 50, 78, 58].map((h, i) => (
                  <span
                    key={i}
                    className="w-6 rounded-t-md bg-gradient-to-t from-quest/40 to-quest/10 transition-all duration-500"
                    style={{ height: `${h}px`, transitionDelay: `${i * 60}ms` }}
                  />
                ))}
              </div>
              <span className="absolute bottom-4 right-4 rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-bold text-slate-400">
                Preview · v{d.version}
              </span>
            </div>
          </div>

          {/* feedback thread */}
          <div className="mt-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <MessageSquare className="h-4 w-4 text-quest" /> Feedback thread
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                {d.notes.length}
              </span>
            </p>
            <div className="mt-3 flex max-h-44 flex-col gap-2.5 overflow-y-auto pr-1">
              {d.notes.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-800 py-5 text-center text-xs text-slate-600">
                  No feedback yet — notes from both sides will appear here.
                </p>
              )}
              {d.notes.map((n, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-white">
                      {n.author} <span className="font-medium text-slate-500">· {n.role}</span>
                    </p>
                    <p className="text-[11px] text-slate-600">{n.time}</p>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-800 p-5 sm:p-6">
          {!approved && (
            <>
              <button
                onClick={() => onRevise(d)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-amber-400/50 hover:bg-amber-400/10 hover:text-[#F59E0B]"
              >
                <RotateCcw className="h-4 w-4" /> Request revisions
              </button>
              <button
                ref={approveRef}
                onClick={() => onApprove(d, approveRef.current ?? document.body)}
                className="inline-flex items-center gap-2 rounded-full bg-[#10B981] px-6 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-emerald-500/40 active:translate-y-0 active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} /> Approve Deliverable
              </button>
            </>
          )}
          {approved && (
            <p className="flex items-center gap-2 text-sm font-semibold text-[#10B981]">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} /> Approved — archived in your Asset Library
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

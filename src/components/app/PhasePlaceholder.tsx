import type { LucideIcon } from "lucide-react";
import { FlaskConical } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  body: string;
  footnote?: string;
}

/**
 * Honest "not built yet" panel for Phase 1 — explains what lands in Phase 2
 * without faking data or pretending functionality exists.
 */
export default function PhasePlaceholder({ icon: Icon, title, body, footnote }: Props) {
  return (
    <div className="animate-pop rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 p-8 text-center sm:p-12">
      <div className="mx-auto flex items-center justify-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-quest/30 bg-quest/10">
          <Icon className="h-6 w-6 text-violet-300" />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#F59E0B]">
          <FlaskConical className="h-3 w-3" /> PHASE 2
        </span>
      </div>
      <h3 className="mt-5 font-display text-xl font-bold text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-slate-400">{body}</p>
      {footnote && <p className="mt-4 text-xs text-slate-600">{footnote}</p>}
    </div>
  );
}

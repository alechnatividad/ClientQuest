import { Download, FolderOpen, Lock, Unlock } from "lucide-react";
import { FILE_META, type Deliverable } from "./portalData";

interface Props {
  deliverables: Deliverable[];
  onToast: (title: string, sub: string) => void;
}

export default function AssetLibrary({ deliverables, onToast }: Props) {
  const unlocked = deliverables.filter((d) => d.status === "approved");
  const pending = deliverables.length - unlocked.length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Asset Library</h1>
          <p className="mt-2 text-sm text-slate-500">
            Every approved deliverable, archived for permanent access — final files only, versions included.
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-bold text-[#10B981]">
          {unlocked.length} of {deliverables.length} deliverables unlocked
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {unlocked.map((d) => {
          const meta = FILE_META[d.type];
          const Icon = meta.icon;
          return (
            <div
              key={d.id}
              className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-500/10"
            >
              <div className="flex items-start justify-between">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${meta.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-[#10B981]">
                  <Unlock className="h-3 w-3" /> Unlocked
                </span>
              </div>
              <h3 className="mt-4 truncate font-display text-base font-bold text-white">{d.title}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {meta.label} · v{d.version} · {d.size} · approved {d.updated}
              </p>
              <button
                onClick={() => onToast("Download started", `“${d.title}” v${d.version} is on its way.`)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 group-hover:border-emerald-400/50 hover:bg-emerald-400/10 hover:text-[#10B981]"
              >
                <Download className="h-4 w-4" /> Download final files
              </button>
            </div>
          );
        })}

        {/* locked state */}
        {pending > 0 && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-6 text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-600">
                <Lock className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-400">
                {pending} deliverable{pending === 1 ? "" : "s"} still pending
              </p>
              <p className="mx-auto mt-1.5 max-w-[240px] text-xs leading-relaxed text-slate-600">
                Approved deliverables will appear here for permanent access.
              </p>
            </div>
          </div>
        )}
      </div>

      {unlocked.length === 0 && (
        <div className="mt-4 grid place-items-center rounded-2xl border border-slate-800 bg-slate-900/40 py-14 text-center">
          <div>
            <FolderOpen className="mx-auto h-8 w-8 text-slate-700" />
            <p className="mt-3 text-sm font-semibold text-slate-400">Your library is empty</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-600">
              Approved deliverables will appear here for permanent access.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

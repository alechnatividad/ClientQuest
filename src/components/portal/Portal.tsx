import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, FolderOpen, Gem, LayoutDashboard, Settings2 } from "lucide-react";
import { burstFrom } from "../../lib/confetti";
import AdminSettings from "./AdminSettings";
import AssetLibrary from "./AssetLibrary";
import Dashboard from "./Dashboard";
import DeliverableReview from "./DeliverableReview";
import { INITIAL_DELIVERABLES, type Deliverable } from "./portalData";

type View = "dashboard" | "assets" | "settings";

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "assets", label: "Asset Library", icon: FolderOpen },
  { id: "settings", label: "Settings", icon: Settings2 },
];

interface Toast {
  id: number;
  title: string;
  sub: string;
}

export default function Portal({ onExit }: { onExit: () => void }) {
  const [view, setView] = useState<View>("dashboard");
  const [deliverables, setDeliverables] = useState<Deliverable[]>(INITIAL_DELIVERABLES);
  const [selected, setSelected] = useState<Deliverable | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (title: string, sub: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, title, sub }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  const submit = (d: Deliverable) => {
    setDeliverables((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: "review" } : x)));
    pushToast("Submitted for review", `“${d.title}” is now waiting on client approval.`);
  };

  const approve = (d: Deliverable, el?: Element) => {
    setDeliverables((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: "approved" } : x)));
    if (el) burstFrom(el);
    pushToast("Deliverable approved", `“${d.title}” unlocked in your Asset Library.`);
    setSelected(null);
  };

  const revise = (d: Deliverable) => {
    setDeliverables((prev) =>
      prev.map((x) => (x.id === d.id ? { ...x, status: "draft", version: x.version + 1 } : x)),
    );
    pushToast("Revisions requested", `“${d.title}” returned to the studio as v${d.version + 1}.`);
    setSelected(null);
  };

  // keep the open modal in sync with state changes
  useEffect(() => {
    if (selected) {
      const live = deliverables.find((x) => x.id === selected.id);
      if (live && live !== selected) setSelected(live);
    }
  }, [deliverables, selected]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200">
      {/* ambient background */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="bg-dots absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-quest/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-500/[0.05] blur-[130px]" />
      </div>

      {/* sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-quest to-quest-deep shadow-lg shadow-quest/30">
            <Gem className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-white">Client</span>
            <span className="text-[#10B981]">Quest</span>
          </span>
        </div>

        <div className="mx-4 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-3">
          <p className="text-[10px] font-bold tracking-[0.18em] text-slate-600">ACTIVE PROJECT</p>
          <p className="mt-1 truncate text-sm font-semibold text-white">Website Relaunch</p>
          <p className="text-[11px] text-slate-500">Atlas Co.</p>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active ? "bg-quest/15 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <span
                  className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#10B981] transition-all duration-300 ${
                    active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                  }`}
                />
                <item.icon className={`h-4 w-4 ${active ? "text-violet-300" : ""}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-800/80 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">
              MR
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Maya Reyes</p>
              <p className="truncate text-[11px] text-slate-500">Atlas Co. · Client</p>
            </div>
          </div>
          <button
            onClick={onExit}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 transition-colors duration-200 hover:bg-slate-900 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </button>
        </div>
      </aside>

      {/* top bar (mobile) */}
      <div className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-quest to-quest-deep">
              <Gem className="h-4 w-4 text-white" strokeWidth={2.25} />
            </span>
            <span className="font-display text-base font-bold">
              <span className="text-white">Client</span>
              <span className="text-[#10B981]">Quest</span>
            </span>
          </div>
          <button onClick={onExit} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto px-5 pb-3">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
                view === item.id
                  ? "bg-quest/20 text-white ring-1 ring-quest/40"
                  : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" /> {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* content */}
      <main className="relative lg:pl-60">
        <div key={view} className="animate-pop mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          {view === "dashboard" && (
            <Dashboard
              deliverables={deliverables}
              onOpen={setSelected}
              onSubmit={submit}
              onApprove={(d, el) => approve(d, el)}
            />
          )}
          {view === "assets" && <AssetLibrary deliverables={deliverables} onToast={pushToast} />}
          {view === "settings" && <AdminSettings onToast={pushToast} />}
        </div>
      </main>

      {/* deliverable review modal */}
      <DeliverableReview
        deliverable={selected}
        onClose={() => setSelected(null)}
        onApprove={(d, el) => approve(d, el)}
        onRevise={revise}
      />

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[90] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-2.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-pop pointer-events-auto flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-slate-900/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur"
            role="status"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-[#10B981]">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-bold text-white">{t.title}</span>
              <span className="block text-xs text-slate-400">{t.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

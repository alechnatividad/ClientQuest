import { Plus, Users } from "lucide-react";
import PhasePlaceholder from "../../components/app/PhasePlaceholder";

export default function ClientsPage() {
  return (
    <div className="animate-pop">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-[#10B981]">CLIENTS</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            The people you ship for
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Clients never create accounts. You add them once and share a secure portal link per project — that flow
            ships in Phase 2.
          </p>
        </div>
        <button
          disabled
          title="Client management arrives in Phase 2"
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-quest/40 px-6 py-3 text-sm font-semibold text-white/70"
        >
          <Plus className="h-4 w-4" /> Add client
        </button>
      </div>

      <div className="mt-10">
        <PhasePlaceholder
          icon={Users}
          title="No clients yet — by design"
          body="Client records, portal-link generation and approval history arrive with the database in Phase 2. Until then this page stays honestly empty rather than showing made-up data."
          footnote="Planned: add client → attach to project → copy their passwordless link."
        />
      </div>
    </div>
  );
}

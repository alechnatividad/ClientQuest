import { FolderKanban, Plus } from "lucide-react";
import PhasePlaceholder from "../../components/app/PhasePlaceholder";

export default function ProjectsPage() {
  return (
    <div className="animate-pop">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-[#10B981]">PROJECTS</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Every engagement, one board
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-400">
            Projects hold phases, deliverables and the client portal link. This is where your studio's work will
            live.
          </p>
        </div>
        <button
          disabled
          title="Project creation arrives in Phase 2"
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-quest/40 px-6 py-3 text-sm font-semibold text-white/70"
        >
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      <div className="mt-10">
        <PhasePlaceholder
          icon={FolderKanban}
          title="No projects yet — and that's on schedule"
          body="Project CRUD, phase tracking and deliverable boards are wired to the database in Phase 2. Nothing here is faked: the moment the schema lands, this page lists your real projects."
          footnote="Planned: create project → invite client → generate secure /p/:token link."
        />
      </div>
    </div>
  );
}

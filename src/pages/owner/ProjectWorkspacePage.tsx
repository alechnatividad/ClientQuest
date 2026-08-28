import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FolderKanban } from "lucide-react";
import PhasePlaceholder from "../../components/app/PhasePlaceholder";

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <div className="animate-pop">
      <Link
        to="/app/projects"
        className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        All projects
      </Link>

      <div className="mt-6">
        <p className="text-xs font-bold tracking-[0.22em] text-[#10B981]">PROJECT WORKSPACE</p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Workspace <span className="text-violet-300">#{projectId}</span>
        </h1>
      </div>

      <div className="mt-10">
        <PhasePlaceholder
          icon={FolderKanban}
          title="This workspace renders in Phase 2"
          body="The route is live and the project id is captured — phases, deliverables, approval status and the client portal link will populate from the database next phase."
          footnote={`Route param received: projectId = ${projectId}`}
        />
      </div>
    </div>
  );
}

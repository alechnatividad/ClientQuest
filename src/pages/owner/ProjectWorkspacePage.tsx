import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Flag,
  FolderKanban,
  Pencil,
  SearchX,
  Trash2,
  UserRound,
} from "lucide-react";
import { useWorkspace } from "../../lib/workspace";
import {
  deleteProject,
  formatDate,
  isOverdue,
  updateProject,
  useClients,
  useProject,
  type ProjectInput,
} from "../../lib/repo";
import ProjectForm from "../../components/app/ProjectForm";
import {
  ErrorPanel,
  ConfirmDialog,
  Modal,
  ProjectStatusPill,
  SkeletonRows,
  Toast,
  btnGhost,
  btnPrimary,
} from "../../components/app/ui";

export default function ProjectWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id ?? null;

  const { project, loading, error, notFound, refresh } = useProject(workspaceId, projectId);
  const { rows: clients } = useClients(workspaceId);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const client = project?.client_id ? clients.find((c) => c.id === project.client_id) ?? null : null;

  const handleSave = async (input: ProjectInput) => {
    if (!project || !workspaceId || saving) return;
    setSaving(true);
    setSaveError(null);
    const result = await updateProject(workspaceId, project.id, input);
    setSaving(false);
    if (result.error) {
      setSaveError(result.error);
      return;
    }
    setEditOpen(false);
    refresh();
    showToast("Project updated");
  };

  const handleDelete = async () => {
    if (!project || !workspaceId || deleting) return;
    setDeleting(true);
    const result = await deleteProject(workspaceId, project.id);
    setDeleting(false);
    if (result.error) {
      setDeleteOpen(false);
      showToast(result.error);
      return;
    }
    navigate("/app/projects", { replace: true });
  };

  /* ── states ─────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="animate-pop">
        <BackLink />
        <div className="mt-6 space-y-3">
          <div className="animate-pulse h-9 w-2/3 rounded-lg bg-slate-800" />
          <SkeletonRows count={2} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-pop">
        <BackLink />
        <div className="mt-8">
          <ErrorPanel message={error} onRetry={refresh} />
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="animate-pop">
        <BackLink />
        <div className="mt-10 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 p-8 text-center sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <SearchX className="h-7 w-7 text-[#F59E0B]" />
          </span>
          <h1 className="mt-5 font-display text-xl font-bold text-white">Project not found</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-slate-400">
            This project doesn't exist in {workspace?.name ?? "your workspace"}, or your role can't see it. It may have
            been deleted by another owner or admin.
          </p>
          <Link to="/app/projects" className={`${btnGhost} mt-6`}>
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const overdue = isOverdue(project.due_date) && project.status !== "approved" && project.status !== "archived";

  return (
    <div className="animate-pop">
      <BackLink />

      {/* header */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.22em] text-[#10B981]">PROJECT WORKSPACE</p>
          <h1 className="mt-2 break-words font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {project.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <ProjectStatusPill status={project.status} />
            {project.due_date && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                  overdue ? "border-amber-400/30 bg-amber-400/10 text-[#F59E0B]" : "border-slate-700 bg-slate-800/60 text-slate-400"
                }`}
              >
                <CalendarClock className="h-3 w-3" />
                {overdue ? "Overdue · " : "Due "}
                {formatDate(project.due_date)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSaveError(null);
              setEditOpen(true);
            }}
            className={btnPrimary}
          >
            <Pencil className="h-4 w-4" /> Edit project
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            title="Delete project"
            aria-label="Delete project"
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-700 text-slate-400 transition-all duration-200 hover:border-rose-400/60 hover:bg-rose-400/10 hover:text-rose-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* detail grid */}
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 sm:p-7">
          <h2 className="flex items-center gap-2.5 font-display text-lg font-bold text-white">
            <Flag className="h-4 w-4 text-violet-300" /> Description
          </h2>
          {project.description ? (
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-300">{project.description}</p>
          ) : (
            <p className="mt-4 text-sm italic text-slate-600">No description yet — add one from “Edit project”.</p>
          )}
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6">
            <h2 className="font-display text-sm font-bold tracking-[0.18em] text-slate-500">DETAILS</h2>
            <dl className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                  {client ? <Building2 className="h-4 w-4 text-[#10B981]" /> : <UserRound className="h-4 w-4 text-slate-500" />}
                </span>
                <div className="min-w-0">
                  <dt className="text-[11px] font-bold tracking-wide text-slate-600">CLIENT</dt>
                  <dd className="truncate text-sm font-semibold text-white">
                    {client ? client.name : <span className="font-normal italic text-slate-600">No client attached</span>}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-400/25 bg-quest/10">
                  <FolderKanban className="h-4 w-4 text-violet-300" />
                </span>
                <div>
                  <dt className="text-[11px] font-bold tracking-wide text-slate-600">WORKSPACE</dt>
                  <dd className="text-sm font-semibold text-white">{workspace?.name ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-700 bg-slate-900/60">
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                </span>
                <div>
                  <dt className="text-[11px] font-bold tracking-wide text-slate-600">CREATED</dt>
                  <dd className="text-sm font-semibold text-white">{formatDate(project.created_at)}</dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/30 p-5">
            <p className="text-[13px] leading-relaxed text-slate-500">
              Deliverables, approvals, comments and the client portal link arrive in a later phase — this workspace
              tracks the project itself for now.
            </p>
          </div>
        </section>
      </div>

      {/* edit dialog */}
      <Modal
        open={editOpen}
        onClose={() => (saving ? undefined : setEditOpen(false))}
        kicker="EDIT PROJECT"
        title={project.name}
      >
        <ProjectForm
          clients={clients}
          initial={project}
          busy={saving}
          error={saveError}
          submitLabel="Save changes"
          onSubmit={(input) => void handleSave(input)}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
        title={`Delete ${project.name}?`}
        body="This permanently removes the project and its history from your workspace. Clients are kept. This can't be undone."
        confirmLabel="Delete project"
        busy={deleting}
      />

      <Toast message={toast} />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/app/projects"
      className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-white"
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      All projects
    </Link>
  );
}

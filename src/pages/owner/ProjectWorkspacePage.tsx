import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Flag,
  FileText,
  FolderKanban,
  Pencil,
  Plus,
  RotateCcw,
  SearchX,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useWorkspace } from "../../lib/workspace";
import {
  createDeliverable,
  deleteDeliverable,
  deleteProject,
  formatDate,
  isOverdue,
  setDeliverableArchived,
  setDeliverableStatus,
  useDeliverables,
  updateProject,
  useClients,
  useProject,
  updateDeliverable,
  type DeliverableInput,
  type ProjectInput,
} from "../../lib/repo";
import ProjectForm from "../../components/app/ProjectForm";
import DeliverableForm from "../../components/app/DeliverableForm";
import type { Deliverable, DeliverableStatus } from "../../types/app";
import {
  ErrorPanel,
  ConfirmDialog,
  DeliverableStatusPill,
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
  const { user } = useAuth();
  const { workspace, role } = useWorkspace();
  const workspaceId = workspace?.id ?? null;
  const [showArchived, setShowArchived] = useState(false);

  const { project, loading, error, notFound, refresh } = useProject(workspaceId, projectId);
  const { rows: clients } = useClients(workspaceId);
  const {
    rows: deliverables,
    loading: deliverablesLoading,
    error: deliverablesError,
    refresh: refreshDeliverables,
  } = useDeliverables(workspaceId, projectId, showArchived);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deliverableOpen, setDeliverableOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [deliverableSaving, setDeliverableSaving] = useState(false);
  const [deliverableError, setDeliverableError] = useState<string | null>(null);
  const [deleteDeliverableOpen, setDeleteDeliverableOpen] = useState<Deliverable | null>(null);
  const [deletingDeliverable, setDeletingDeliverable] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null);
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

  const openCreateDeliverable = () => {
    setEditingDeliverable(null);
    setDeliverableError(null);
    setDeliverableOpen(true);
  };

  const handleDeliverableSave = async (input: DeliverableInput) => {
    if (!project || !workspaceId || !user || deliverableSaving) return;
    setDeliverableSaving(true);
    setDeliverableError(null);
    const result = editingDeliverable
      ? await updateDeliverable(workspaceId, editingDeliverable.id, input)
      : await createDeliverable(workspaceId, project.id, user.id, input);
    setDeliverableSaving(false);
    if (result.error) {
      setDeliverableError(result.error);
      return;
    }
    setDeliverableOpen(false);
    setEditingDeliverable(null);
    refreshDeliverables();
    showToast(editingDeliverable ? "Deliverable updated" : "Deliverable created");
  };

  const handleStatusChange = async (deliverable: Deliverable, status: DeliverableStatus) => {
    if (!workspaceId || statusSavingId) return;
    setStatusSavingId(deliverable.id);
    const result = await setDeliverableStatus(workspaceId, deliverable.id, status);
    setStatusSavingId(null);
    if (result.error) {
      showToast(result.error);
      return;
    }
    refreshDeliverables();
    showToast("Review status updated");
  };

  const handleArchive = async (deliverable: Deliverable, archived: boolean) => {
    if (!workspaceId || statusSavingId) return;
    setStatusSavingId(deliverable.id);
    const result = await setDeliverableArchived(workspaceId, deliverable.id, archived);
    setStatusSavingId(null);
    if (result.error) {
      showToast(result.error);
      return;
    }
    refreshDeliverables();
    showToast(archived ? "Deliverable archived" : "Deliverable restored");
  };

  const handleDeleteDeliverable = async () => {
    if (!workspaceId || !deleteDeliverableOpen || deletingDeliverable) return;
    setDeletingDeliverable(true);
    const result = await deleteDeliverable(workspaceId, deleteDeliverableOpen.id);
    setDeletingDeliverable(false);
    if (result.error) {
      setDeleteDeliverableOpen(null);
      showToast(result.error);
      return;
    }
    setDeleteDeliverableOpen(null);
    refreshDeliverables();
    showToast("Deliverable deleted");
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
  const canManageDeliverables = role === "owner" || role === "admin";

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
              Use the deliverables section below to prepare work, request review, track changes and record approval.
              Comments, file uploads and client portal authentication remain outside this phase.
            </p>
          </div>
        </section>
      </div>

      {/* deliverables */}
      <section className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold tracking-[0.22em] text-[#10B981]">DELIVERABLES</p>
            <h2 className="mt-1 font-display text-lg font-bold text-white">Review and approval</h2>
            <p className="mt-1 text-sm text-slate-500">Track the work attached to this project from draft through approval.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => setShowArchived((current) => !current)} className={btnGhost}>
              <Archive className="h-4 w-4" /> {showArchived ? "Hide archived" : "Show archived"}
            </button>
            <button onClick={openCreateDeliverable} className={btnPrimary}>
              <Plus className="h-4 w-4" /> Add deliverable
            </button>
          </div>
        </div>

        {deliverablesLoading ? (
          <div className="mt-6"><SkeletonRows count={3} /></div>
        ) : deliverablesError ? (
          <div className="mt-6"><ErrorPanel message={deliverablesError} onRetry={refreshDeliverables} /></div>
        ) : deliverables.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 px-6 py-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-quest/30 bg-quest/10">
              <FileText className="h-6 w-6 text-violet-300" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-white">No deliverables yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">Add the first item that this project needs a client to review.</p>
            <button onClick={openCreateDeliverable} className={`${btnGhost} mt-5`}>
              <Plus className="h-4 w-4" /> Create deliverable
            </button>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {deliverables.map((deliverable) => (
              <li key={deliverable.id} className="rounded-2xl border border-slate-700/60 bg-slate-950/25 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="break-words font-display text-base font-bold text-white">{deliverable.title}</h3>
                      <DeliverableStatusPill status={deliverable.status} />
                      <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-bold text-slate-400">v{deliverable.version}</span>
                      {deliverable.archived_at && <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-bold text-slate-500">Archived</span>}
                    </div>
                    {deliverable.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{deliverable.description}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-slate-500">
                      <span>Updated {formatDate(deliverable.updated_at)}</span>
                      {deliverable.external_url && (
                        <a href={deliverable.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-violet-300 hover:text-violet-200">
                          Open external link <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingDeliverable(deliverable);
                        setDeliverableError(null);
                        setDeliverableOpen(true);
                      }}
                      className={btnGhost}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    {canManageDeliverables && (
                      <>
                        <button onClick={() => void handleArchive(deliverable, !deliverable.archived_at)} disabled={statusSavingId === deliverable.id} className={btnGhost}>
                          {deliverable.archived_at ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                          {deliverable.archived_at ? "Restore" : "Archive"}
                        </button>
                        <button onClick={() => setDeleteDeliverableOpen(deliverable)} disabled={statusSavingId === deliverable.id} className="grid h-10 w-10 place-items-center rounded-full border border-slate-700 text-slate-400 transition-all hover:border-rose-400/60 hover:bg-rose-400/10 hover:text-rose-300" aria-label={`Delete ${deliverable.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {!deliverable.archived_at && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
                    <span className="mr-1 text-[11px] font-bold tracking-wide text-slate-600">SET STATUS</span>
                    <StatusAction label="Draft" icon={CircleDot} active={deliverable.status === "draft"} disabled={statusSavingId === deliverable.id} onClick={() => void handleStatusChange(deliverable, "draft")} />
                    <StatusAction label="Ready for review" icon={FileText} active={deliverable.status === "ready_for_review"} disabled={statusSavingId === deliverable.id} onClick={() => void handleStatusChange(deliverable, "ready_for_review")} />
                    <StatusAction label="Changes requested" icon={RotateCcw} active={deliverable.status === "changes_requested"} disabled={statusSavingId === deliverable.id} onClick={() => void handleStatusChange(deliverable, "changes_requested")} />
                    <StatusAction label="Approved" icon={CheckCircle2} active={deliverable.status === "approved"} disabled={statusSavingId === deliverable.id} onClick={() => void handleStatusChange(deliverable, "approved")} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={deliverableOpen}
        onClose={() => (deliverableSaving ? undefined : setDeliverableOpen(false))}
        kicker={editingDeliverable ? "EDIT DELIVERABLE" : "NEW DELIVERABLE"}
        title={editingDeliverable?.title ?? "Add deliverable"}
      >
        <DeliverableForm
          initial={editingDeliverable}
          busy={deliverableSaving}
          error={deliverableError}
          submitLabel={editingDeliverable ? "Save changes" : "Create deliverable"}
          onSubmit={(input) => void handleDeliverableSave(input)}
          onCancel={() => setDeliverableOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteDeliverableOpen)}
        onClose={() => setDeleteDeliverableOpen(null)}
        onConfirm={() => void handleDeleteDeliverable()}
        title={`Delete ${deleteDeliverableOpen?.title ?? "deliverable"}?`}
        body="This permanently removes the deliverable from this project. This can't be undone."
        confirmLabel="Delete deliverable"
        busy={deletingDeliverable}
      />

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

function StatusAction({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
        active
          ? "border-violet-400/40 bg-quest/15 text-violet-200"
          : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500 hover:text-white"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
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

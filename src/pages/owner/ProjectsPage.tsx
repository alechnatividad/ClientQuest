import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, ChevronRight, FolderKanban, Plus, Search, Trash2, Users } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useWorkspace } from "../../lib/workspace";
import {
  PROJECT_STATUSES,
  createProject,
  deleteProject,
  formatDate,
  isOverdue,
  updateProject,
  useClients,
  useProjects,
  type ProjectInput,
} from "../../lib/repo";
import type { Project, ProjectStatus } from "../../types/database";
import ProjectForm from "../../components/app/ProjectForm";
import {
  PROJECT_STATUS_META,
  ProjectStatusPill,
  ConfirmDialog,
  EmptyState,
  ErrorPanel,
  Modal,
  SkeletonRows,
  Spinner,
  Toast,
  btnPrimary,
  inputCls,
} from "../../components/app/ui";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id ?? null;

  const { rows: projects, loading, error, refresh } = useProjects(workspaceId);
  const { rows: clients } = useClients(workspaceId);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const clientName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clients) map.set(c.id, c.name);
    return (id: string | null) => (id ? (map.get(id) ?? "Unknown client") : null);
  }, [clients]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      const client = clientName(p.client_id);
      return p.name.toLowerCase().includes(q) || (client?.toLowerCase().includes(q) ?? false);
    });
  }, [projects, query, statusFilter, clientName]);

  const handleCreate = async (input: ProjectInput) => {
    if (creating || !workspaceId || !user) return;
    setCreating(true);
    setCreateError(null);
    const result = await createProject(workspaceId, user.id, input);
    setCreating(false);
    if (result.error) {
      setCreateError(result.error);
      return;
    }
    setCreateOpen(false);
    refresh();
    showToast(`${result.data?.name ?? "Project"} created`);
  };

  const handleStatusChange = async (project: Project, status: ProjectStatus) => {
    if (!workspaceId || statusBusyId) return;
    if (status === project.status) return;
    setStatusBusyId(project.id);
    const result = await updateProject(workspaceId, project.id, { status });
    setStatusBusyId(null);
    if (result.error) {
      showToast(result.error);
      return;
    }
    refresh();
    showToast(`${project.name} → ${PROJECT_STATUS_META[status].label}`);
  };

  const handleDelete = async () => {
    if (!workspaceId || !pendingDelete || deleting) return;
    setDeleting(true);
    const result = await deleteProject(workspaceId, pendingDelete.id);
    setDeleting(false);
    if (result.error) {
      setPendingDelete(null);
      showToast(result.error);
      return;
    }
    showToast(`${pendingDelete.name} deleted`);
    setPendingDelete(null);
    refresh();
  };

  return (
    <div className="animate-pop">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-[#10B981]">PROJECTS</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Every engagement, one board
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-400">
            {loading
              ? "Loading projects…"
              : `${projects.length} project${projects.length === 1 ? "" : "s"} in ${workspace?.name ?? "your workspace"}`}
          </p>
        </div>
        <button
          onClick={() => {
            setCreateError(null);
            setCreateOpen(true);
          }}
          className={btnPrimary}
        >
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      {/* toolbar */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects or clients…"
            className={`${inputCls} pl-10`}
            aria-label="Search projects"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all")}
          className={`${inputCls} w-full sm:w-48`}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROJECT_STATUS_META[s].label}
            </option>
          ))}
        </select>
      </div>

      {/* body */}
      <div className="mt-6">
        {loading ? (
          <SkeletonRows count={4} />
        ) : error ? (
          <ErrorPanel message={error} onRetry={refresh} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet — start the first quest"
            body="Projects hold the work you share with clients: status, due dates and — in a later phase — deliverables and the passwordless portal link. Create one to get rolling."
            action={
              <button
                onClick={() => {
                  setCreateError(null);
                  setCreateOpen(true);
                }}
                className={btnPrimary}
              >
                <Plus className="h-4 w-4" /> New project
              </button>
            }
          />
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 p-8 text-center">
            <p className="text-sm font-medium text-slate-400">No projects match your filters.</p>
            <button
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
              className="mt-3 text-xs font-bold text-violet-300 underline-offset-4 transition-colors hover:text-violet-200 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((project, i) => {
              const client = clientName(project.client_id);
              const overdue = isOverdue(project.due_date) && project.status !== "approved" && project.status !== "archived";
              return (
                <li
                  key={project.id}
                  className="group animate-pop rounded-2xl border border-slate-700/50 bg-slate-800/40 transition-all duration-300 hover:border-quest/50 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-quest/5"
                  style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
                >
                  <div className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
                    <Link to={`/app/projects/${project.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                        <FolderKanban className="h-5 w-5 text-[#10B981]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2.5">
                          <span className="truncate font-display text-base font-bold text-white transition-colors group-hover:text-violet-200">
                            {project.name}
                          </span>
                          <ProjectStatusPill status={project.status} />
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
                          {client ? (
                            <span className="inline-flex items-center gap-1.5 font-medium text-slate-400">
                              <Users className="h-3 w-3" /> {client}
                            </span>
                          ) : (
                            <span>No client attached</span>
                          )}
                          {project.due_date && (
                            <span className={`inline-flex items-center gap-1.5 ${overdue ? "font-semibold text-[#F59E0B]" : ""}`}>
                              <CalendarClock className="h-3 w-3" />
                              {overdue ? "Overdue · " : "Due "}
                              {formatDate(project.due_date)}
                            </span>
                          )}
                          <span className="text-slate-600">· created {formatDate(project.created_at)}</span>
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-quest" />
                    </Link>

                    <div className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`status-${project.id}`}>
                        Change status for {project.name}
                      </label>
                      <select
                        id={`status-${project.id}`}
                        value={project.status}
                        disabled={statusBusyId === project.id}
                        onChange={(e) => void handleStatusChange(project, e.target.value as ProjectStatus)}
                        className="cursor-pointer rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all duration-200 hover:border-quest/60 focus:border-quest/70 focus:outline-none disabled:cursor-wait disabled:opacity-60"
                      >
                        {PROJECT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {PROJECT_STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                      {statusBusyId === project.id && <Spinner className="h-3.5 w-3.5 text-violet-300" />}
                      <button
                        onClick={() => setPendingDelete(project)}
                        title="Delete project"
                        aria-label={`Delete ${project.name}`}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 text-slate-400 transition-all duration-200 hover:border-rose-400/60 hover:bg-rose-400/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* create dialog */}
      <Modal
        open={createOpen}
        onClose={() => (creating ? undefined : setCreateOpen(false))}
        kicker="NEW PROJECT"
        title="Start a project"
      >
        <ProjectForm
          clients={clients}
          busy={creating}
          error={createError}
          submitLabel="Create project"
          onSubmit={(input) => void handleCreate(input)}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>

      {/* delete confirm */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
        title={`Delete ${pendingDelete?.name ?? "project"}?`}
        body="This permanently removes the project and its history from your workspace. Clients are kept. This can't be undone."
        confirmLabel="Delete project"
        busy={deleting}
      />

      <Toast message={toast} />
    </div>
  );
}

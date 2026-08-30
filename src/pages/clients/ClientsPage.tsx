import { useMemo, useRef, useState, type FormEvent } from "react";
import { Archive, Mail, Pencil, Plus, RotateCcw, Search, Trash2, Users } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useWorkspace } from "../../lib/workspace";
import {
  CLIENT_STATUSES,
  createClient,
  deleteClient,
  setClientStatus,
  updateClient,
  useClients,
  formatDate,
  type ClientInput,
  type ClientPatch,
} from "../../lib/repo";
import type { Client, ClientStatus } from "../../types/database";
import {
  CLIENT_STATUS_META,
  ClientStatusPill,
  ConfirmDialog,
  EmptyState,
  ErrorPanel,
  Field,
  FormAlert,
  Modal,
  SkeletonRows,
  Spinner,
  Toast,
  btnPrimary,
  initialsOf,
  inputCls,
  inputErrorCls,
} from "../../components/app/ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Filter = "all" | ClientStatus;

interface FormState {
  name: string;
  email: string;
  company: string;
  notes: string;
  status: ClientStatus;
}

const blankForm: FormState = { name: "", email: "", company: "", notes: "", status: "active" };

export default function ClientsPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const workspaceId = workspace?.id ?? null;

  const { rows: clients, loading, error, refresh } = useClients(workspaceId);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!q) return true;
      return [c.name, c.company, c.email].some((v) => v?.toLowerCase().includes(q));
    });
  }, [clients, query, filter]);

  const archivedCount = useMemo(() => clients.filter((c) => c.status === "archived").length, [clients]);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setFieldErrors({});
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setForm({
      name: client.name,
      email: client.email ?? "",
      company: client.company ?? "",
      notes: client.notes ?? "",
      status: client.status,
    });
    setFieldErrors({});
    setFormError(null);
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const next: { name?: string; email?: string } = {};
    if (!form.name.trim()) next.name = "Client name is required.";
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) next.email = "That doesn't look like a valid email.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving || !workspaceId || !user) return;
    if (!validate()) return;

    const payload: ClientInput = {
      name: form.name.trim(),
      email: form.email.trim() ? form.email.trim() : null,
      company: form.company.trim() ? form.company.trim() : null,
      notes: form.notes.trim() ? form.notes.trim() : null,
      status: form.status,
    };

    setSaving(true);
    setFormError(null);

    const result = editing
      ? await updateClient(workspaceId, editing.id, payload satisfies ClientPatch)
      : await createClient(workspaceId, user.id, payload);

    setSaving(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setModalOpen(false);
    refresh();
    showToast(editing ? "Client updated" : `${result.data?.name ?? "Client"} added`);
  };

  const handleToggleArchive = async (client: Client) => {
    if (!workspaceId || busyId) return;
    const nextStatus: ClientStatus = client.status === "archived" ? "active" : "archived";
    setBusyId(client.id);
    const result = await setClientStatus(workspaceId, client.id, nextStatus);
    setBusyId(null);
    if (result.error) {
      showToast(result.error);
      return;
    }
    refresh();
    showToast(nextStatus === "archived" ? `${client.name} archived` : `${client.name} restored`);
  };

  const handleDelete = async () => {
    if (!workspaceId || !pendingDelete || deleting) return;
    setDeleting(true);
    const result = await deleteClient(workspaceId, pendingDelete.id);
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
          <p className="text-xs font-bold tracking-[0.22em] text-[#10B981]">CLIENTS</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            The people you ship for
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-400">
            {loading
              ? "Loading your client directory…"
              : `${clients.length} client${clients.length === 1 ? "" : "s"} in ${workspace?.name ?? "your workspace"}${
                  archivedCount > 0 ? ` · ${archivedCount} archived` : ""
                }`}
          </p>
        </div>
        <button onClick={openCreate} className={btnPrimary}>
          <Plus className="h-4 w-4" /> Add client
        </button>
      </div>

      {/* toolbar */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company, email…"
            className={`${inputCls} pl-10`}
            aria-label="Search clients"
          />
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 p-1">
          {(["all", "active", "archived"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition-all duration-200 ${
                filter === f ? "bg-quest/20 text-violet-200" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {f === "all" ? "All" : CLIENT_STATUS_META[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="mt-6">
        {loading ? (
          <SkeletonRows count={4} />
        ) : error ? (
          <ErrorPanel message={error} onRetry={refresh} />
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clients yet — add your first"
            body="Clients live in your workspace and never need accounts. Add them once, then attach them to projects and share the passwordless portal link when that ships."
            action={
              <button onClick={openCreate} className={btnPrimary}>
                <Plus className="h-4 w-4" /> Add client
              </button>
            }
          />
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 p-8 text-center">
            <p className="text-sm font-medium text-slate-400">
              No clients match <span className="font-semibold text-white">“{query || CLIENT_STATUS_META[filter as ClientStatus]?.label}”</span>.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="mt-3 text-xs font-bold text-violet-300 underline-offset-4 transition-colors hover:text-violet-200 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((client, i) => (
              <li
                key={client.id}
                className="group animate-pop rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 transition-all duration-300 hover:border-quest/50 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-quest/5 sm:p-5"
                style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                    client.status === "archived" ? "bg-slate-700/40 text-slate-500" : "bg-violet-500/20 text-violet-300"
                  }`}>
                    {initialsOf(client.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className={`truncate font-display text-base font-bold ${client.status === "archived" ? "text-slate-500" : "text-white"}`}>
                        {client.name}
                      </h3>
                      <ClientStatusPill status={client.status} />
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
                      {client.company && <span className="font-medium text-slate-400">{client.company}</span>}
                      {client.email && (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3 w-3" /> {client.email}
                        </span>
                      )}
                      {!client.company && !client.email && <span>No contact details yet</span>}
                      <span className="text-slate-600">· added {formatDate(client.created_at)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(client)}
                      title="Edit client"
                      aria-label={`Edit ${client.name}`}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 text-slate-400 transition-all duration-200 hover:border-quest hover:bg-quest/15 hover:text-violet-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => void handleToggleArchive(client)}
                      disabled={busyId === client.id}
                      title={client.status === "archived" ? "Restore client" : "Archive client"}
                      aria-label={`${client.status === "archived" ? "Restore" : "Archive"} ${client.name}`}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 text-slate-400 transition-all duration-200 hover:border-amber-400/60 hover:bg-amber-400/10 hover:text-[#F59E0B] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyId === client.id ? (
                        <Spinner className="h-3.5 w-3.5" />
                      ) : client.status === "archived" ? (
                        <RotateCcw className="h-3.5 w-3.5" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setPendingDelete(client)}
                      title="Delete client"
                      aria-label={`Delete ${client.name}`}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-700 text-slate-400 transition-all duration-200 hover:border-rose-400/60 hover:bg-rose-400/10 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* create / edit dialog */}
      <Modal
        open={modalOpen}
        onClose={() => (saving ? undefined : setModalOpen(false))}
        kicker={editing ? "EDIT CLIENT" : "NEW CLIENT"}
        title={editing ? editing.name : "Add a client"}
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="client-name" required error={fieldErrors.name}>
            <input
              id="client-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Maya Torres"
              className={fieldErrors.name ? inputErrorCls : inputCls}
              autoFocus
              maxLength={120}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="client-email" error={fieldErrors.email} hint="optional">
              <input
                id="client-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="maya@company.com"
                className={fieldErrors.email ? inputErrorCls : inputCls}
                maxLength={160}
              />
            </Field>
            <Field label="Company" htmlFor="client-company" hint="optional">
              <input
                id="client-company"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Torres Studio Ltd"
                className={inputCls}
                maxLength={120}
              />
            </Field>
          </div>

          <Field label="Notes" htmlFor="client-notes" hint="optional">
            <textarea
              id="client-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Context, preferences, timezone…"
              rows={3}
              className={`${inputCls} resize-none`}
              maxLength={1000}
            />
          </Field>

          <Field label="Status" htmlFor="client-status">
            <select
              id="client-status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ClientStatus }))}
              className={inputCls}
            >
              {CLIENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CLIENT_STATUS_META[s].label}
                </option>
              ))}
            </select>
          </Field>

          {formError && <FormAlert message={formError} />}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-slate-500 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving && <Spinner />}
              {saving ? "Saving…" : editing ? "Save changes" : "Add client"}
            </button>
          </div>
        </form>
      </Modal>

      {/* delete confirm */}
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
        title={`Delete ${pendingDelete?.name ?? "client"}?`}
        body="This permanently removes the client from your workspace. Projects that reference them keep their history, but the link is cleared. This can't be undone."
        confirmLabel="Delete client"
        busy={deleting}
      />

      <Toast message={toast} />
    </div>
  );
}

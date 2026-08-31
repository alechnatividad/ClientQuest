import { useState, type FormEvent } from "react";
import type { Client, Project, ProjectStatus } from "../../types/app";
import { PROJECT_STATUSES, type ProjectInput } from "../../lib/repo";
import { Field, FormAlert, PROJECT_STATUS_META, Spinner, btnPrimary, inputCls, inputErrorCls } from "./ui";

interface ProjectFormProps {
  /** Clients of the ACTIVE workspace only — tenancy is enforced by the caller. */
  clients: Client[];
  initial?: Project | null;
  busy: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (input: ProjectInput) => void;
  onCancel: () => void;
}

/**
 * Create/edit form for the Phase 2B project fields.
 * Protected columns (workspace_id, created_by, timestamps) are never part of
 * this form — the data layer sets them.
 */
export default function ProjectForm({ clients, initial, busy, error, submitLabel, onSubmit, onCancel }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [clientId, setClientId] = useState(initial?.client_id ?? "");
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? "draft");
  const [dueDate, setDueDate] = useState(initial?.due_date?.slice(0, 10) ?? "");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Project name is required.");
      return;
    }
    setNameError(null);

    onSubmit({
      name: trimmed,
      description: description.trim() ? description.trim() : null,
      client_id: clientId || null,
      status,
      due_date: dueDate || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Name" htmlFor="project-name" required error={nameError}>
        <input
          id="project-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          placeholder="e.g. Homepage v2"
          className={nameError ? inputErrorCls : inputCls}
          autoFocus
          maxLength={120}
        />
      </Field>

      <Field label="Description" htmlFor="project-description" hint="optional">
        <textarea
          id="project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Scope, goals, links…"
          rows={3}
          className={`${inputCls} resize-none`}
          maxLength={2000}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client" htmlFor="project-client" hint="optional">
          <select
            id="project-client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={inputCls}
          >
            <option value="">No client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.status === "archived" ? " (archived)" : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status" htmlFor="project-status">
          <select
            id="project-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className={inputCls}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_META[s].label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Due date" htmlFor="project-due" hint="optional">
        <input
          id="project-due"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputCls}
        />
      </Field>

      {error && <FormAlert message={error} />}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-slate-500 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>
        <button type="submit" disabled={busy} className={btnPrimary}>
          {busy && <Spinner />}
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

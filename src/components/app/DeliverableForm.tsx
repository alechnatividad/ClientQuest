import { useState, type FormEvent } from "react";
import type { Deliverable, DeliverableStatus } from "../../types/app";
import { DELIVERABLE_STATUS_ORDER, type DeliverableInput } from "../../lib/repo";
import {
  DELIVERABLE_STATUS_META,
  Field,
  FormAlert,
  Spinner,
  btnPrimary,
  inputCls,
  inputErrorCls,
} from "./ui";

interface DeliverableFormProps {
  initial?: Deliverable | null;
  busy: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (input: DeliverableInput) => void;
  onCancel: () => void;
}

/**
 * Only user-editable fields are exposed. Workspace, project, creator, archive
 * state, and timestamps stay controlled by the repository and database.
 */
export default function DeliverableForm({ initial, busy, error, submitLabel, onSubmit, onCancel }: DeliverableFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? "");
  const [version, setVersion] = useState(String(initial?.version ?? 1));
  const [status, setStatus] = useState<DeliverableStatus>(initial?.status ?? "draft");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const cleanTitle = title.trim();
    const cleanUrl = externalUrl.trim();
    const parsedVersion = Number(version);
    const titleProblem = cleanTitle ? null : "Deliverable title is required.";
    const urlProblem = cleanUrl && !/^https?:\/\//i.test(cleanUrl)
      ? "Use a full http:// or https:// URL."
      : null;
    const versionProblem = Number.isInteger(parsedVersion) && parsedVersion > 0
      ? null
      : "Version must be a whole number of 1 or more.";

    setTitleError(titleProblem);
    setUrlError(urlProblem);
    setVersionError(versionProblem);
    if (titleProblem || urlProblem || versionProblem) return;

    onSubmit({
      title: cleanTitle,
      description: description.trim() || null,
      external_url: cleanUrl || null,
      version: parsedVersion,
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Title" htmlFor="deliverable-title" required error={titleError}>
        <input
          id="deliverable-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (titleError) setTitleError(null);
          }}
          placeholder="e.g. Homepage v2 review"
          className={titleError ? inputErrorCls : inputCls}
          autoFocus
          maxLength={160}
        />
      </Field>

      <Field label="Description" htmlFor="deliverable-description" hint="optional">
        <textarea
          id="deliverable-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What is ready for review?"
          rows={4}
          className={`${inputCls} resize-none`}
          maxLength={4000}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="deliverable-status">
          <select
            id="deliverable-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as DeliverableStatus)}
            className={inputCls}
          >
            {DELIVERABLE_STATUS_ORDER.map((item) => (
              <option key={item} value={item}>{DELIVERABLE_STATUS_META[item].label}</option>
            ))}
          </select>
        </Field>

        <Field label="Version" htmlFor="deliverable-version" required error={versionError}>
          <input
            id="deliverable-version"
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={version}
            onChange={(event) => {
              setVersion(event.target.value);
              if (versionError) setVersionError(null);
            }}
            className={versionError ? inputErrorCls : inputCls}
          />
        </Field>
      </div>

      <Field label="External link" htmlFor="deliverable-url" hint="optional" error={urlError}>
        <input
          id="deliverable-url"
          type="url"
          value={externalUrl}
          onChange={(event) => {
            setExternalUrl(event.target.value);
            if (urlError) setUrlError(null);
          }}
          placeholder="https://figma.com/..."
          className={urlError ? inputErrorCls : inputCls}
          maxLength={2000}
        />
      </Field>

      {error && <FormAlert message={error} />}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={busy} className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-slate-500 hover:text-white disabled:opacity-50">
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

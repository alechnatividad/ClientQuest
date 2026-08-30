import { useEffect, type ReactNode } from "react";
import { AlertTriangle, Gem, RefreshCw, X, type LucideIcon } from "lucide-react";
import type { ClientStatus, ProjectStatus } from "../../types/database";

/* ── shared class recipes (match the existing app shell look) ──────────── */

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-quest to-quest-deep px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-quest/25 transition-all duration-200 hover:brightness-110 hover:shadow-quest/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-quest hover:bg-quest/15 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-full bg-rose-500/90 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50";

export const inputCls =
  "w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 transition-all duration-200 focus:border-quest/70 focus:outline-none focus:ring-2 focus:ring-quest/20";

export const inputErrorCls =
  "w-full rounded-xl border border-rose-500/60 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 transition-all duration-200 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20";

/* ── status metadata ───────────────────────────────────────────────────── */

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; pill: string; dot: string }> = {
  draft: { label: "Draft", pill: "border-slate-600/60 bg-slate-700/20 text-slate-300", dot: "bg-slate-400" },
  active: { label: "Active", pill: "border-violet-400/30 bg-quest/15 text-violet-300", dot: "bg-[#8B5CF6]" },
  waiting_review: { label: "Waiting review", pill: "border-amber-400/30 bg-amber-400/10 text-[#F59E0B]", dot: "bg-[#F59E0B]" },
  approved: { label: "Approved", pill: "border-emerald-400/30 bg-emerald-400/10 text-[#10B981]", dot: "bg-[#10B981]" },
  archived: { label: "Archived", pill: "border-slate-700 bg-slate-800/60 text-slate-500", dot: "bg-slate-600" },
};

export const CLIENT_STATUS_META: Record<ClientStatus, { label: string; pill: string; dot: string }> = {
  active: { label: "Active", pill: "border-emerald-400/30 bg-emerald-400/10 text-[#10B981]", dot: "bg-[#10B981]" },
  archived: { label: "Archived", pill: "border-slate-700 bg-slate-800/60 text-slate-500", dot: "bg-slate-600" },
};

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function ClientStatusPill({ status }: { status: ClientStatus }) {
  const meta = CLIENT_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/* ── modal / dialog ────────────────────────────────────────────────────── */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  kicker?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, kicker, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div className="animate-pop relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-700/60 bg-slate-900 shadow-2xl shadow-black/60 sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-800 bg-slate-900/95 px-6 py-5 backdrop-blur">
          <div>
            {kicker && <p className="text-[11px] font-bold tracking-[0.22em] text-[#10B981]">{kicker}</p>}
            <h2 className="mt-1 font-display text-lg font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-700 text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  busy?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = "Delete", busy = false }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title={title} kicker="PLEASE CONFIRM">
      <p className="text-[15px] leading-relaxed text-slate-400">{body}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button onClick={onClose} disabled={busy} className={btnGhost}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={busy} className={btnDanger}>
          {busy ? <Spinner /> : null}
          {busy ? "Deleting…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ── form building blocks ──────────────────────────────────────────────── */

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, required, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-[13px] font-semibold text-slate-300">
        <span>
          {label}
          {required && <span className="ml-1 text-violet-300">*</span>}
        </span>
        {hint && <span className="text-[11px] font-normal text-slate-600">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-300">{error}</p>}
    </div>
  );
}

export function FormAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/* ── states ────────────────────────────────────────────────────────────── */

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24">
      <span className="animate-pulse-ring grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-quest to-quest-deep shadow-xl shadow-quest/30">
        <Gem className="h-5 w-5 text-white" strokeWidth={2.25} />
      </span>
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900/40 p-5" style={{ animationDelay: `${i * 120}ms` }}>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 rounded bg-slate-800" />
              <div className="h-3 w-1/2 rounded bg-slate-800/70" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-800/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="animate-pop rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] p-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-rose-400/30 bg-rose-400/10">
        <AlertTriangle className="h-6 w-6 text-rose-300" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-white">Something went wrong</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={`${btnGhost} mt-5`}>
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="animate-pop rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 p-8 text-center sm:p-12">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-quest/30 bg-quest/10">
        <Icon className="h-7 w-7 text-violet-300" />
      </span>
      <h3 className="mt-5 font-display text-xl font-bold text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-slate-400">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/* ── tiny toast for mutation feedback ──────────────────────────────────── */

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="animate-pop pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2.5 rounded-full border border-emerald-500/40 bg-slate-900/95 px-5 py-2.5 shadow-2xl shadow-black/50 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-[#10B981]" />
        <span className="text-sm font-semibold text-white">{message}</span>
      </div>
    </div>
  );
}

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

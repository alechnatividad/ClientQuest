import { useState } from "react";
import { CheckCircle2, ExternalLink, FileCheck2, Gem, RefreshCw, RotateCcw } from "lucide-react";
import type { ClientDeliverableDecision, ClientPortalData, ClientPortalDeliverable } from "../../lib/repo";
import { formatDate, submitClientDeliverableDecision } from "../../lib/repo";

const STATUS_STYLE: Record<ClientPortalDeliverable["status"], string> = {
  ready_for_review: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  changes_requested: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
};
const STATUS_LABEL: Record<ClientPortalDeliverable["status"], string> = {
  ready_for_review: "Ready for your review",
  changes_requested: "Changes requested",
  approved: "Approved",
};

export default function LiveClientPortal({ initialPortal, token }: { initialPortal: ClientPortalData; token: string }) {
  const [portal, setPortal] = useState(initialPortal);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const decide = async (deliverable: ClientPortalDeliverable, action: ClientDeliverableDecision) => {
    if (savingId) return;
    setSavingId(deliverable.id); setMessage(null);
    const result = await submitClientDeliverableDecision(token, deliverable.id, action);
    setSavingId(null);
    if (result.error || !result.data) { setMessage(result.error ?? "Your decision could not be saved. Please refresh and try again."); return; }
    setPortal((current) => ({ ...current, deliverables: current.deliverables.map((row) => row.id === result.data.id ? { ...row, status: result.data.status, updated_at: result.data.updated_at } : row) }));
    setMessage(action === "approved" ? "Approval recorded. Thank you." : "Change request sent to your studio.");
  };

  return <div className="relative min-h-screen overflow-hidden bg-slate-950 font-body text-slate-200">
    <div aria-hidden className="pointer-events-none absolute inset-0"><div className="bg-dots absolute inset-0 opacity-35 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,black,transparent)]" /><div className="absolute -top-28 left-1/2 h-72 w-[560px] -translate-x-1/2 rounded-full bg-quest/15 blur-[130px]" /></div>
    <header className="relative border-b border-slate-800/80 bg-slate-950/75 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-quest to-quest-deep shadow-lg shadow-quest/30"><Gem className="h-[18px] w-[18px] text-white" strokeWidth={2.25} /></span><span className="font-display text-lg font-bold tracking-tight"><span className="text-white">Client</span><span className="text-[#10B981]">Quest</span></span></div><span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-200">Secure client portal</span></div></header>
    <main className="relative mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14"><p className="text-[11px] font-bold tracking-[0.22em] text-[#10B981]">PROJECT REVIEW</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{portal.project.name}</h1><p className="mt-3 text-sm text-slate-400">For {portal.client.company ?? portal.client.name}</p>{portal.project.description && <p className="mt-6 max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed text-slate-300">{portal.project.description}</p>}
      {message && <p className="mt-7 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-100" role="status">{message}</p>}
      <section className="mt-9"><div className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-bold tracking-[0.22em] text-[#10B981]">DELIVERABLES</p><h2 className="mt-1 font-display text-xl font-bold text-white">Ready for review</h2></div><span className="text-sm text-slate-500">{portal.deliverables.length} item{portal.deliverables.length === 1 ? "" : "s"}</span></div>
        {portal.deliverables.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center"><FileCheck2 className="mx-auto h-7 w-7 text-slate-500" /><h3 className="mt-4 font-display text-lg font-bold text-white">Nothing to review yet</h3><p className="mt-2 text-sm text-slate-500">Your studio will add deliverables here when they are ready.</p></div> : <ul className="mt-6 space-y-4">{portal.deliverables.map((deliverable) => {
          const busy = savingId === deliverable.id;
          return <li key={deliverable.id} className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5 shadow-xl shadow-black/10 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2.5"><h3 className="break-words font-display text-lg font-bold text-white">{deliverable.title}</h3><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[deliverable.status]}`}>{STATUS_LABEL[deliverable.status]}</span><span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-400">v{deliverable.version}</span></div><p className="mt-2 text-xs text-slate-500">Updated {formatDate(deliverable.updated_at)}</p></div>{deliverable.external_url && <a href={deliverable.external_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-300 hover:text-violet-200">Open deliverable <ExternalLink className="h-4 w-4" /></a>}</div>{deliverable.description && <p className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-300">{deliverable.description}</p>}{deliverable.status === "ready_for_review" ? <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5"><button onClick={() => void decide(deliverable, "changes_requested")} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 px-5 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-400/10 disabled:opacity-50"><RotateCcw className="h-4 w-4" /> Request changes</button><button onClick={() => void decide(deliverable, "approved")} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-300 disabled:opacity-50">{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve</button></div> : <p className="mt-5 border-t border-slate-800 pt-5 text-sm font-medium text-slate-400">{deliverable.status === "approved" ? "Approved and recorded." : "Your studio has received the change request and will update this item."}</p>}</li>;
        })}</ul>}
      </section></main>
  </div>;
}

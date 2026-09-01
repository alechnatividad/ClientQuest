import { useEffect, useState } from "react";
import { Copy, Link2, RefreshCw, ShieldCheck, Unlink } from "lucide-react";
import { createProjectPortalLink, fetchProjectPortalLink, formatDate, revokeProjectPortalLink, type CreatedPortalLink } from "../../lib/repo";
import type { Project } from "../../types/app";
import { btnGhost, btnPrimary } from "./ui";

export default function ProjectPortalLinkPanel({ project, canManage }: { project: Project; canManage: boolean }) {
  const [link, setLink] = useState<{ id: string; created_at: string } | null>(null);
  const [freshLink, setFreshLink] = useState<CreatedPortalLink | null>(null);
  const [loading, setLoading] = useState(canManage && Boolean(project.client_id));
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [copied, setCopied] = useState(false);
  useEffect(() => { if (!canManage || !project.client_id) { setLoading(false); return; } let active = true; fetchProjectPortalLink(project.id).then((result) => { if (!active) return; setLink(result.data); setError(result.error); setLoading(false); }); return () => { active = false; }; }, [canManage, project.client_id, project.id]);
  const generate = async () => {
    if (busy) return;
    setBusy(true); setError(null); setCopied(false);
    const result = await createProjectPortalLink(project.id);
    setBusy(false);
    if (result.error || !result.data) {
      setError(result.error ?? "The portal link could not be created. Please try again.");
      return;
    }
    setFreshLink(result.data);
    setLink({ id: result.data.id, created_at: result.data.created_at });
  };
  const revoke = async () => { if (!link || busy) return; setBusy(true); setError(null); const result = await revokeProjectPortalLink(link.id); setBusy(false); if (result.error) { setError(result.error); return; } setLink(null); setFreshLink(null); };
  const copy = async () => { if (!freshLink) return; try { await navigator.clipboard.writeText(`${window.location.origin}/p/${freshLink.token}`); setCopied(true); } catch (copyError) { console.error("[client-portal] copy link failed", copyError); setError("Could not copy the link. Select and copy it manually."); } };
  const shareUrl = freshLink ? `${window.location.origin}/p/${freshLink.token}` : null;
  if (!canManage) return null;
  return <section className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-400/25 bg-quest/10"><ShieldCheck className="h-4 w-4 text-violet-300" /></span><div><p className="text-[11px] font-bold tracking-[0.18em] text-slate-500">CLIENT PORTAL</p><h2 className="mt-1 font-display text-sm font-bold text-white">Secure review link</h2></div></div>{!project.client_id ? <p className="mt-4 text-sm leading-relaxed text-slate-500">Attach a client to this project before creating a client portal link.</p> : loading ? <p className="mt-4 text-sm text-slate-500">Checking portal link…</p> : <><p className="mt-4 text-sm leading-relaxed text-slate-400">{link ? `An active link was created ${formatDate(link.created_at)}.` : "Create a private link for this client to review ready deliverables."}</p>{shareUrl && <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3"><code className="block break-all text-xs text-emerald-200">{shareUrl}</code><button onClick={() => void copy()} className={`${btnGhost} mt-3 w-full`}><Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy link"}</button></div>}<div className="mt-4 flex flex-wrap gap-2.5"><button onClick={() => void generate()} disabled={busy} className={btnPrimary}>{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}{link ? "Create fresh link" : "Create portal link"}</button>{link && <button onClick={() => void revoke()} disabled={busy} className={btnGhost}><Unlink className="h-4 w-4" /> Revoke link</button>}</div></>}{error && <p className="mt-3 text-sm text-rose-300">{error}</p>}</section>;
}

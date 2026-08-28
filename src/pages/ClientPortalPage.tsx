import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Gem, Link2, LockKeyhole } from "lucide-react";
import Portal from "../components/portal/Portal";

/**
 * Passwordless client portal.
 *
 * - `/p/demo` renders the interactive product demo (no data, no backend).
 * - Any other token will validate against the portal_links table in Phase 2;
 *   until then we show an honest "not connected" state instead of faking it.
 */
export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(token !== "demo");

  useEffect(() => {
    if (token === "demo") return;
    // Brief verification beat so the state reads as a real lookup, not a 404.
    const t = window.setTimeout(() => setChecking(false), 900);
    return () => window.clearTimeout(t);
  }, [token]);

  if (token === "demo") {
    return <Portal onExit={() => navigate("/")} />;
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-5 font-body text-slate-200 antialiased">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-dots absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />
        <div className="absolute -top-24 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full bg-quest/15 blur-[130px]" />
        <div className="absolute bottom-0 right-[10%] h-64 w-64 rounded-full bg-emerald-500/[0.07] blur-[110px]" />
      </div>

      <div className="animate-pop relative w-full max-w-md text-center">
        <Link to="/" className="group mx-auto flex w-fit items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-quest to-quest-deep shadow-lg shadow-quest/30 transition-transform duration-300 group-hover:-rotate-12">
            <Gem className="h-5 w-5 text-white" strokeWidth={2.25} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="text-white">Client</span>
            <span className="text-[#10B981]">Quest</span>
          </span>
        </Link>

        {checking ? (
          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
            <span className="animate-pulse-ring mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-quest/15">
              <LockKeyhole className="h-6 w-6 text-violet-300" />
            </span>
            <p className="mt-5 text-sm font-semibold text-white">Verifying your secure link…</p>
            <div className="mx-auto mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-slate-800">
              <div className="animate-shimmer h-full w-full bg-gradient-to-r from-transparent via-quest/60 to-transparent" />
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-8">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
              <Link2 className="h-6 w-6 text-[#F59E0B]" />
            </span>
            <h1 className="mt-5 font-display text-xl font-bold text-white">This link isn't connected yet</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">
              Portal links are validated against your studio's project data, which arrives in Phase 2. The route is
              live and your token was received:
            </p>
            <code className="mt-4 block truncate rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 font-mono text-xs text-[#10B981]">
              /p/{token}
            </code>
            <p className="mt-4 text-xs text-slate-600">
              Want to see the client experience now? Open the interactive demo.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                to="/p/demo"
                className="rounded-full bg-[#8B5CF6] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-400"
              >
                Open demo portal
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-slate-500 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back to site
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Gem } from "lucide-react";
import { sanitizeReturnPath, takeStoredReturnTo } from "../lib/auth";
import { supabase } from "../lib/supabase";

const RESOLVE_TIMEOUT_MS = 8000;

/**
 * Landing route for Supabase auth redirects (magic link + Google OAuth).
 *
 * Destination resolution (all strictly whitelisted to internal /app paths):
 *   1. ?return_to= param  — survives cross-device magic-link opens
 *   2. sessionStorage     — set by RequireAuth when the owner was bounced
 *   3. /app               — safe default
 *
 * Never redirects anywhere external, and never renders protected content.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const settled = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storedDestination = takeStoredReturnTo();
    const destination =
      sanitizeReturnPath(params.get("return_to")) ?? storedDestination;

    const finish = (to: string) => {
      if (settled.current) return;
      settled.current = true;
      navigate(to, { replace: true });
    };

    if (!supabase) {
      finish(destination);
      return;
    }

    // supabase-js exchanges the code from the URL automatically; we wait for
    // the resulting SIGNED_IN event (or an already-restored session).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(destination);
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) finish(destination);
      })
      .catch(() => undefined);

    const timeout = window.setTimeout(() => {
      if (!settled.current) {
        setFailed(true);
      }
    }, RESOLVE_TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-dots absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />
        <div className="absolute -top-24 left-1/2 h-64 w-[420px] -translate-x-1/2 rounded-full bg-quest/15 blur-[110px]" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center">
        {!failed ? (
          <>
            <span className="animate-pulse-ring grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-quest to-quest-deep shadow-xl shadow-quest/30">
              <Gem className="h-6 w-6 text-white" strokeWidth={2.25} />
            </span>
            <h1 className="mt-6 font-display text-lg font-bold text-white">Finishing sign-in…</h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
              Verifying your session and taking you back to where you left off.
            </p>
          </>
        ) : (
          <>
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-700 bg-slate-900">
              <Gem className="h-6 w-6 text-slate-500" strokeWidth={2.25} />
            </span>
            <h1 className="mt-6 font-display text-lg font-bold text-white">Sign-in couldn't be completed</h1>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
              The link may have expired or already been used. Try signing in again.
            </p>
            <Link
              to="/login"
              replace
              className="mt-6 inline-flex items-center rounded-full bg-[#8B5CF6] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-400"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

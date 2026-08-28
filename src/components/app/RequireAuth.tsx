import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Gem } from "lucide-react";
import { rememberReturnTo, useAuth } from "../../lib/auth";

/**
 * Layout route guarding everything under /app.
 * Restores the session first, then either renders children or bounces to /login —
 * recording the attempted path (e.g. /app/projects/123) so the auth flow can
 * return the owner to exactly where they were headed.
 */
export default function RequireAuth() {
  const { user, initializing } = useAuth();
  const location = useLocation();
  const isAuthed = Boolean(user);

  // Record the intended destination only when we're about to bounce.
  useEffect(() => {
    if (!initializing && !isAuthed) {
      rememberReturnTo(location.pathname + location.search);
    }
  }, [initializing, isAuthed, location.pathname, location.search]);

  if (initializing) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <span className="animate-pulse-ring grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-quest to-quest-deep shadow-xl shadow-quest/30">
            <Gem className="h-6 w-6 text-white" strokeWidth={2.25} />
          </span>
          <p className="text-sm font-medium text-slate-500">Restoring your session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

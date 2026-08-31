import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Gem, Settings2 } from "lucide-react";
import type { PostgrestError } from "@supabase/supabase-js";
import { useAuth } from "./auth";
import { isSupabaseConfigured, supabase } from "./supabase";
import { describeError } from "./repo";
import type { Workspace, WorkspaceMemberRole } from "../types/database";

/**
 * Centralized workspace bootstrap for the owner app.
 *
 * Every page under /app reads the active workspace from this single provider
 * instead of implementing its own lookup, so Clients, Projects and the
 * Dashboard can never disagree about which workspace is active.
 *
 * Bootstrap contract (matches the Phase 2A schema exactly):
 *   1. Look the user up in `workspace_members` with maybeSingle — ZERO ROWS
 *      IS THE NORMAL FIRST-LOGIN STATE, not an application error. (A
 *      `.single()` here would raise PGRST116 on every first login and block
 *      bootstrap before anything is created.)
 *   2. If a membership exists, load the workspace it points at.
 *   3. If not: re-check membership once more (another tab/refresh may have
 *      just committed), then insert exactly ONE workspace with
 *      `owner_id = auth user` and the default name "My Workspace". The
 *      `workspaces_owner_membership` database trigger creates the owner
 *      membership — this code NEVER writes to workspace_members itself.
 *   4. If the insert errors or its RETURNING row comes back filtered by the
 *      SELECT policy, verify through the membership row before failing.
 *
 * Duplicate-creation resistance:
 *   - One shared in-flight bootstrap promise per user id, so React
 *     StrictMode double effects, rapid "Try again" taps and concurrent
 *     consumers attach to the same run instead of racing to insert.
 *   - Membership is re-checked immediately before the insert, so a refresh
 *     during workspace creation resolves to the just-created workspace
 *     instead of inserting a second one.
 *
 * Error handling: the real Supabase error (code, message, details, hint) is
 * preserved in the browser console for debugging; the UI only ever shows
 * curated, non-sensitive wording plus the opaque PostgREST code.
 */

type WorkspaceStatus = "loading" | "creating" | "ready" | "error" | "unconfigured";

interface WorkspaceContextValue {
  status: WorkspaceStatus;
  workspace: Workspace | null;
  /** The caller's role in the active workspace (owner/admin/member). */
  role: WorkspaceMemberRole | null;
  error: string | null;
  retry: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const DEFAULT_WORKSPACE_NAME = "My Workspace";

interface LoadedWorkspace {
  workspace: Workspace;
  role: WorkspaceMemberRole;
}

/* ── error plumbing ─────────────────────────────────────────────────────── */

/** Log the ACTUAL Supabase error for developers; never rendered in the UI. */
function logBootstrapFailure(where: string, err: unknown): void {
  if (err && typeof err === "object" && "code" in err) {
    const pg = err as Partial<PostgrestError>;
    console.error(`[workspace] ${where}`, {
      code: pg.code,
      message: pg.message,
      details: pg.details,
      hint: pg.hint,
    });
  } else {
    console.error(`[workspace] ${where}`, err);
  }
}

/** Curated user-facing text for a bootstrap failure (no internals leak). */
function friendlyBootstrapError(err: unknown): string {
  if (err instanceof Error) {
    const pg = err as Partial<PostgrestError>;
    if (pg.code) {
      // Friendly mapping from the shared data layer + the opaque code, which
      // is safe to display and lets support pinpoint the exact failure.
      return `${describeError(err as PostgrestError)} (code ${pg.code})`;
    }
    if (err.message) return err.message; // our own curated messages
  }
  return "Something went wrong while opening your workspace. The exact error was logged to the browser console.";
}

/* ── bootstrap core ─────────────────────────────────────────────────────── */

/**
 * Membership probe. maybeSingle on purpose: a first-login user legitimately
 * has ZERO rows, which is the trigger for workspace creation — not an error.
 */
async function findMembership(userId: string) {
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function loadWorkspaceById(workspaceId: string): Promise<Workspace> {
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error(
      "Your membership points at a workspace that could not be loaded. Check the workspace still exists, then try again.",
    );
  }
  return data;
}

async function loadOrCreateWorkspace(
  userId: string,
  onCreating: () => void,
): Promise<LoadedWorkspace> {
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");

  // 1) Membership lookup — zero rows is the expected first-login state.
  const membership = await findMembership(userId);
  if (membership) {
    return { workspace: await loadWorkspaceById(membership.workspace_id), role: membership.role };
  }

  onCreating();

  // 2) Re-check just before creating: a concurrent tab, or a refresh during
  //    a previous in-flight bootstrap, may have committed a moment ago.
  const recheck = await findMembership(userId);
  if (recheck) {
    return { workspace: await loadWorkspaceById(recheck.workspace_id), role: recheck.role };
  }

  // 3) First login — create exactly one workspace. The database trigger
  //    `workspaces_owner_membership` (SECURITY DEFINER) adds the owner
  //    membership row; we NEVER insert into workspace_members ourselves.
  //    maybeSingle on the returning row: PostgREST applies the SELECT policy
  //    to RETURNING, so a filtered row must not be treated as a hard failure
  //    — step 4 verifies what actually exists.
  const { data: created, error: createError } = await supabase
    .from("workspaces")
    .insert({ name: DEFAULT_WORKSPACE_NAME, owner_id: userId })
    .select("*")
    .maybeSingle();

  if (!createError && created) return { workspace: created, role: "owner" };

  if (createError) logBootstrapFailure("workspace insert failed:", createError);

  // 4) The insert errored or returned no visible row — check whether a
  //    workspace + membership actually exist now before surfacing a failure.
  try {
    const after = await findMembership(userId);
    if (after) {
      return { workspace: await loadWorkspaceById(after.workspace_id), role: after.role };
    }
  } catch (verifyError) {
    logBootstrapFailure("post-insert membership verification failed:", verifyError);
  }

  // Nothing exists: the insert genuinely failed. Re-throw the real error so
  // its code/message reach the console and the curated mapping reaches the UI.
  throw (
    createError ??
    new Error("Could not create your workspace — the database returned no row and no membership exists.")
  );
}

/* ── shared in-flight bootstrap (duplicate-creation guard) ──────────────── */

let sharedBootstrap: Promise<LoadedWorkspace> | null = null;
let sharedBootstrapUserId: string | null = null;

/**
 * Returns the one in-flight bootstrap for this user, starting it if needed.
 * StrictMode double effects, "Try again" spam and concurrent consumers all
 * attach to the same promise, so at most one insert is ever attempted per
 * first-login episode. The slot clears itself when the run settles.
 */
function getBootstrap(userId: string, onCreating: () => void): Promise<LoadedWorkspace> {
  if (sharedBootstrap && sharedBootstrapUserId === userId) return sharedBootstrap;
  const shared = loadOrCreateWorkspace(userId, onCreating).finally(() => {
    if (sharedBootstrap === shared) {
      sharedBootstrap = null;
      sharedBootstrapUserId = null;
    }
  });
  sharedBootstrap = shared;
  sharedBootstrapUserId = userId;
  return shared;
}

/* ── provider ───────────────────────────────────────────────────────────── */

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<WorkspaceStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<WorkspaceMemberRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Monotonic attempt counter so a stale response can never overwrite a
  // newer one (user hits retry mid-flight, or signs out and back in quickly).
  const attemptRef = useRef(0);

  const load = useCallback(() => {
    if (!supabase || !user) return;
    const attempt = ++attemptRef.current;
    setStatus("loading");
    setError(null);

    getBootstrap(user.id, () => {
      if (attemptRef.current === attempt) setStatus("creating");
    })
      .then(({ workspace: ws, role: r }) => {
        if (attemptRef.current !== attempt) return;
        setWorkspace(ws);
        setRole(r);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (attemptRef.current !== attempt) return;
        logBootstrapFailure("bootstrap failed:", err);
        setWorkspace(null);
        setRole(null);
        setStatus("error");
        setError(friendlyBootstrapError(err));
      });
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({ status, workspace, role, error, retry: load }),
    [status, workspace, role, error, load],
  );

  if (status === "unconfigured") {
    return (
      <GateShell>
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
          <Settings2 className="h-6 w-6 text-[#F59E0B]" />
        </span>
        <h2 className="mt-5 font-display text-xl font-bold text-white">Supabase is not configured</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-slate-400">
          This deployment is missing <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">VITE_SUPABASE_URL</code>{" "}
          and <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-violet-300">VITE_SUPABASE_PUBLISHABLE_KEY</code>.
          Add them to your environment and redeploy — no data was touched.
        </p>
        <Link
          to="/app/settings"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-200 hover:border-quest hover:bg-quest/15 hover:text-violet-200"
        >
          <Settings2 className="h-4 w-4" /> Open settings
        </Link>
      </GateShell>
    );
  }

  if (status === "loading" || status === "creating") {
    return (
      <GateShell>
        <span className="animate-pulse-ring grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-quest to-quest-deep shadow-xl shadow-quest/30">
          <Gem className="h-6 w-6 text-white" strokeWidth={2.25} />
        </span>
        <p className="mt-5 text-sm font-medium text-slate-400">
          {status === "creating" ? "Creating your workspace…" : "Opening your workspace…"}
        </p>
        <p className="mt-1.5 text-xs text-slate-600">
          {status === "creating"
            ? "One-time setup — the database adds your owner membership automatically."
            : "Loading workspace, members and data."}
        </p>
      </GateShell>
    );
  }

  if (status === "error") {
    return (
      <GateShell>
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-rose-400/30 bg-rose-400/10">
          <AlertTriangle className="h-6 w-6 text-rose-300" />
        </span>
        <h2 className="mt-5 font-display text-xl font-bold text-white">Couldn't open your workspace</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-slate-400">{error}</p>
        <p className="mt-2 text-xs text-slate-600">Full error details are in the browser console.</p>
        <button
          onClick={load}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-quest to-quest-deep px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-quest/25 transition-all duration-200 hover:brightness-110 hover:shadow-quest/40"
        >
          Try again
        </button>
      </GateShell>
    );
  }

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

function GateShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-5">
      <div className="animate-pop max-w-lg text-center">{children}</div>
    </div>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within a <WorkspaceProvider>.");
  return ctx;
}

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
import { useAuth } from "./auth";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { Workspace, WorkspaceMemberRole } from "../types/app";

/**
 * Centralized workspace bootstrap for the owner app.
 *
 * Every page under /app reads the active workspace from this single provider
 * instead of implementing its own lookup, so Clients, Projects and the
 * Dashboard can never disagree about which workspace is active.
 *
 * Flow (matches the Phase 2A schema exactly):
 *   1. Look the user up in `workspace_members` (RLS only returns rows the
 *      user actually belongs to).
 *   2. Load the matching `workspaces` row.
 *   3. If the user has no membership yet, create a workspace with
 *      `owner_id = auth user`. The `workspaces_owner_membership` database
 *      trigger creates the owner membership — we NEVER insert into
 *      workspace_members ourselves.
 *   4. A concurrent-tab race that loses the insert simply re-reads the
 *      membership instead of creating a second workspace.
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

async function loadOrCreateWorkspace(
  userId: string,
  onCreating: () => void,
): Promise<LoadedWorkspace> {
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");

  // 1) membership lookup — RLS guarantees these are the caller's own rows.
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;

  if (membership) {
    // 2) load the workspace the membership points at.
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", membership.workspace_id)
      .maybeSingle();

    if (workspaceError) throw workspaceError;
    if (workspace) return { workspace, role: membership.role };

    throw new Error(
      "Your membership points at a workspace that could not be loaded. Check the workspace still exists, then try again.",
    );
  }

  // 3) first visit — create the workspace. The database trigger
  //    `workspaces_owner_membership` adds the owner membership row.
  onCreating();

  const { data: created, error: createError } = await supabase
    .from("workspaces")
    .insert({ name: DEFAULT_WORKSPACE_NAME, owner_id: userId })
    .select("*")
    .single();

  if (!createError && created) return { workspace: created, role: "owner" };

  // 4) insert failed — another tab may have created the workspace a moment
  //    ago. Re-check the membership before surfacing the error.
  const { data: retryMembership, error: retryMembershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!retryMembershipError && retryMembership) {
    const { data: retryWorkspace, error: retryWorkspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", retryMembership.workspace_id)
      .maybeSingle();

    if (!retryWorkspaceError && retryWorkspace) {
      return { workspace: retryWorkspace, role: retryMembership.role };
    }
  }

  throw createError ?? new Error("Could not create your workspace.");
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<WorkspaceStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<WorkspaceMemberRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Monotonic attempt counter so a stale response can never overwrite a
  // newer one (e.g. user hits retry mid-flight, or signs out and back in).
  const attemptRef = useRef(0);

  const load = useCallback(() => {
    if (!supabase || !user) return;
    const attempt = ++attemptRef.current;
    setStatus("loading");
    setError(null);

    loadOrCreateWorkspace(user.id, () => {
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
        setWorkspace(null);
        setRole(null);
        setStatus("error");
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Something went wrong while opening your workspace.",
        );
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

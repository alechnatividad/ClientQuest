import { useCallback, useEffect, useState } from "react";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type { Database, Json } from "../types/database";
import { DELIVERABLE_STATUSES } from "../types/app";
import type {
  Client,
  ClientStatus,
  Deliverable,
  DeliverableStatus,
  Project,
  ProjectStatus,
} from "../types/app";

/**
 * Phase 2B data layer — the ONLY place raw Supabase queries live.
 *
 * Rules baked into every function:
 *  - Queries are always scoped to the caller's active workspace, even though
 *    RLS already enforces isolation (defense in depth, explicit tenancy).
 *  - Only the authenticated browser client is used — never a service key.
 *  - Mutations re-read the affected row instead of optimistic patching, so
 *    the UI can never drift from what the database actually stored.
 *  - Zero-row updates/deletes (RLS hiding the row from this role) surface as
 *    a permission error instead of a silent "success".
 *  - Protected columns (workspace_id, created_by, timestamps) are never
 *    accepted as input here — only user-editable Phase 2B fields.
 */

export type RowResult<T> = { data: T; error: null } | { data: null; error: string };
export type ListResult<T> = { data: T[]; error: null } | { data: null; error: string };
export type DeleteResult = { error: string | null };

const NOT_CONFIGURED = "Supabase is not configured on this deployment.";

/* ── editable input shapes (protected columns deliberately excluded) ───── */

export interface ClientInput {
  name: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  status: ClientStatus;
}

export type ClientPatch = Partial<ClientInput>;

export interface ProjectInput {
  name: string;
  description: string | null;
  client_id: string | null;
  status: ProjectStatus;
  due_date: string | null;
}

export type ProjectPatch = Partial<ProjectInput>;

export interface DeliverableInput {
  title: string;
  description: string | null;
  status: DeliverableStatus;
  external_url: string | null;
  version: number;
}

export type DeliverablePatch = Partial<DeliverableInput>;

function logDeliverableError(operation: string, error: PostgrestError): void {
  console.error(`[deliverables] ${operation} failed`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

function logPortalError(operation: string, error: PostgrestError): void {
  console.error(`[client-portal] ${operation} failed`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

/* Phase 3 RPCs are deliberately isolated from generated table types until the
   reviewed migration is applied and the live schema can be regenerated. */
type PortalRpcDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Database["public"]["Functions"] & {
      create_project_portal_link: { Args: { p_project_id: string }; Returns: Json };
      get_project_portal_link: { Args: { p_project_id: string }; Returns: Json };
      revoke_project_portal_link: { Args: { p_portal_link_id: string }; Returns: null };
      get_client_portal: { Args: { p_token: string }; Returns: Json };
      submit_client_deliverable_decision: {
        Args: { p_token: string; p_deliverable_id: string; p_action: ClientDeliverableDecision };
        Returns: Json;
      };
    };
  };
};

type PortalLink = { id: string; project_id: string; client_id: string; created_at: string };
export type CreatedPortalLink = Pick<PortalLink, "id" | "created_at"> & { token: string };
export type ClientDeliverableDecision = "approved" | "changes_requested";
export interface ClientPortalDeliverable {
  id: string;
  title: string;
  description: string | null;
  status: Extract<DeliverableStatus, "ready_for_review" | ClientDeliverableDecision>;
  external_url: string | null;
  version: number;
  updated_at: string;
}
export interface ClientPortalData {
  project: { id: string; name: string; description: string | null };
  client: { name: string; company: string | null };
  deliverables: ClientPortalDeliverable[];
}

function portalClient(): SupabaseClient<PortalRpcDatabase> | null {
  return supabase as unknown as SupabaseClient<PortalRpcDatabase> | null;
}
function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function asString(value: unknown): string | null { return typeof value === "string" ? value : null; }
function readPortalLink(value: unknown, includeToken = false): PortalLink | CreatedPortalLink | null {
  const row = asRecord(value); const id = asString(row?.id); const createdAt = asString(row?.created_at);
  if (!id || !createdAt) return null;
  if (includeToken) { const token = asString(row?.token); return token && /^[0-9a-f]{64}$/.test(token) ? { id, created_at: createdAt, token } : null; }
  const projectId = asString(row?.project_id); const clientId = asString(row?.client_id);
  return projectId && clientId ? { id, project_id: projectId, client_id: clientId, created_at: createdAt } : null;
}
function readClientPortal(value: unknown): ClientPortalData | null {
  const root = asRecord(value); const project = asRecord(root?.project); const client = asRecord(root?.client);
  if (!project || !client || !Array.isArray(root?.deliverables)) return null;
  const projectId = asString(project.id); const projectName = asString(project.name); const clientName = asString(client.name);
  if (!projectId || !projectName || !clientName) return null;
  const deliverables: ClientPortalDeliverable[] = [];
  for (const value of root.deliverables) {
    const row = asRecord(value); const id = asString(row?.id); const title = asString(row?.title); const status = asString(row?.status); const updatedAt = asString(row?.updated_at);
    if (!id || !title || !updatedAt || !["ready_for_review", "changes_requested", "approved"].includes(status ?? "")) return null;
    deliverables.push({ id, title, description: asString(row?.description), status: status as ClientPortalDeliverable["status"], external_url: asString(row?.external_url), version: typeof row?.version === "number" ? row.version : 1, updated_at: updatedAt });
  }
  return { project: { id: projectId, name: projectName, description: asString(project.description) }, client: { name: clientName, company: asString(client.company) }, deliverables };
}

/* ── error mapping ─────────────────────────────────────────────────────── */

export function describeError(error: PostgrestError | Error | string | null | undefined): string {
  if (!error) return "Something went wrong talking to the database.";
  if (typeof error === "string") return error;

  const pg = error as Partial<PostgrestError>;
  switch (pg.code) {
    case "42501":
      return "Your role doesn't have permission to do that in this workspace.";
    case "23505":
      return "That value already exists — try a different one.";
    case "23503":
      return "This record is referenced by other data, so the change was rejected.";
    case "23514":
      return "One of the values is not allowed by the database (check statuses and formats).";
    case "PGRST204":
    case "PGRST205":
      return "The schema on this deployment doesn't match the app. Re-run the Phase 2A migration.";
    default: {
      const message = pg.message ?? error.message;
      if (!message) return "Something went wrong talking to the database.";
      // Strip Postgres quoting noise for a friendlier inline message.
      return message.replace(/^.*?violates row-level security policy.*$/i,
        "Row-level security blocked that action for your role.");
    }
  }
}

function notConfigured<T>(): RowResult<T> {
  return { data: null, error: NOT_CONFIGURED };
}

/* ── clients ───────────────────────────────────────────────────────────── */

export async function fetchClients(workspaceId: string): Promise<ListResult<Client>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name", { ascending: true });
  if (error) return { data: null, error: describeError(error) };
  return { data: data ?? [], error: null };
}

export async function createClient(
  workspaceId: string,
  userId: string,
  input: ClientInput,
): Promise<RowResult<Client>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      name: input.name,
      email: input.email,
      company: input.company,
      notes: input.notes,
      status: input.status,
    })
    .select("*")
    .single();
  if (error) return { data: null, error: describeError(error) };
  return { data, error: null };
}

export async function updateClient(
  workspaceId: string,
  clientId: string,
  patch: ClientPatch,
): Promise<RowResult<Client>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("clients")
    .update({
      name: patch.name,
      email: patch.email,
      company: patch.company,
      notes: patch.notes,
      status: patch.status,
    })
    .eq("id", clientId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .maybeSingle();
  if (error) return { data: null, error: describeError(error) };
  if (!data) {
    return {
      data: null,
      error: "No client was updated — it may be gone, or your role can't modify it.",
    };
  }
  return { data, error: null };
}

export async function setClientStatus(
  workspaceId: string,
  clientId: string,
  status: ClientStatus,
): Promise<RowResult<Client>> {
  return updateClient(workspaceId, clientId, { status });
}

export async function deleteClient(workspaceId: string, clientId: string): Promise<DeleteResult> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();
  if (error) return { error: describeError(error) };
  if (!data) {
    return { error: "No client was deleted — only workspace owners and admins can delete clients." };
  }
  return { error: null };
}

/* ── projects ──────────────────────────────────────────────────────────── */

export async function fetchProjects(workspaceId: string): Promise<ListResult<Project>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: describeError(error) };
  return { data: data ?? [], error: null };
}

export interface ProjectLookup {
  data: Project | null;
  error: string | null;
  notFound: boolean;
}

export async function fetchProject(workspaceId: string, projectId: string): Promise<ProjectLookup> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED, notFound: false };
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) return { data: null, error: describeError(error), notFound: false };
  // maybeSingle() returns null with no error both when the id doesn't exist
  // and when RLS hides the row — either way the page shows not-found.
  return { data, error: null, notFound: data === null };
}

export async function createProject(
  workspaceId: string,
  userId: string,
  input: ProjectInput,
): Promise<RowResult<Project>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      name: input.name,
      description: input.description,
      client_id: input.client_id,
      status: input.status,
      due_date: input.due_date,
    })
    .select("*")
    .single();
  if (error) return { data: null, error: describeError(error) };
  return { data, error: null };
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  patch: ProjectPatch,
): Promise<RowResult<Project>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("projects")
    .update({
      name: patch.name,
      description: patch.description,
      client_id: patch.client_id,
      status: patch.status,
      due_date: patch.due_date,
    })
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .maybeSingle();
  if (error) return { data: null, error: describeError(error) };
  if (!data) {
    return {
      data: null,
      error: "No project was updated — it may be gone, or your role can't modify it.",
    };
  }
  return { data, error: null };
}

export async function deleteProject(
  workspaceId: string,
  projectId: string,
): Promise<DeleteResult> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();
  if (error) return { error: describeError(error) };
  if (!data) {
    return { error: "No project was deleted — only workspace owners and admins can delete projects." };
  }
  return { error: null };
}

/* ── deliverables ─────────────────────────────────────────────────────── */

export async function fetchDeliverables(
  workspaceId: string,
  projectId: string,
  includeArchived = false,
): Promise<ListResult<Deliverable>> {
  if (!supabase) return { data: null, error: NOT_CONFIGURED };

  let query = supabase
    .from("deliverables")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (!includeArchived) query = query.is("archived_at", null);

  const { data, error } = await query;
  if (error) {
    logDeliverableError("fetch", error);
    return { data: null, error: describeError(error) };
  }
  return { data: (data ?? []) as Deliverable[], error: null };
}

export async function createDeliverable(
  workspaceId: string,
  projectId: string,
  userId: string,
  input: DeliverableInput,
): Promise<RowResult<Deliverable>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("deliverables")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      created_by: userId,
      title: input.title,
      description: input.description,
      status: input.status,
      external_url: input.external_url,
      version: input.version,
      archived_at: null,
    })
    .select("*")
    .single();
  if (error) {
    logDeliverableError("create", error);
    return { data: null, error: describeError(error) };
  }
  return { data: data as Deliverable, error: null };
}

export async function updateDeliverable(
  workspaceId: string,
  deliverableId: string,
  patch: DeliverablePatch,
): Promise<RowResult<Deliverable>> {
  if (!supabase) return notConfigured();

  // Never accept workspace_id, project_id, created_by, or timestamps from UI.
  const changes: DeliverablePatch = {};
  if (patch.title !== undefined) changes.title = patch.title;
  if (patch.description !== undefined) changes.description = patch.description;
  if (patch.status !== undefined) changes.status = patch.status;
  if (patch.external_url !== undefined) changes.external_url = patch.external_url;
  if (patch.version !== undefined) changes.version = patch.version;

  const { data, error } = await supabase
    .from("deliverables")
    .update(changes)
    .eq("id", deliverableId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .maybeSingle();
  if (error) {
    logDeliverableError("update", error);
    return { data: null, error: describeError(error) };
  }
  if (!data) {
    return {
      data: null,
      error: "No deliverable was updated — it may be gone, or your role can't modify it.",
    };
  }
  return { data: data as Deliverable, error: null };
}

export async function setDeliverableStatus(
  workspaceId: string,
  deliverableId: string,
  status: DeliverableStatus,
): Promise<RowResult<Deliverable>> {
  return updateDeliverable(workspaceId, deliverableId, { status });
}

export async function setDeliverableArchived(
  workspaceId: string,
  deliverableId: string,
  archived: boolean,
): Promise<RowResult<Deliverable>> {
  if (!supabase) return notConfigured();
  const { data, error } = await supabase
    .from("deliverables")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", deliverableId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .maybeSingle();
  if (error) {
    logDeliverableError("archive", error);
    return { data: null, error: describeError(error) };
  }
  if (!data) {
    return {
      data: null,
      error: "No deliverable was updated — it may be gone, or your role can't modify it.",
    };
  }
  return { data: data as Deliverable, error: null };
}

export async function deleteDeliverable(
  workspaceId: string,
  deliverableId: string,
): Promise<DeleteResult> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from("deliverables")
    .delete()
    .eq("id", deliverableId)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();
  if (error) {
    logDeliverableError("delete", error);
    return { error: describeError(error) };
  }
  if (!data) {
    return { error: "No deliverable was deleted — only workspace owners and admins can delete deliverables." };
  }
  return { error: null };
}

/* ── Phase 3 client portal ─────────────────────────────────────────────── */

export async function createProjectPortalLink(projectId: string): Promise<RowResult<CreatedPortalLink>> {
  const client = portalClient();
  if (!client) return notConfigured();
  const { data, error } = await client.rpc("create_project_portal_link", { p_project_id: projectId });
  if (error) {
    logPortalError("create link", error);
    return { data: null, error: describeError(error) };
  }
  const link = readPortalLink(data, true);
  if (!link || !("token" in link)) {
    console.error("[client-portal] create link returned an invalid response", data);
    return { data: null, error: "The portal link could not be created. Please try again." };
  }
  return { data: link, error: null };
}

export async function fetchProjectPortalLink(projectId: string): Promise<RowResult<PortalLink | null>> {
  const client = portalClient();
  if (!client) return notConfigured();
  const { data, error } = await client.rpc("get_project_portal_link", { p_project_id: projectId });
  if (error) {
    logPortalError("get link", error);
    return { data: null, error: describeError(error) };
  }
  if (data === null) return { data: null, error: null };
  const link = readPortalLink(data);
  if (!link || "token" in link) {
    console.error("[client-portal] get link returned an invalid response", data);
    return { data: null, error: "The portal link could not be loaded. Please try again." };
  }
  return { data: link, error: null };
}

export async function revokeProjectPortalLink(portalLinkId: string): Promise<DeleteResult> {
  const client = portalClient();
  if (!client) return { error: NOT_CONFIGURED };
  const { error } = await client.rpc("revoke_project_portal_link", { p_portal_link_id: portalLinkId });
  if (error) {
    logPortalError("revoke link", error);
    return { error: describeError(error) };
  }
  return { error: null };
}

export interface ClientPortalLookup { data: ClientPortalData | null; error: string | null; }

export async function fetchClientPortal(token: string): Promise<ClientPortalLookup> {
  const client = portalClient();
  if (!client) return { data: null, error: NOT_CONFIGURED };
  const { data, error } = await client.rpc("get_client_portal", { p_token: token });
  if (error) {
    logPortalError("read portal", error);
    return { data: null, error: "This secure link is unavailable. Ask your studio for a new link." };
  }
  if (data === null) return { data: null, error: null };
  const portal = readClientPortal(data);
  if (!portal) {
    console.error("[client-portal] read portal returned an invalid response", data);
    return { data: null, error: "This secure link is unavailable. Ask your studio for a new link." };
  }
  return { data: portal, error: null };
}

export async function submitClientDeliverableDecision(
  token: string,
  deliverableId: string,
  action: ClientDeliverableDecision,
): Promise<RowResult<{ id: string; status: ClientDeliverableDecision; updated_at: string }>> {
  const client = portalClient();
  if (!client) return notConfigured();
  const { data, error } = await client.rpc("submit_client_deliverable_decision", {
    p_token: token, p_deliverable_id: deliverableId, p_action: action,
  });
  if (error) {
    logPortalError("submit decision", error);
    return { data: null, error: "Your decision could not be saved. Please refresh and try again." };
  }
  const row = asRecord(data); const id = asString(row?.id); const status = asString(row?.status); const updatedAt = asString(row?.updated_at);
  if (!id || !updatedAt || (status !== "approved" && status !== "changes_requested")) {
    return { data: null, error: "This deliverable is no longer available for review. Please refresh the page." };
  }
  return { data: { id, status, updated_at: updatedAt }, error: null };
}

/* ── hooks ─────────────────────────────────────────────────────────────── */

interface ListHook<T> {
  rows: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function useWorkspaceList<T>(
  workspaceId: string | null,
  fetcher: (workspaceId: string) => Promise<ListResult<T>>,
): ListHook<T> {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!workspaceId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    let live = true;
    setLoading(true);
    setError(null);
    fetcher(workspaceId).then((res) => {
      if (!live) return;
      setRows(res.data ?? []);
      setError(res.error);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [workspaceId, nonce, fetcher]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { rows, loading, error, refresh };
}

const stableFetchClients = fetchClients;
const stableFetchProjects = fetchProjects;

/** All clients in the active workspace, sorted by name. */
export function useClients(workspaceId: string | null): ListHook<Client> {
  return useWorkspaceList(workspaceId, stableFetchClients);
}

/** All projects in the active workspace, newest first. */
export function useProjects(workspaceId: string | null): ListHook<Project> {
  return useWorkspaceList(workspaceId, stableFetchProjects);
}

/** Deliverables for one project in the active workspace, newest activity first. */
export function useDeliverables(
  workspaceId: string | null,
  projectId: string | undefined,
  includeArchived = false,
): ListHook<Deliverable> {
  const [rows, setRows] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!workspaceId || !projectId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    let live = true;
    setLoading(true);
    setError(null);
    fetchDeliverables(workspaceId, projectId, includeArchived).then((res) => {
      if (!live) return;
      setRows(res.data ?? []);
      setError(res.error);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [workspaceId, projectId, includeArchived, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { rows, loading, error, refresh };
}

interface ProjectHook {
  project: Project | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  refresh: () => void;
}

/** A single project by id, scoped to the active workspace. */
export function useProject(
  workspaceId: string | null,
  projectId: string | undefined,
): ProjectHook {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!workspaceId || !projectId) {
      setProject(null);
      setNotFound(!projectId);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    setError(null);
    setNotFound(false);
    fetchProject(workspaceId, projectId).then((res) => {
      if (!live) return;
      setProject(res.data);
      setError(res.error);
      setNotFound(res.notFound);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [workspaceId, projectId, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { project, loading, error, notFound, refresh };
}

/* ── small display helpers ─────────────────────────────────────────────── */

export const PROJECT_STATUSES: ProjectStatus[] = [
  "draft",
  "active",
  "waiting_review",
  "approved",
  "archived",
];

export const CLIENT_STATUSES: ClientStatus[] = ["active", "archived"];

export const DELIVERABLE_STATUS_ORDER: DeliverableStatus[] = [...DELIVERABLE_STATUSES];

export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** True when a date-only ISO string is before today (local time). */
export function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false;
  const d = new Date(`${dueDate.slice(0, 10)}T23:59:59`);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

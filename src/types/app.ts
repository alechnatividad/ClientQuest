import type { Tables } from "./database";

/**
 * Application-facing aliases for the current ClientQuest workflow.
 *
 * Database shapes remain generated directly from Supabase in database.ts.
 * Role and status values stay aligned with the generated database columns.
 */
export type Workspace = Tables<"workspaces">;
export type Client = Tables<"clients">;
export type Project = Tables<"projects">;

export type WorkspaceMemberRole = Tables<"workspace_members">["role"];
export type ClientStatus = Client["status"];
export type ProjectStatus = Project["status"];

/**
 * ClientQuest database types — Phase 2A core schema.
 *
 * IMPORTANT: these types are MANUALLY DERIVED from
 * `supabase/migrations/20260216120000_phase2a_core_schema.sql`.
 * They were NOT generated from a live Supabase project.
 *
 * Once the migration has been applied, regenerate the official types with:
 *
 *   supabase gen types typescript --linked > src/types/database.ts
 *
 * (or `--local` for a local stack, or `--project-id <ref>` for a specific
 * project). Regenerating will replace this file with remote-derived types.
 *
 * Notes on the derivation:
 *  - `uuid` and `timestamptz`/`date` columns map to `string` (ISO values).
 *  - Role/status columns are `text` with CHECK constraints in Postgres; the
 *    union types below are a frontend convenience that mirrors those checks.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** CHECK workspace_members_role_check */
export type WorkspaceMemberRole = "owner" | "admin" | "member";
/** CHECK clients_status_check */
export type ClientStatus = "active" | "archived";
/** CHECK projects_status_check */
export type ProjectStatus = "draft" | "active" | "waiting_review" | "approved" | "archived";

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: WorkspaceMemberRole;
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role: WorkspaceMemberRole;
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceMemberRole;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          email: string | null;
          company: string | null;
          notes: string | null;
          status: ClientStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          email?: string | null;
          company?: string | null;
          notes?: string | null;
          status?: ClientStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          email?: string | null;
          company?: string | null;
          notes?: string | null;
          status?: ClientStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          workspace_id: string;
          client_id: string | null;
          name: string;
          description: string | null;
          status: ProjectStatus;
          due_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          client_id?: string | null;
          name: string;
          description?: string | null;
          status?: ProjectStatus;
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          client_id?: string | null;
          name?: string;
          description?: string | null;
          status?: ProjectStatus;
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_client_id_workspace_id_fkey";
            columns: ["client_id", "workspace_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id", "workspace_id"];
          },
          {
            foreignKeyName: "projects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_workspace_member: {
        Args: { workspace_id: string };
        Returns: boolean;
      };
      is_workspace_owner: {
        Args: { workspace_id: string };
        Returns: boolean;
      };
      can_manage_workspace: {
        Args: { workspace_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/* ── convenience aliases ─────────────────────────────────────────────────── */

export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMember = Database["public"]["Tables"]["workspace_members"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];

export type WorkspaceInsert = Database["public"]["Tables"]["workspaces"]["Insert"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];

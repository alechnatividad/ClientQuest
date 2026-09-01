/**
 * Phase 2C application contract for the pending deliverables migration.
 *
 * `src/types/database.ts` remains generated from the live schema and is not
 * edited here. After the migration is approved and applied, regenerate it and
 * replace this temporary migration-aligned contract with generated aliases.
 */
export const DELIVERABLE_STATUSES = [
  "draft",
  "ready_for_review",
  "changes_requested",
  "approved",
] as const;

export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export interface Deliverable {
  id: string;
  workspace_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  external_url: string | null;
  version: number;
  created_by: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

/*
  Phase 2C — Deliverables + approval workflow

  This migration is intentionally NOT applied by this branch. It preserves the
  Phase 2A tenancy model: every deliverable belongs to one workspace and its
  project must belong to that same workspace.
*/

begin;

/* A composite key is required for the deliverables-to-projects tenancy FK. */
alter table public.projects
  add constraint projects_id_workspace_id_key unique (id, workspace_id);

create table public.deliverables (
  id           uuid        primary key default gen_random_uuid(),
  workspace_id uuid        not null references public.workspaces (id) on delete cascade,
  project_id   uuid        not null,
  title        text        not null,
  description  text,
  status       text        not null default 'draft',
  external_url text,
  version      integer     not null default 1,
  created_by   uuid        references auth.users (id),
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint deliverables_status_check
    check (status in ('draft', 'ready_for_review', 'changes_requested', 'approved')),
  constraint deliverables_version_check
    check (version > 0),
  constraint deliverables_external_url_check
    check (external_url is null or external_url ~* '^https?://'),

  /*
    A deliverable's workspace_id is part of this FK. A valid project id from
    another workspace cannot satisfy it, even if a caller has memberships in
    both workspaces.
  */
  constraint deliverables_project_id_workspace_id_fkey
    foreign key (project_id, workspace_id)
    references public.projects (id, workspace_id)
    on delete cascade
);

/* Project workspace reads, approval queues, and the usual workspace list. */
create index deliverables_workspace_project_updated_at_idx
  on public.deliverables (workspace_id, project_id, updated_at desc);

create index deliverables_workspace_status_updated_at_idx
  on public.deliverables (workspace_id, status, updated_at desc)
  where archived_at is null;

/* Reuse the existing timestamp and immutable-tenancy/audit guards. */
create trigger deliverables_set_updated_at
  before update on public.deliverables
  for each row execute function public.set_updated_at();

create trigger deliverables_guard_workspace_id
  before update on public.deliverables
  for each row execute function public.guard_workspace_id();

create trigger deliverables_guard_created_by
  before update on public.deliverables
  for each row execute function public.guard_created_by();

/* Match existing client/project access. No anon privilege is granted. */
grant select, insert, update, delete on public.deliverables to authenticated;
grant select, insert, update, delete on public.deliverables to service_role;
revoke all on public.deliverables from anon;

alter table public.deliverables enable row level security;

create policy deliverables_select_member on public.deliverables
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy deliverables_insert_member on public.deliverables
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and (created_by is null or created_by = auth.uid())
  );

create policy deliverables_update_member on public.deliverables
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy deliverables_delete_managers on public.deliverables
  for delete to authenticated
  using (public.can_manage_workspace(workspace_id));

commit;

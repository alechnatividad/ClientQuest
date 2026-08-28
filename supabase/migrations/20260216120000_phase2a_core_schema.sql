/*
  ─────────────────────────────────────────────────────────────────────────────
  ClientQuest — Phase 2A: core schema + row level security
  ─────────────────────────────────────────────────────────────────────────────

  Creates the multi-workspace foundation:

    workspaces          one per owner account (studio / freelancer)
    workspace_members   (workspace_id, user_id) composite PK, roles via CHECK
    clients             non-authenticated people the studio ships for
    projects            deliverable containers; must stay inside one workspace

  Plus:
    - one reusable `set_updated_at()` trigger function (no duplicated logic)
    - automatic owner membership on workspace creation (trigger)
    - SECURITY DEFINER authorization helpers with a fixed search_path
      (prevents recursive RLS policy evaluation)
    - RLS on all four tables — members-only access, no anon policies
    - composite foreign key (client_id, workspace_id) -> clients(id, workspace_id)
      making cross-workspace client references structurally impossible

  SAFETY
    - Purely additive. Safe to run ONCE on a fresh ClientQuest Supabase project.
    - Contains no destructive statements (no DROP / TRUNCATE / ALTER ... OWNER).
    - Review before applying. Apply with `supabase db push` or by pasting into
      the Supabase SQL editor.

  NOTE ON client deletion
    The composite FK uses the default ON DELETE NO ACTION (checked at statement
    end). Deleting a workspace cascades cleanly to members/clients/projects.
    Deleting a single client that still has projects referencing it is blocked
    until those projects are reassigned — deliberate, to avoid silent data loss.
  ─────────────────────────────────────────────────────────────────────────────
*/


/* ── 1. tables ─────────────────────────────────────────────────────────────── */

create table public.workspaces (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  slug       text,
  owner_id   uuid        not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid        not null references public.workspaces (id) on delete cascade,
  user_id      uuid        not null references auth.users (id)       on delete cascade,
  role         text        not null,
  created_at   timestamptz not null default now(),

  primary key (workspace_id, user_id),

  -- CHECK (not an enum) so the role set can evolve with a simple migration.
  constraint workspace_members_role_check
    check (role in ('owner', 'admin', 'member'))
);

create table public.clients (
  id           uuid        primary key default gen_random_uuid(),
  workspace_id uuid        not null references public.workspaces (id) on delete cascade,
  name         text        not null,
  email        text,
  company      text,
  notes        text,
  status       text        not null default 'active',
  created_by   uuid        references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint clients_status_check
    check (status in ('active', 'archived')),

  -- Target for the composite FK from projects (see below).
  constraint clients_id_workspace_id_key unique (id, workspace_id)
);

create table public.projects (
  id           uuid        primary key default gen_random_uuid(),
  workspace_id uuid        not null references public.workspaces (id) on delete cascade,
  client_id    uuid,
  name         text        not null,
  description  text,
  status       text        not null default 'draft',
  due_date     date,
  created_by   uuid        references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint projects_status_check
    check (status in ('draft', 'active', 'waiting_review', 'approved', 'archived')),

  -- A project may exist without a client (client_id nullable; a null column
  -- short-circuits the FK check), but WHEN a client is referenced it must
  -- belong to the SAME workspace as the project. Enforced at the database
  -- level, independent of application code. Default NO ACTION is checked at
  -- statement end, so workspace cascades still resolve cleanly.
  constraint projects_client_id_workspace_id_fkey
    foreign key (client_id, workspace_id)
    references public.clients (id, workspace_id)
);


/* ── 2. indexes ────────────────────────────────────────────────────────────── */

-- slug is unique when present (partial index; nulls are unconstrained).
create unique index workspaces_slug_unique_idx
  on public.workspaces (slug)
  where slug is not null;

create index workspaces_owner_id_idx
  on public.workspaces (owner_id);

-- (workspace_id) is already indexed via the composite primary key;
-- user_id needs its own index for "which workspaces am I in" lookups.
create index workspace_members_user_id_idx
  on public.workspace_members (user_id);

create index clients_workspace_id_idx
  on public.clients (workspace_id);

create index clients_email_idx
  on public.clients (email);

-- Composite (workspace_id, status) covers both plain workspace scans and
-- status-filtered board queries, avoiding a low-cardinality status-only index.
create index projects_workspace_id_status_idx
  on public.projects (workspace_id, status);

create index projects_client_id_idx
  on public.projects (client_id);


/* ── 3. updated_at automation (one reusable function) ──────────────────────── */

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();


/* ── 4. authorization helpers ────────────────────────────────────────────────
  SECURITY DEFINER + fixed search_path + auth.uid() only.
  Never accepts a caller-supplied user id, and because they run as the table
  owner they read membership WITHOUT re-entering RLS — no recursive policy
  evaluation.
*/

create or replace function public.is_workspace_member(workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = is_workspace_member.workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = is_workspace_owner.workspace_id
      and w.owner_id = auth.uid()
  );
$$;

create or replace function public.can_manage_workspace(workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = can_manage_workspace.workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('owner', 'admin')
  );
$$;


/* ── 5. automatic owner membership ───────────────────────────────────────────
  Runs as the table owner (SECURITY DEFINER) so it bypasses workspace_members
  RLS — necessary because at insert time no membership row exists yet.
  Safe: the workspaces INSERT policy (below) forces owner_id = auth.uid(),
  so this trigger can only ever grant membership in a workspace the current
  user just created as their own.
*/

create or replace function public.handle_workspace_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger workspaces_owner_membership
  after insert on public.workspaces
  for each row execute function public.handle_workspace_created();


/* ── 6. grants ───────────────────────────────────────────────────────────────
  Deliberately NO grants to anon. service_role bypasses RLS by design and is
  only ever used server-side.
*/

grant select, insert, update, delete on public.workspaces        to authenticated;
grant select                         on public.workspace_members to authenticated;
grant select, insert, update, delete on public.clients           to authenticated;
grant select, insert, update, delete on public.projects          to authenticated;

grant select, insert, update, delete on public.workspaces        to service_role;
grant select, insert, update, delete on public.workspace_members to service_role;
grant select, insert, update, delete on public.clients           to service_role;
grant select, insert, update, delete on public.projects          to service_role;

grant execute on function public.is_workspace_member(uuid)  to authenticated;
grant execute on function public.is_workspace_owner(uuid)   to authenticated;
grant execute on function public.can_manage_workspace(uuid) to authenticated;


/* ── 7. row level security ─────────────────────────────────────────────────── */

alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients           enable row level security;
alter table public.projects          enable row level security;

/* workspaces: members read; anyone authenticated may create their own;
   owners/admins update metadata; only the owner deletes. */
create policy workspaces_select_member on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));

create policy workspaces_insert_own on public.workspaces
  for insert to authenticated
  with check (owner_id = auth.uid());

create policy workspaces_update_managers on public.workspaces
  for update to authenticated
  using (public.can_manage_workspace(id))
  with check (public.can_manage_workspace(id));

create policy workspaces_delete_owner on public.workspaces
  for delete to authenticated
  using (public.is_workspace_owner(id));

/* workspace_members: members see their workspace's roster.
   NO insert/update/delete policies this phase — membership can only be
   created by the owner-membership trigger above. Member management
   (invitations, role changes) lands in Phase 2B. */
create policy workspace_members_select_member on public.workspace_members
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

/* clients: members read/create/update within their workspace;
   created_by may only be the caller when supplied; owners/admins delete. */
create policy clients_select_member on public.clients
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy clients_insert_member on public.clients
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and (created_by is null or created_by = auth.uid())
  );

create policy clients_update_member on public.clients
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy clients_delete_managers on public.clients
  for delete to authenticated
  using (public.can_manage_workspace(workspace_id));

/* projects: same shape as clients. */
create policy projects_select_member on public.projects
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy projects_insert_member on public.projects
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and (created_by is null or created_by = auth.uid())
  );

create policy projects_update_member on public.projects
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy projects_delete_managers on public.projects
  for delete to authenticated
  using (public.can_manage_workspace(workspace_id));

/* ─────────────────────────────────────────────────────────────────────────────
  End of Phase 2A migration.
  Verify with: supabase/tests/phase2a_rls_test_plan.sql
  ───────────────────────────────────────────────────────────────────────────── */

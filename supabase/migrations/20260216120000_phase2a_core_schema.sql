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
    - BEFORE UPDATE immutability guards that REJECT (raise, never silently
      rewrite) changes to:
        workspaces.owner_id   — no privilege escalation via UPDATE; ownership
                                transfer is deliberately out of scope for 2A
        clients.workspace_id  — a row can never move between workspaces, even
        projects.workspace_id   when the caller belongs to both
        clients.created_by    — audit fields frozen after INSERT
        projects.created_by
    - SECURITY DEFINER authorization helpers explicitly revoked from PUBLIC
      and granted to authenticated only (never anon)
    - all four tables explicitly revoked from anon (defense in depth on top
      of RLS — no table grant can leak to unauthenticated callers)

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


/* ── 6. immutability guards (tenancy & audit integrity) ──────────────────────
   BEFORE UPDATE trigger functions that RAISE — a rejected statement is rolled
   back in full; nothing is silently rewritten.

   These close three escalation/tampering paths that RLS alone cannot express:

     workspaces.owner_id    the update policy lets owners/admins edit workspace
                            metadata; without this guard an admin could set
                            owner_id to themselves and become the effective
                            owner. Ownership transfer is NOT implemented in 2A.
                            (name/slug remain editable by owners/admins.)
     clients.workspace_id   tenancy is fixed at INSERT. Even a user who belongs
     projects.workspace_id  to BOTH workspaces cannot move a row across the
                            boundary with an UPDATE.
     clients.created_by     audit provenance is frozen after INSERT — an update
     projects.created_by    may not reattribute who created a record.

   Each guard compares with IS DISTINCT FROM so NULL transitions are caught
   too. Plain SECURITY INVOKER functions — RLS has already restricted who can
   reach the UPDATE, and the trigger runs inside the same statement/role.
*/

create or replace function public.guard_workspace_owner_id()
returns trigger
language plpgsql
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception
      'workspaces.owner_id is immutable. Ownership transfer is not supported in this phase.';
  end if;
  return new;
end;
$$;

create trigger workspaces_guard_owner_id
  before update on public.workspaces
  for each row execute function public.guard_workspace_owner_id();

create or replace function public.guard_workspace_id()
returns trigger
language plpgsql
as $$
begin
  if new.workspace_id is distinct from old.workspace_id then
    raise exception
      'workspace_id is immutable. Rows cannot be moved between workspaces.';
  end if;
  return new;
end;
$$;

create trigger clients_guard_workspace_id
  before update on public.clients
  for each row execute function public.guard_workspace_id();

create trigger projects_guard_workspace_id
  before update on public.projects
  for each row execute function public.guard_workspace_id();

create or replace function public.guard_created_by()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception
      'created_by is immutable after creation.';
  end if;
  return new;
end;
$$;

create trigger clients_guard_created_by
  before update on public.clients
  for each row execute function public.guard_created_by();

create trigger projects_guard_created_by
  before update on public.projects
  for each row execute function public.guard_created_by();


/* ── 7. grants ───────────────────────────────────────────────────────────────
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
-- Defense in depth: anon receives no table privileges.
revoke all on public.workspaces from anon;
revoke all on public.workspace_members from anon;
revoke all on public.clients from anon;
revoke all on public.projects from anon;
-- SECURITY DEFINER helpers: strip the default PUBLIC execute grant first,
-- then explicitly allow authenticated callers only. Never exposed to anon.
revoke execute on function public.is_workspace_member(uuid)  from public;
revoke execute on function public.is_workspace_owner(uuid)   from public;
revoke execute on function public.can_manage_workspace(uuid) from public;

grant execute on function public.is_workspace_member(uuid)  to authenticated;
grant execute on function public.is_workspace_owner(uuid)   to authenticated;
grant execute on function public.can_manage_workspace(uuid) to authenticated;

-- Defense in depth: explicitly deny every table privilege to anon. RLS alone
-- would already block unauthenticated access; these revokes guarantee that no
-- table grant can ever leak through to the anon role.
revoke all on public.workspaces        from anon;
revoke all on public.workspace_members from anon;
revoke all on public.clients           from anon;
revoke all on public.projects          from anon;


/* ── 8. row level security ─────────────────────────────────────────────────── */

alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.clients           enable row level security;
alter table public.projects          enable row level security;

/* workspaces: members read; anyone authenticated may create their own;
   owners/admins update metadata (name/slug — owner_id itself is frozen by
   the guard trigger in section 6, so the update policy cannot be abused to
   transfer ownership); only the owner deletes. */
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

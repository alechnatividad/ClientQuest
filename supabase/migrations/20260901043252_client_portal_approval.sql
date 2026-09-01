/*
  Phase 3 — Client portal links + client approval decisions

  Adds the smallest secure client-facing layer on top of the Phase 2A tenancy
  model and Phase 2C deliverables. No existing table, policy, trigger, or
  helper is altered. Portal visitors receive an opaque, high-entropy link;
  only a SHA-256 hash is stored at rest.

  Safety notes
  - Purely additive. No data is changed or deleted.
  - `pgcrypto` is already installed in the `extensions` schema and is used only
    to hash portal tokens.
  - The composite FKs keep link project/client rows in one workspace. A trigger
    additionally verifies that the linked project is assigned to that client.
  - All portal reads and decisions go through narrow SECURITY DEFINER RPCs
    with a fixed search_path. There are no anonymous table grants or policies.
*/

begin;

/* ── 1. portal link and immutable approval audit tables ─────────────────── */

create table public.project_portal_links (
  id           uuid        primary key default gen_random_uuid(),
  workspace_id uuid        not null references public.workspaces (id) on delete cascade,
  project_id   uuid        not null,
  client_id    uuid        not null,
  token_hash   text        not null unique,
  created_by   uuid        not null references auth.users (id),
  revoked_at   timestamptz,
  created_at   timestamptz not null default now(),

  constraint project_portal_links_project_id_workspace_id_fkey
    foreign key (project_id, workspace_id)
    references public.projects (id, workspace_id)
    on delete cascade,
  constraint project_portal_links_client_id_workspace_id_fkey
    foreign key (client_id, workspace_id)
    references public.clients (id, workspace_id)
    on delete cascade,
  constraint project_portal_links_token_hash_check
    check (token_hash ~ '^[0-9a-f]{64}$')
);

/* There is one active client link per project. Regenerating revokes the old
   link before issuing a new token, so a copied URL can be deliberately
   invalidated without exposing or storing its raw token. */
create unique index project_portal_links_one_active_project_idx
  on public.project_portal_links (project_id)
  where revoked_at is null;

create index project_portal_links_workspace_project_idx
  on public.project_portal_links (workspace_id, project_id, created_at desc);

create index project_portal_links_active_token_hash_idx
  on public.project_portal_links (token_hash)
  where revoked_at is null;

create table public.deliverable_approval_events (
  id             uuid        primary key default gen_random_uuid(),
  workspace_id   uuid        not null references public.workspaces (id) on delete cascade,
  project_id     uuid        not null,
  client_id      uuid        not null,
  deliverable_id uuid        not null references public.deliverables (id) on delete cascade,
  portal_link_id uuid        not null references public.project_portal_links (id) on delete cascade,
  action         text        not null,
  created_at     timestamptz not null default now(),

  constraint deliverable_approval_events_project_id_workspace_id_fkey
    foreign key (project_id, workspace_id)
    references public.projects (id, workspace_id)
    on delete cascade,
  constraint deliverable_approval_events_client_id_workspace_id_fkey
    foreign key (client_id, workspace_id)
    references public.clients (id, workspace_id)
    on delete cascade,
  constraint deliverable_approval_events_action_check
    check (action in ('approved', 'changes_requested'))
);

create index deliverable_approval_events_workspace_project_created_at_idx
  on public.deliverable_approval_events (workspace_id, project_id, created_at desc);

create index deliverable_approval_events_deliverable_created_at_idx
  on public.deliverable_approval_events (deliverable_id, created_at desc);

/* ── 2. integrity guards ───────────────────────────────────────────────── */

/* A project link can only ever target the client assigned to the project.
   This closes the cross-table relationship that a pair of composite FKs alone
   cannot express. */
create function public.guard_project_portal_link_client()
returns trigger
language plpgsql
as $$
declare
  v_project_client_id uuid;
begin
  select p.client_id
    into v_project_client_id
  from public.projects p
  where p.id = new.project_id
    and p.workspace_id = new.workspace_id;

  if v_project_client_id is null or v_project_client_id is distinct from new.client_id then
    raise exception 'Portal links must use the client assigned to their project.';
  end if;

  return new;
end;
$$;

create trigger project_portal_links_guard_project_client
  before insert or update on public.project_portal_links
  for each row execute function public.guard_project_portal_link_client();

/* Reuse Phase 2A tenancy and provenance guards, then freeze the remaining
   security-sensitive fields. Revocation is intentionally the only mutable
   business field. */
create trigger project_portal_links_guard_workspace_id
  before update on public.project_portal_links
  for each row execute function public.guard_workspace_id();

create trigger project_portal_links_guard_created_by
  before update on public.project_portal_links
  for each row execute function public.guard_created_by();

create function public.guard_project_portal_link_fields()
returns trigger
language plpgsql
as $$
begin
  if new.project_id is distinct from old.project_id
    or new.client_id is distinct from old.client_id
    or new.token_hash is distinct from old.token_hash then
    raise exception 'Portal link project, client, and token hash are immutable.';
  end if;

  return new;
end;
$$;

create trigger project_portal_links_guard_fields
  before update on public.project_portal_links
  for each row execute function public.guard_project_portal_link_fields();

/* Events are only written through the decision RPC. This guard verifies all
   supplied ids point to the same active portal context, independently of the
   application and of the RPC's own checks. */
create function public.guard_deliverable_approval_event_context()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.project_portal_links%rowtype;
  v_deliverable public.deliverables%rowtype;
begin
  select * into v_link
  from public.project_portal_links l
  where l.id = new.portal_link_id
    and l.revoked_at is null;

  if not found
    or v_link.workspace_id is distinct from new.workspace_id
    or v_link.project_id is distinct from new.project_id
    or v_link.client_id is distinct from new.client_id then
    raise exception 'Approval event portal context is invalid.';
  end if;

  select * into v_deliverable
  from public.deliverables d
  where d.id = new.deliverable_id;

  if not found
    or v_deliverable.workspace_id is distinct from new.workspace_id
    or v_deliverable.project_id is distinct from new.project_id
    or v_deliverable.archived_at is not null then
    raise exception 'Approval event deliverable is outside the portal project.';
  end if;

  return new;
end;
$$;

create trigger deliverable_approval_events_guard_context
  before insert on public.deliverable_approval_events
  for each row execute function public.guard_deliverable_approval_event_context();

/* ── 3. narrow portal RPCs ─────────────────────────────────────────────── */

/* Managers can generate a fresh one-project link. The raw token is returned
   once and is never persisted; only its SHA-256 hash reaches the table. */
create function public.create_project_portal_link(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_project public.projects%rowtype;
  v_token text;
  v_token_hash text;
  v_link public.project_portal_links%rowtype;
begin
  select * into v_project
  from public.projects p
  where p.id = p_project_id
  for update;

  if not found or not public.can_manage_workspace(v_project.workspace_id) then
    raise exception 'You do not have permission to create a portal link for this project.'
      using errcode = '42501';
  end if;

  if v_project.client_id is null then
    raise exception 'Attach a client to this project before creating a portal link.'
      using errcode = '23514';
  end if;

  update public.project_portal_links
  set revoked_at = now()
  where project_id = v_project.id
    and revoked_at is null;

  v_token := replace(gen_random_uuid()::text, '-', '')
    || replace(gen_random_uuid()::text, '-', '');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  insert into public.project_portal_links (
    workspace_id, project_id, client_id, token_hash, created_by
  ) values (
    v_project.workspace_id, v_project.id, v_project.client_id, v_token_hash, auth.uid()
  )
  returning * into v_link;

  return jsonb_build_object(
    'id', v_link.id,
    'token', v_token,
    'created_at', v_link.created_at
  );
end;
$$;

/* Managers can inspect link state without ever reading token_hash. */
create function public.get_project_portal_link(p_project_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.project_portal_links%rowtype;
begin
  select l.* into v_link
  from public.project_portal_links l
  join public.projects p on p.id = l.project_id and p.workspace_id = l.workspace_id
  where l.project_id = p_project_id
    and l.revoked_at is null
    and public.can_manage_workspace(p.workspace_id)
  order by l.created_at desc
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_link.id,
    'project_id', v_link.project_id,
    'client_id', v_link.client_id,
    'created_at', v_link.created_at
  );
end;
$$;

create function public.revoke_project_portal_link(p_portal_link_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
begin
  select l.workspace_id into v_workspace_id
  from public.project_portal_links l
  where l.id = p_portal_link_id
    and l.revoked_at is null
  for update;

  if not found or not public.can_manage_workspace(v_workspace_id) then
    raise exception 'You do not have permission to revoke this portal link.'
      using errcode = '42501';
  end if;

  update public.project_portal_links
  set revoked_at = now()
  where id = p_portal_link_id;
end;
$$;

/* A portal visitor can only read the project and non-archived deliverables
   bound to the one active link matching their token. Draft deliverables stay
   owner-only. Invalid, revoked, or malformed tokens all return null. */
create function public.get_client_portal(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_link public.project_portal_links%rowtype;
  v_portal jsonb;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return null;
  end if;

  select * into v_link
  from public.project_portal_links l
  where l.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and l.revoked_at is null;

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'project', jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'description', p.description
    ),
    'client', jsonb_build_object(
      'name', c.name,
      'company', c.company
    ),
    'deliverables', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'title', d.title,
          'description', d.description,
          'status', d.status,
          'external_url', d.external_url,
          'version', d.version,
          'updated_at', d.updated_at
        ) order by d.updated_at desc
      ) filter (where d.id is not null),
      '[]'::jsonb
    )
  ) into v_portal
  from public.projects p
  join public.clients c
    on c.id = v_link.client_id
    and c.workspace_id = v_link.workspace_id
  left join public.deliverables d
    on d.project_id = p.id
    and d.workspace_id = p.workspace_id
    and d.archived_at is null
    and d.status in ('ready_for_review', 'changes_requested', 'approved')
  where p.id = v_link.project_id
    and p.workspace_id = v_link.workspace_id
    and p.client_id = v_link.client_id
  group by p.id, p.name, p.description, c.name, c.company;

  return v_portal;
end;
$$;

/* The portal token is the sole client credential. A decision is accepted only
   for an active-link deliverable currently ready for review, then atomically
   updates its Phase 2C status and records an immutable audit event. */
create function public.submit_client_deliverable_decision(
  p_token text,
  p_deliverable_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_link public.project_portal_links%rowtype;
  v_deliverable public.deliverables%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$'
    or p_action not in ('approved', 'changes_requested') then
    return null;
  end if;

  select * into v_link
  from public.project_portal_links l
  where l.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
    and l.revoked_at is null
  for update;

  if not found then
    return null;
  end if;

  update public.deliverables
  set status = p_action
  where id = p_deliverable_id
    and workspace_id = v_link.workspace_id
    and project_id = v_link.project_id
    and archived_at is null
    and status = 'ready_for_review'
  returning * into v_deliverable;

  if not found then
    return null;
  end if;

  insert into public.deliverable_approval_events (
    workspace_id, project_id, client_id, deliverable_id, portal_link_id, action
  ) values (
    v_link.workspace_id, v_link.project_id, v_link.client_id,
    v_deliverable.id, v_link.id, p_action
  );

  return jsonb_build_object(
    'id', v_deliverable.id,
    'status', v_deliverable.status,
    'updated_at', v_deliverable.updated_at
  );
end;
$$;

/* ── 4. grants + RLS ──────────────────────────────────────────────────── */

/* No direct anonymous access exists. Authenticated users can only select the
   owner-facing audit tables through workspace RLS; mutations are RPC-only. */
grant select on public.project_portal_links to authenticated;
grant select on public.deliverable_approval_events to authenticated;
grant select, insert, update, delete on public.project_portal_links to service_role;
grant select, insert, update, delete on public.deliverable_approval_events to service_role;
revoke all on public.project_portal_links from anon;
revoke all on public.deliverable_approval_events from anon;

alter table public.project_portal_links enable row level security;
alter table public.deliverable_approval_events enable row level security;

create policy project_portal_links_select_managers on public.project_portal_links
  for select to authenticated
  using (public.can_manage_workspace(workspace_id));

create policy deliverable_approval_events_select_member on public.deliverable_approval_events
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

revoke all on function public.create_project_portal_link(uuid) from public;
revoke all on function public.get_project_portal_link(uuid) from public;
revoke all on function public.revoke_project_portal_link(uuid) from public;
revoke all on function public.get_client_portal(text) from public;
revoke all on function public.submit_client_deliverable_decision(text, uuid, text) from public;

grant execute on function public.create_project_portal_link(uuid) to authenticated;
grant execute on function public.get_project_portal_link(uuid) to authenticated;
grant execute on function public.revoke_project_portal_link(uuid) to authenticated;
grant execute on function public.get_client_portal(text) to anon, authenticated;
grant execute on function public.submit_client_deliverable_decision(text, uuid, text) to anon, authenticated;

commit;

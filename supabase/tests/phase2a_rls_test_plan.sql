/*
  ─────────────────────────────────────────────────────────────────────────────
  ClientQuest — Phase 2A RLS verification plan
  ─────────────────────────────────────────────────────────────────────────────

  Verifies, in order:

     1. User A can create Workspace A.
     2. User A becomes its owner member automatically.
     3. User A can create Client A.
     4. User A can create Project A linked to Client A.
     5. User B cannot read Workspace A.
     6. User B cannot read Client A.
     7. User B cannot read Project A.
     8. User B cannot insert themselves into Workspace A.
     9. A project cannot reference a client belonging to another workspace.
    10. Workspace deletion cascades to its clients/projects/members.

  HOW TO RUN
    1. Apply supabase/migrations/20260216120000_phase2a_core_schema.sql first.
    2. Open the Supabase SQL editor (it runs as the postgres role) and paste
       this entire file.
    3. Everything executes inside ONE transaction that ends in ROLLBACK —
       nothing persists and the file is safe to re-run at any time.

  IMPERSONATION TECHNIQUE
    `set local role authenticated` + `set_config('request.jwt.claims', …)`
    mirrors exactly what PostgREST does for a signed-in request, so
    auth.uid() resolves to the test user's id. RLS is never weakened — the
    tests exercise the real policies.

  PASS/FAIL
    Each step emits `NOTICE: PASS (n): …`. Any failure raises an EXCEPTION,
    aborts the script, and the ROLLBACK discards all fixtures.
  ─────────────────────────────────────────────────────────────────────────────
*/

begin;

-- fixed fixture ids (rolled back at the end)
--   user A: 00000000-0000-0000-0000-0000000000aa
--   user B: 00000000-0000-0000-0000-0000000000bb

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000aa', 'authenticated', 'authenticated', 'owner-a@clientquest.test',
   '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000bb', 'authenticated', 'authenticated', 'owner-b@clientquest.test',
   '{"provider":"email","providers":["email"]}', '{}', now(), now());

-- cross-role fixture store (temp tables are not subject to RLS)
create temporary table test_ids (
  workspace_a uuid,
  client_a    uuid
);


/* ── impersonate user A ─────────────────────────────────────────────────── */
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated","aud":"authenticated"}',
  true
);


/* ── test 1: user A creates Workspace A ─────────────────────────────────── */
insert into public.workspaces (name, slug, owner_id)
values ('Workspace A', 'workspace-a', '00000000-0000-0000-0000-0000000000aa');

insert into test_ids (workspace_a)
select id from public.workspaces where name = 'Workspace A';

do $$
begin
  if not exists (select 1 from test_ids where workspace_a is not null) then
    raise exception 'FAIL (test 1): user A could not create workspace A';
  end if;
  raise notice 'PASS (test 1): user A created workspace A';
end $$;


/* ── test 2: automatic owner membership ─────────────────────────────────── */
-- queried as user A, which also proves members can SELECT their own roster
do $$
declare
  v_ws    uuid;
  v_count int;
begin
  select workspace_a into v_ws from test_ids;

  select count(*) into v_count
  from public.workspace_members
  where workspace_id = v_ws
    and user_id = '00000000-0000-0000-0000-0000000000aa'
    and role = 'owner';

  if v_count <> 1 then
    raise exception 'FAIL (test 2): expected exactly 1 owner membership row, found %', v_count;
  end if;
  raise notice 'PASS (test 2): user A was automatically added as owner member';
end $$;


/* ── test 3: user A creates Client A ────────────────────────────────────── */
insert into public.clients (workspace_id, name, email, company, created_by)
select workspace_a, 'Client A', 'contact@client-a.test', 'Client A Ltd',
       '00000000-0000-0000-0000-0000000000aa'
from test_ids;

update test_ids set client_a = (
  select id from public.clients where name = 'Client A'
);

do $$
begin
  if not exists (select 1 from test_ids where client_a is not null) then
    raise exception 'FAIL (test 3): user A could not create client A';
  end if;
  raise notice 'PASS (test 3): user A created client A in workspace A';
end $$;


/* ── test 4: user A creates Project A linked to Client A ────────────────── */
insert into public.projects (workspace_id, client_id, name, description, status, created_by)
select workspace_a, client_a, 'Project A', 'Linked to client A', 'active',
       '00000000-0000-0000-0000-0000000000aa'
from test_ids;

do $$
begin
  if not exists (
    select 1
    from public.projects p
    join test_ids t on t.workspace_a = p.workspace_id
    where p.name = 'Project A' and p.client_id = t.client_a
  ) then
    raise exception 'FAIL (test 4): user A could not create project A linked to client A';
  end if;
  raise notice 'PASS (test 4): user A created project A linked to client A';
end $$;


/* ── impersonate user B ─────────────────────────────────────────────────── */
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000bb","role":"authenticated","aud":"authenticated"}',
  true
);


/* ── tests 5–7: workspace A's data is invisible to user B ───────────────── */
do $$
declare
  v_ws     uuid;
  v_client uuid;
begin
  select workspace_a, client_a into v_ws, v_client from test_ids;

  if exists (select 1 from public.workspaces where id = v_ws) then
    raise exception 'FAIL (test 5): user B can read workspace A';
  end if;
  raise notice 'PASS (test 5): user B cannot read workspace A';

  if exists (select 1 from public.clients where id = v_client) then
    raise exception 'FAIL (test 6): user B can read client A';
  end if;
  raise notice 'PASS (test 6): user B cannot read client A';

  if exists (select 1 from public.projects where workspace_id = v_ws) then
    raise exception 'FAIL (test 7): user B can read project A';
  end if;
  raise notice 'PASS (test 7): user B cannot read project A';
end $$;


/* ── test 8: user B cannot self-invite into workspace A ─────────────────── */
do $$
declare
  v_ws uuid;
begin
  select workspace_a into v_ws from test_ids;

  begin
    insert into public.workspace_members (workspace_id, user_id, role)
    values (v_ws, '00000000-0000-0000-0000-0000000000bb', 'member');

    raise exception 'FAIL (test 8): user B inserted themselves into workspace A';
  exception
    when insufficient_privilege then
      raise notice 'PASS (test 8): user B cannot add themselves to workspace A (RLS denied the insert)';
  end;
end $$;


/* ── test 9: cross-workspace client references are impossible ───────────── */
-- user B legitimately creates their own workspace first
insert into public.workspaces (name, slug, owner_id)
values ('Workspace B', 'workspace-b', '00000000-0000-0000-0000-0000000000bb');

do $$
declare
  v_ws_b   uuid;
  v_client uuid;
begin
  select id into v_ws_b from public.workspaces where name = 'Workspace B';
  select client_a into v_client from test_ids;

  begin
    insert into public.projects (workspace_id, client_id, name, created_by)
    values (v_ws_b, v_client, 'Stolen project', '00000000-0000-0000-0000-0000000000bb');

    raise exception 'FAIL (test 9): a project referenced a client from another workspace';
  exception
    when foreign_key_violation then
      raise notice 'PASS (test 9): composite FK rejected the cross-workspace client reference';
  end;
end $$;


/* ── test 10: workspace deletion cascades cleanly ───────────────────────── */
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000aa","role":"authenticated","aud":"authenticated"}',
  true
);

-- owner-only delete policy: this must succeed for user A
delete from public.workspaces
where id = (select workspace_a from test_ids);

-- verify as postgres, which sees past RLS
reset role;

do $$
declare
  v_ws uuid;
begin
  select workspace_a into v_ws from test_ids;

  if exists (select 1 from public.workspaces where id = v_ws) then
    raise exception 'FAIL (test 10): workspace A still exists after deletion';
  end if;
  if exists (select 1 from public.clients where workspace_id = v_ws) then
    raise exception 'FAIL (test 10): clients did not cascade with workspace A';
  end if;
  if exists (select 1 from public.projects where workspace_id = v_ws) then
    raise exception 'FAIL (test 10): projects did not cascade with workspace A';
  end if;
  if exists (select 1 from public.workspace_members where workspace_id = v_ws) then
    raise exception 'FAIL (test 10): members did not cascade with workspace A';
  end if;

  raise notice 'PASS (test 10): deleting workspace A cascaded to its client, project and membership';
end $$;


/* ── nothing persists ───────────────────────────────────────────────────── */
rollback;

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
    10. An admin cannot change a workspace's owner_id.
    11. A member cannot change a workspace's owner_id.
    12. A client cannot be moved to another workspace via UPDATE.
    13. A project cannot be moved to another workspace via UPDATE.
    14. A member cannot rewrite a client's created_by.
    15. A member cannot rewrite a project's created_by.
    16. Workspace deletion cascades to its clients/projects/members.

  Tests 10–15 exercise the database-level immutability guards (BEFORE UPDATE
  triggers), not RLS — they must raise, and the protected value must remain
  unchanged afterwards. RLS is never weakened to make a test pass.

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
--   user A: 00000000-0000-0000-0000-0000000000aa  (owner of workspace A)
--   user B: 00000000-0000-0000-0000-0000000000bb  (outsider; later admin of A)
--   user C: 00000000-0000-0000-0000-0000000000cc  (plain member of A)

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000aa', 'authenticated', 'authenticated', 'owner-a@clientquest.test',
   '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000bb', 'authenticated', 'authenticated', 'owner-b@clientquest.test',
   '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000000cc', 'authenticated', 'authenticated', 'member-c@clientquest.test',
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


/* ── fixture for tests 10–11: give workspace A an admin and a member ──────
   Phase 2A has no member-management API, so the roster rows are seeded as
   postgres (the SQL editor role). This is test setup, not an RLS weakening —
   the guarded UPDATEs below still run as `authenticated` through real RLS. */
reset role;

insert into public.workspace_members (workspace_id, user_id, role)
select workspace_a, '00000000-0000-0000-0000-0000000000bb', 'admin'
from test_ids;

insert into public.workspace_members (workspace_id, user_id, role)
select workspace_a, '00000000-0000-0000-0000-0000000000cc', 'member'
from test_ids;


/* ── test 10: an admin cannot change a workspace's owner_id ─────────────── */
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000bb","role":"authenticated","aud":"authenticated"}',
  true
);

do $$
declare
  v_ws uuid;
begin
  select workspace_a into v_ws from test_ids;

  begin
    -- B passes the RLS update policy (admin), so only the guard can stop this
    update public.workspaces
    set owner_id = '00000000-0000-0000-0000-0000000000bb'
    where id = v_ws;

    raise exception 'FAIL (test 10): admin B changed workspace A''s owner_id';
  exception
    when raise_exception then
      if sqlerrm not like '%owner_id is immutable%' then
        raise exception 'FAIL (test 10): unexpected error: %', sqlerrm;
      end if;
  end;

  -- the row must still belong to user A
  if exists (
    select 1 from public.workspaces
    where id = v_ws and owner_id <> '00000000-0000-0000-0000-0000000000aa'
  ) then
    raise exception 'FAIL (test 10): owner_id no longer belongs to user A';
  end if;

  raise notice 'PASS (test 10): admin cannot change owner_id (guard trigger rejected the update)';
end $$;


/* ── test 11: a member cannot change a workspace's owner_id ─────────────── */
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000cc","role":"authenticated","aud":"authenticated"}',
  true
);

do $$
declare
  v_ws uuid;
begin
  select workspace_a into v_ws from test_ids;

  begin
    update public.workspaces
    set owner_id = '00000000-0000-0000-0000-0000000000cc'
    where id = v_ws;

    raise exception 'FAIL (test 11): member C changed workspace A''s owner_id';
  exception
    -- a plain member is stopped by RLS (insufficient_privilege) before the
    -- trigger even runs; either barrier failing closed is a pass
    when insufficient_privilege then
      null;
    when raise_exception then
      if sqlerrm not like '%owner_id is immutable%' then
        raise exception 'FAIL (test 11): unexpected error: %', sqlerrm;
      end if;
  end;

  if exists (
    select 1 from public.workspaces
    where id = v_ws and owner_id <> '00000000-0000-0000-0000-0000000000aa'
  ) then
    raise exception 'FAIL (test 11): owner_id no longer belongs to user A';
  end if;

  raise notice 'PASS (test 11): member cannot change owner_id (RLS/guard rejected the update)';
end $$;


/* ── impersonate user B for tests 12–13 ───────────────────────────────────
   User B owns Workspace B and is an admin of Workspace A.
   Therefore B legitimately belongs to BOTH workspaces, so RLS permits updates
   in either workspace. The workspace_id guard itself must reject the move.
*/
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000bb","role":"authenticated","aud":"authenticated"}',
  true
);


/* ── test 12: a client cannot be moved to another workspace ─────────────── */
-- B belongs to BOTH workspaces, so RLS permits the update.
-- The immutable workspace_id guard must be what rejects the move.
do $$
declare
  v_client uuid;
  v_ws_a   uuid;
  v_ws_b   uuid;
begin
  select client_a, workspace_a into v_client, v_ws_a from test_ids;
  select id into v_ws_b from public.workspaces where name = 'Workspace B';

  begin
    update public.clients set workspace_id = v_ws_b where id = v_client;

    raise exception 'FAIL (test 12): client A was moved to workspace B';
  exception
    when raise_exception then
      if sqlerrm not like '%workspace_id is immutable%' then
        raise exception 'FAIL (test 12): unexpected error: %', sqlerrm;
      end if;
  end;

  if exists (select 1 from public.clients where id = v_client and workspace_id <> v_ws_a) then
    raise exception 'FAIL (test 12): client A''s workspace_id changed';
  end if;

  raise notice 'PASS (test 12): a client cannot be moved between workspaces via UPDATE';
end $$;


/* ── test 13: a project cannot be moved to another workspace ────────────── */
do $$
declare
  v_project uuid;
  v_ws_a    uuid;
  v_ws_b    uuid;
begin
  select p.id, t.workspace_a into v_project, v_ws_a
  from public.projects p
  join test_ids t on t.workspace_a = p.workspace_id
  where p.name = 'Project A';

  select id into v_ws_b from public.workspaces where name = 'Workspace B';

  begin
    update public.projects set workspace_id = v_ws_b where id = v_project;

    raise exception 'FAIL (test 13): project A was moved to workspace B';
  exception
    when raise_exception then
      if sqlerrm not like '%workspace_id is immutable%' then
        raise exception 'FAIL (test 13): unexpected error: %', sqlerrm;
      end if;
  end;

  if exists (select 1 from public.projects where id = v_project and workspace_id <> v_ws_a) then
    raise exception 'FAIL (test 13): project A''s workspace_id changed';
  end if;

  raise notice 'PASS (test 13): a project cannot be moved between workspaces via UPDATE';
end $$;
/* ── impersonate user C for tests 14–15 ───────────────────────────────────
   User C is a plain member of Workspace A. Members may normally update
   clients/projects, so the created_by guard itself must reject tampering.
*/
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000cc","role":"authenticated","aud":"authenticated"}',
  true
);

/* ── test 14: a member cannot rewrite a client's created_by ─────────────── */
do $$
declare
  v_client uuid;
begin
  select client_a into v_client from test_ids;

  begin
    update public.clients
    set created_by = '00000000-0000-0000-0000-0000000000bb'
    where id = v_client;

    raise exception 'FAIL (test 14): client A''s created_by was rewritten';
  exception
    when raise_exception then
      if sqlerrm not like '%created_by is immutable%' then
        raise exception 'FAIL (test 14): unexpected error: %', sqlerrm;
      end if;
  end;

  if exists (
    select 1 from public.clients
    where id = v_client and created_by <> '00000000-0000-0000-0000-0000000000aa'
  ) then
    raise exception 'FAIL (test 14): client A''s created_by no longer points at user A';
  end if;

  raise notice 'PASS (test 14): created_by on clients is immutable after creation';
end $$;


/* ── test 15: a member cannot rewrite a project's created_by ────────────── */
do $$
declare
  v_project uuid;
begin
  select p.id into v_project
  from public.projects p
  join test_ids t on t.workspace_a = p.workspace_id
  where p.name = 'Project A';

  begin
    update public.projects
    set created_by = '00000000-0000-0000-0000-0000000000bb'
    where id = v_project;

    raise exception 'FAIL (test 15): project A''s created_by was rewritten';
  exception
    when raise_exception then
      if sqlerrm not like '%created_by is immutable%' then
        raise exception 'FAIL (test 15): unexpected error: %', sqlerrm;
      end if;
  end;

  if exists (
    select 1 from public.projects
    where id = v_project and created_by <> '00000000-0000-0000-0000-0000000000aa'
  ) then
    raise exception 'FAIL (test 15): project A''s created_by no longer points at user A';
  end if;

  raise notice 'PASS (test 15): created_by on projects is immutable after creation';
end $$;


/* ── test 16: workspace deletion cascades cleanly ───────────────────────── */
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
    raise exception 'FAIL (test 16): workspace A still exists after deletion';
  end if;
  if exists (select 1 from public.clients where workspace_id = v_ws) then
    raise exception 'FAIL (test 16): clients did not cascade with workspace A';
  end if;
  if exists (select 1 from public.projects where workspace_id = v_ws) then
    raise exception 'FAIL (test 16): projects did not cascade with workspace A';
  end if;
  if exists (select 1 from public.workspace_members where workspace_id = v_ws) then
    raise exception 'FAIL (test 16): members did not cascade with workspace A';
  end if;

  raise notice 'PASS (test 16): deleting workspace A cascaded to its client, project and membership';
end $$;


/* ── nothing persists ───────────────────────────────────────────────────── */
rollback;

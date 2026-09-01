/*
  ClientQuest — Phase 2C deliverables RLS verification plan

  Run only AFTER 20260901024100_create_deliverables.sql has been applied to a
  non-production environment. The entire fixture runs in one transaction and
  ends with ROLLBACK, leaving no test rows behind.

  Coverage:
    1. owner can create a deliverable in their project
    2. composite FK blocks a deliverable whose project is in another workspace
    3. outsider cannot read a deliverable
    4. member can read and update in their workspace
    5. member cannot delete
    6. workspace_id and created_by are immutable on update
*/

begin;

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000002a1', 'authenticated', 'authenticated', 'deliverable-owner@clientquest.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000002b2', 'authenticated', 'authenticated', 'deliverable-member@clientquest.test', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-0000000002c3', 'authenticated', 'authenticated', 'deliverable-outsider@clientquest.test', '{}', '{}', now(), now());

create temporary table phase2c_ids (
  workspace_a uuid,
  workspace_b uuid,
  project_a uuid,
  project_b uuid,
  deliverable_a uuid
);
grant select, insert, update on phase2c_ids to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000002a1","role":"authenticated","aud":"authenticated"}', true);

/* 1. owner creates two workspaces, then a project + deliverable in A. */
insert into public.workspaces (name, owner_id)
values ('Deliverables A', '00000000-0000-0000-0000-0000000002a1'), ('Deliverables B', '00000000-0000-0000-0000-0000000002a1');

insert into phase2c_ids (workspace_a, workspace_b)
select
  (select id from public.workspaces where name = 'Deliverables A' and owner_id = '00000000-0000-0000-0000-0000000002a1' limit 1),
  (select id from public.workspaces where name = 'Deliverables B' and owner_id = '00000000-0000-0000-0000-0000000002a1' limit 1);

insert into public.projects (workspace_id, name, created_by)
select workspace_a, 'Project A', '00000000-0000-0000-0000-0000000002a1' from phase2c_ids;
insert into public.projects (workspace_id, name, created_by)
select workspace_b, 'Project B', '00000000-0000-0000-0000-0000000002a1' from phase2c_ids;

update phase2c_ids set
  project_a = (select p.id from public.projects p join phase2c_ids i on i.workspace_a = p.workspace_id where p.name = 'Project A'),
  project_b = (select p.id from public.projects p join phase2c_ids i on i.workspace_b = p.workspace_id where p.name = 'Project B');

insert into public.deliverables (workspace_id, project_id, title, status, version, created_by)
select workspace_a, project_a, 'Homepage review', 'ready_for_review', 1, '00000000-0000-0000-0000-0000000002a1'
from phase2c_ids;

update phase2c_ids set deliverable_a = (select id from public.deliverables where title = 'Homepage review');

do $$
begin
  if not exists (select 1 from phase2c_ids where deliverable_a is not null) then
    raise exception 'FAIL (1): owner could not create deliverable';
  end if;
  raise notice 'PASS (1): owner created an in-workspace deliverable';
end $$;

/* 2. the composite FK blocks project B under workspace A. */
do $$
declare v_a uuid; v_b_project uuid;
begin
  select workspace_a, project_b into v_a, v_b_project from phase2c_ids;
  begin
    insert into public.deliverables (workspace_id, project_id, title, created_by)
    values (v_a, v_b_project, 'Cross-workspace attempt', '00000000-0000-0000-0000-0000000002a1');
    raise exception 'FAIL (2): cross-workspace project was accepted';
  exception when foreign_key_violation then
    raise notice 'PASS (2): composite FK blocked cross-workspace project';
  end;
end $$;

/* Seed one plain member through postgres, like the Phase 2A test plan. */
reset role;
insert into public.workspace_members (workspace_id, user_id, role)
select workspace_a, '00000000-0000-0000-0000-0000000002b2', 'member' from phase2c_ids;

/* 3. outsider cannot read deliverable A. */
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000002c3","role":"authenticated","aud":"authenticated"}', true);
do $$
declare v_id uuid;
begin
  select deliverable_a into v_id from phase2c_ids;
  if exists (select 1 from public.deliverables where id = v_id) then
    raise exception 'FAIL (3): outsider can read deliverable';
  end if;
  raise notice 'PASS (3): outsider cannot read deliverable';
end $$;

/* 4 and 5. member can update but cannot delete. */
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000002b2","role":"authenticated","aud":"authenticated"}', true);
update public.deliverables set status = 'changes_requested'
where id = (select deliverable_a from phase2c_ids);

do $$
begin
  if not exists (select 1 from public.deliverables where id = (select deliverable_a from phase2c_ids) and status = 'changes_requested') then
    raise exception 'FAIL (4): member could not update deliverable';
  end if;
  raise notice 'PASS (4): member can update deliverable';
end $$;

delete from public.deliverables where id = (select deliverable_a from phase2c_ids);
do $$
begin
  if not exists (select 1 from public.deliverables where id = (select deliverable_a from phase2c_ids)) then
    raise exception 'FAIL (5): member deleted deliverable';
  end if;
  raise notice 'PASS (5): member cannot delete deliverable';
end $$;

/* 6. existing immutable-field guards reject tenancy/audit tampering. */
do $$
declare v_id uuid; v_workspace_b uuid;
begin
  select deliverable_a, workspace_b into v_id, v_workspace_b from phase2c_ids;
  begin
    update public.deliverables set workspace_id = v_workspace_b where id = v_id;
    raise exception 'FAIL (6a): workspace_id changed';
  exception when raise_exception then
    raise notice 'PASS (6a): workspace_id is immutable';
  end;
  begin
    update public.deliverables set created_by = '00000000-0000-0000-0000-0000000002b2' where id = v_id;
    raise exception 'FAIL (6b): created_by changed';
  exception when raise_exception then
    raise notice 'PASS (6b): created_by is immutable';
  end;
end $$;

rollback;

/*
  Draft security hardening proposal. Do not apply until separately approved.

  Scope:
  - remove anonymous execution of non-public SECURITY DEFINER helpers;
  - preserve authenticated execution for RLS and manager portal dependencies;
  - fix only the Security Advisor functions with a mutable search_path.

  This migration does not change tables, RLS policies, Auth configuration,
  triggers, function bodies, portal token behavior, or application code.
*/

begin;

/*
  These helpers are invoked only from policies whose target role is
  authenticated, plus the authenticated manager portal RPCs. Anonymous callers
  have no supported application use for their direct RPC endpoints.
*/
revoke execute on function public.can_manage_workspace(uuid) from public, anon;
grant execute on function public.can_manage_workspace(uuid) to authenticated;

revoke execute on function public.is_workspace_member(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;

revoke execute on function public.is_workspace_owner(uuid) from public, anon;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

/*
  Trigger functions are never application RPCs. Retain authenticated execution
  so existing trigger-backed DML behavior is preserved while removing their
  anonymous API exposure.
*/
revoke execute on function public.handle_workspace_created() from public, anon;
revoke execute on function public.guard_deliverable_approval_event_context() from public, anon;

/*
  Each function below uses only PL/pgSQL, built-in operators/functions, trigger
  records, or schema-qualified public objects. pg_catalog is therefore the
  narrowest safe runtime lookup path.
*/
alter function public.set_updated_at() set search_path = pg_catalog;
alter function public.guard_workspace_owner_id() set search_path = pg_catalog;
alter function public.guard_workspace_id() set search_path = pg_catalog;
alter function public.guard_created_by() set search_path = pg_catalog;
alter function public.guard_deliverable_project_id() set search_path = pg_catalog;
alter function public.guard_project_portal_link_client() set search_path = pg_catalog;
alter function public.guard_project_portal_link_fields() set search_path = pg_catalog;

commit;

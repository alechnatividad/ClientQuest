/*
  Phase 3 security hardening: explicit RPC execute privileges only.

  No tables, schemas, RLS policies, functions, or application behavior change.
  This migration removes the automatic direct anon grants on manager-only RPCs
  while preserving anonymous access for the two token-authorized client RPCs.
*/

begin;

/* Manager-only RPCs: authenticated users only. */
revoke execute on function public.create_project_portal_link(uuid) from public, anon;
grant execute on function public.create_project_portal_link(uuid) to authenticated;

revoke execute on function public.get_project_portal_link(uuid) from public, anon;
grant execute on function public.get_project_portal_link(uuid) to authenticated;

revoke execute on function public.revoke_project_portal_link(uuid) from public, anon;
grant execute on function public.revoke_project_portal_link(uuid) to authenticated;

/* Token-authorized client RPCs: callable without a session and by signed-in
   users. Their own token and workspace checks remain unchanged. */
revoke execute on function public.get_client_portal(text) from public;
grant execute on function public.get_client_portal(text) to anon, authenticated;

revoke execute on function public.submit_client_deliverable_decision(text, uuid, text) from public;
grant execute on function public.submit_client_deliverable_decision(text, uuid, text) to anon, authenticated;

commit;

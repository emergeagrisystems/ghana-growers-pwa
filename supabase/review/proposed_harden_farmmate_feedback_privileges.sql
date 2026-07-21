-- REVIEW ONLY. Do not apply until the production baseline is reconciled.
--
-- Production currently grants all table privileges on
-- public.farmmate_pilot_feedback to anon and authenticated. RLS is enabled
-- and no public policies exist, so rows remain inaccessible, but the direct
-- grants differ from the intended server-only design in historical migration
-- 035. This proposal removes those direct grants without changing data.

begin;

revoke all on table public.farmmate_pilot_feedback from anon;
revoke all on table public.farmmate_pilot_feedback from authenticated;
grant all on table public.farmmate_pilot_feedback to service_role;

commit;

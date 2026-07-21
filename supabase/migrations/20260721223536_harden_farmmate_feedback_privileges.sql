begin;

-- Pilot feedback is accepted only by the server route using service_role.
-- RLS remains enabled as a second layer, but public roles should not retain
-- direct table privileges.
revoke all privileges on table public.farmmate_pilot_feedback from anon;
revoke all privileges on table public.farmmate_pilot_feedback from authenticated;

-- Preserve the existing server-side insert and review path.
grant all privileges on table public.farmmate_pilot_feedback to service_role;

commit;

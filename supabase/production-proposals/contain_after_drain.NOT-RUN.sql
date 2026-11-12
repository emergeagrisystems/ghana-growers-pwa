-- UNAPPLIED. Non-destructive Production containment, ONLY after separate rollback
-- authority, legacy app restored or gated and writers/workers fully drained.
BEGIN;
SET LOCAL search_path='';
DO $g$ BEGIN IF current_user<>'postgres' OR (pg_control_system()).system_identifier::text<>'7642734024280108049' THEN RAISE EXCEPTION 'Wrong Production target'; END IF; END $g$;
REVOKE EXECUTE ON FUNCTION public.staff_case_command(uuid,uuid,uuid,bigint,text,jsonb) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.staff_case_read(uuid,uuid) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.staff_today(uuid,timestamptz) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.staff_supplier_media_save(uuid,uuid,uuid,timestamptz,text,text,text,jsonb) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.staff_supplier_media_lease(uuid,uuid) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.staff_supplier_media_finish(uuid,uuid,text,text) FROM service_role;
-- PostgreSQL 17: postgres retains its role-creator ADMIN-only grant. Temporarily
-- acquire SET only, act as owner to revoke private function execution, then remove it.
GRANT gg_staff_api TO postgres WITH SET TRUE, INHERIT FALSE;
SET LOCAL ROLE gg_staff_api;
REVOKE EXECUTE ON FUNCTION staff_crm.staff_case_command(uuid,uuid,uuid,bigint,text,jsonb) FROM service_role;
REVOKE EXECUTE ON FUNCTION staff_crm.staff_case_read(uuid,uuid) FROM service_role;
REVOKE EXECUTE ON FUNCTION staff_crm.staff_today(uuid,timestamptz) FROM service_role;
REVOKE EXECUTE ON FUNCTION staff_crm.staff_supplier_media_save(uuid,uuid,uuid,timestamptz,text,text,text,jsonb,text,bigint) FROM service_role;
REVOKE EXECUTE ON FUNCTION staff_crm.staff_supplier_media_lease(uuid,uuid) FROM service_role;
REVOKE EXECUTE ON FUNCTION staff_crm.staff_supplier_media_finish(uuid,uuid,text,text) FROM service_role;
RESET ROLE;
REVOKE gg_staff_api FROM postgres GRANTED BY postgres;
COMMIT;
-- No table/row/object deletion. Keep restrictive Storage policy active.

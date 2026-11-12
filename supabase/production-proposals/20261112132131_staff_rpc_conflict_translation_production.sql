BEGIN;
DO $guard$
BEGIN
  IF current_database() <> 'postgres' OR current_user <> 'postgres'
     OR (pg_catalog.pg_control_system()).system_identifier::text <> '7642734024280108049'
     OR NOT EXISTS (SELECT FROM supabase_migrations.schema_migrations
         WHERE version='20261112132130' AND cardinality(statements)=1 AND
         encode(sha256(convert_to(statements[1],'UTF8')),'hex')='f99b510a96db8bdcc76f328b8e25e9eb7fd256e5d9e5c9040f38e4f355200f82')
  THEN RAISE EXCEPTION 'Reviewed Production baseline required'; END IF;
END $guard$;
DO $verify$
DECLARE p record; found_count integer:=0;
BEGIN
  FOR p IN SELECT * FROM pg_catalog.pg_proc WHERE pronamespace='public'::regnamespace AND
      proname IN ('staff_case_command','staff_supplier_media_save','staff_supplier_media_finish') LOOP
    found_count:=found_count+1;
    IF p.prosecdef OR p.proowner <> 'postgres'::regrole OR p.proconfig IS DISTINCT FROM ARRAY['search_path=""']
       OR NOT has_function_privilege('service_role',p.oid,'EXECUTE')
       OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE')
       OR EXISTS (SELECT FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
          WHERE a.grantee<>p.proowner AND (a.grantee<>'service_role'::regrole OR a.is_grantable))
    THEN RAISE EXCEPTION 'Wrapper privilege boundary differs'; END IF;
  END LOOP;
  IF found_count<>3 THEN RAISE EXCEPTION 'Expected three wrapper signatures'; END IF;
END $verify$;
DO $originals$
BEGIN
  IF (SELECT md5(pg_get_functiondef(oid)) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='staff_case_command') IS DISTINCT FROM 'c2a27165af28cc82a783cc89747c42bd' THEN RAISE EXCEPTION 'Original staff_case_command definition differs'; END IF;
  IF (SELECT md5(pg_get_functiondef(oid)) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='staff_supplier_media_finish') IS DISTINCT FROM '970bbd1385df3f8cfe6e0735afb752af' THEN RAISE EXCEPTION 'Original staff_supplier_media_finish definition differs'; END IF;
  IF (SELECT md5(pg_get_functiondef(oid)) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='staff_supplier_media_save') IS DISTINCT FROM '26dff292bba1012d030a41f4ac92118c' THEN RAISE EXCEPTION 'Original staff_supplier_media_save definition differs'; END IF;
END $originals$;

CREATE OR REPLACE FUNCTION public.staff_case_command(p_actor uuid, p_request uuid, p_operation uuid, p_expected_version bigint, p_kind text, p_input jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql SECURITY INVOKER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN staff_crm.staff_case_command(p_actor,p_request,p_operation,p_expected_version,p_kind,p_input);
EXCEPTION WHEN serialization_failure THEN
  IF SQLERRM IN ('Stale edit', 'Already claimed', 'Lead changed', 'Buyer link changed', 'Case changed') THEN
    RAISE SQLSTATE 'PT409' USING MESSAGE='This case has changed. Review the latest case before saving again.';
  END IF;
  RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.staff_supplier_media_finish(p_job uuid, p_lease uuid, p_verified_digest text, p_result text)
 RETURNS jsonb
 LANGUAGE plpgsql SECURITY INVOKER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN staff_crm.staff_supplier_media_finish(p_job,p_lease,p_verified_digest,p_result);
EXCEPTION WHEN serialization_failure THEN
  IF SQLERRM IN ('Stale worker', 'Lease inactive or expired', 'Attach conflict') THEN
    RAISE SQLSTATE 'PT409' USING MESSAGE='This photo job has changed. Check its current state before continuing.';
  END IF;
  RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.staff_supplier_media_save(p_actor uuid, p_supplier uuid, p_operation uuid, p_base_version timestamp with time zone, p_field text, p_staged_key text, p_digest text, p_profile_patch jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql SECURITY INVOKER
 SET search_path TO ''
AS $function$
DECLARE result jsonb;
BEGIN
  SELECT staff_crm.staff_supplier_media_save(p_actor,p_supplier,p_operation,p_base_version,p_field,p_staged_key,p_digest,p_profile_patch,o.mime,o.bytes)
  INTO result
  FROM (VALUES(1)) anchor(n) LEFT JOIN LATERAL (
    SELECT max(metadata->>'mimetype') AS mime,
      max(CASE WHEN metadata->>'size' ~ '^[0-9]{1,9}$' THEN (metadata->>'size')::bigint END) AS bytes
    FROM storage.objects WHERE bucket_id='supplier-application-media' AND name=p_staged_key
      AND archived_at IS NULL AND is_delete_marker IS NOT TRUE HAVING count(*)=1
  ) o ON true;
  RETURN result;
EXCEPTION WHEN serialization_failure THEN
  IF SQLERRM IN ('Supplier profile changed', 'Supplier version did not advance; retry in a fresh transaction') THEN
    RAISE SQLSTATE 'PT409' USING MESSAGE='This profile was updated by someone else. Review the latest version before saving again.';
  END IF;
  RAISE;
END;
$function$;

DO $verify$
DECLARE p record; found_count integer:=0;
BEGIN
  FOR p IN SELECT * FROM pg_catalog.pg_proc WHERE pronamespace='public'::regnamespace AND
      proname IN ('staff_case_command','staff_supplier_media_save','staff_supplier_media_finish') LOOP
    found_count:=found_count+1;
    IF p.prosecdef OR p.proowner <> 'postgres'::regrole OR p.proconfig IS DISTINCT FROM ARRAY['search_path=""']
       OR NOT has_function_privilege('service_role',p.oid,'EXECUTE')
       OR has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE')
       OR EXISTS (SELECT FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
          WHERE a.grantee<>p.proowner AND (a.grantee<>'service_role'::regrole OR a.is_grantable))
    THEN RAISE EXCEPTION 'Wrapper privilege boundary differs'; END IF;
  END LOOP;
  IF found_count<>3 THEN RAISE EXCEPTION 'Expected three wrapper signatures'; END IF;
END $verify$;
COMMIT;

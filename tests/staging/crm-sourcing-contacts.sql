-- Rollback-only staging regression. Submit this whole file in one connection.
BEGIN;
SET LOCAL search_path = '';
SET LOCAL timezone = 'UTC';
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $fixtures$
DECLARE
  staff uuid;
  fixture text;
  id uuid;
BEGIN
  IF current_database() <> 'postgres' OR current_user <> 'postgres'
    OR (pg_control_system()).system_identifier::text <> '7678069749886157684' THEN
    RAISE EXCEPTION 'Wrong staging cluster, database or executor';
  END IF;
  IF NOT EXISTS (
    SELECT FROM supabase_migrations.schema_migrations WHERE version='20261110085057'
      AND cardinality(statements)=1 AND encode(sha256(convert_to(statements[1],'UTF8')),'hex')
       ='4155412088f193c0c104347f9bbd35b28a45c9b89da183d6307387dfaea1d6db'
  ) THEN RAISE EXCEPTION 'Reviewed CRM migration missing'; END IF;
  SELECT id_field.id INTO STRICT staff FROM auth.users id_field
    WHERE email_confirmed_at IS NOT NULL AND raw_app_meta_data->>'role'='admin' ORDER BY id_field.id LIMIT 1;
  PERFORM set_config('gg.review.staff_uuid',staff::text,true);
  FOREACH fixture IN ARRAY ARRAY['source_farm','farm_a','farm_b','supplier_c','supplier_d','case_uuid','other_case_uuid'] LOOP
    id:=gen_random_uuid();
    PERFORM set_config('gg.review.'||fixture,id::text,true);
    IF fixture IN ('source_farm','farm_a','farm_b') THEN
      INSERT INTO public.farmers(id,farmer_name,farm_name,region,district,farm_type,status,launch_status,launch_ready,is_featured)
        VALUES(id,'Fictional','GG-STAGING-SOURCING-RETEST','Fixture','Fixture','Fixture','Pending','Hold',false,false);
    ELSIF fixture IN ('supplier_c','supplier_d') THEN
      INSERT INTO public.suppliers(id,company_name,contact_person,region,district,category,status,launch_status,launch_ready,is_featured)
        VALUES(id,'GG-STAGING-SOURCING-RETEST','Fictional','Fixture','Fixture','Fixture','Pending','Hold',false,false);
    ELSE
      INSERT INTO public.lead_requests(id,requester_name,phone,whatsapp,location,product_interest,source_type,source_id,source_name,request_source,farmer_profile_id)
        VALUES(id,'GG-STAGING-SOURCING-RETEST','TEST-NO-CALL','TEST-NO-CALL','Fixture','Test produce',
          CASE WHEN fixture='case_uuid' THEN 'Farmer' ELSE 'Buyer Request' END,'fixture','Fictional',
          CASE WHEN fixture='case_uuid' THEN 'farmer_profile' ELSE 'generic_sourcing' END,
          CASE WHEN fixture='case_uuid' THEN current_setting('gg.review.source_farm')::uuid END);
    END IF;
  END LOOP;
END $fixtures$;

SET LOCAL ROLE service_role;
DO $sourcing$
DECLARE
  staff uuid:=current_setting('gg.review.staff_uuid')::uuid;
  r uuid:=current_setting('gg.review.case_uuid')::uuid; other_r uuid:=current_setting('gg.review.other_case_uuid')::uuid;
  farm_a uuid:=current_setting('gg.review.farm_a')::uuid; farm_b uuid:=current_setting('gg.review.farm_b')::uuid;
  supplier_d uuid:=current_setting('gg.review.supplier_d')::uuid;
  supplier_c uuid:=current_setting('gg.review.supplier_c')::uuid; absent uuid:=gen_random_uuid();
  original record; after_contacts record; before_case jsonb; result jsonb; past jsonb; link jsonb;
  base jsonb:=jsonb_build_object('confirmed',true,'channel','phone','occurred_at',clock_timestamp());
  farmer_a jsonb:=base||jsonb_build_object('seller_type','farmer','seller_id',farm_a);
  op uuid:=gen_random_uuid(); first_event jsonb;
BEGIN
  SELECT farmer_profile_id,supplier_profile_id,status,updated_at INTO STRICT original FROM public.lead_requests WHERE id=r;
  before_case:=public.staff_case_read(staff,r);
  IF r=other_r OR num_nonnulls(original.farmer_profile_id,original.supplier_profile_id)<>1
     OR (before_case->>'version')::bigint<>0 OR (public.staff_case_read(staff,other_r)->>'version')::bigint<>0
     OR NOT EXISTS(SELECT FROM public.lead_requests WHERE id=other_r AND farmer_profile_id IS NULL AND supplier_profile_id IS NULL)
     OR farm_a=farm_b OR farm_a IS NOT DISTINCT FROM original.farmer_profile_id OR farm_b IS NOT DISTINCT FROM original.farmer_profile_id
     OR supplier_c=supplier_d OR supplier_d IS NOT DISTINCT FROM original.supplier_profile_id
     OR NOT EXISTS(SELECT FROM public.suppliers WHERE id=supplier_d)
     OR supplier_c IS NOT DISTINCT FROM original.supplier_profile_id
     OR NOT EXISTS(SELECT FROM public.farmers WHERE id=farm_a) OR NOT EXISTS(SELECT FROM public.farmers WHERE id=farm_b)
     OR NOT EXISTS(SELECT FROM public.suppliers WHERE id=supplier_c)
     OR EXISTS(SELECT FROM public.suppliers WHERE id=farm_a) OR EXISTS(SELECT FROM public.farmers WHERE id=absent)
     OR EXISTS(SELECT FROM public.suppliers WHERE id=absent) THEN RAISE EXCEPTION 'Invalid disposable fixtures'; END IF;

  first_event:=public.staff_case_command(staff,r,op,0,'seller_contact',farmer_a);
  IF public.staff_case_command(staff,r,op,0,'seller_contact',farmer_a) IS DISTINCT FROM first_event THEN RAISE EXCEPTION 'Replay changed receipt'; END IF;
  BEGIN PERFORM public.staff_case_command(staff,r,op,0,'seller_contact',farmer_a||jsonb_build_object('seller_id',farm_b));
    RAISE EXCEPTION 'Changed candidate accepted under reused UUID'; EXCEPTION WHEN unique_violation THEN NULL; END;
  PERFORM public.staff_case_command(staff,r,gen_random_uuid(),1,'seller_contact',farmer_a||jsonb_build_object('seller_id',farm_b));
  PERFORM public.staff_case_command(staff,r,gen_random_uuid(),2,'seller_contact',base||jsonb_build_object('seller_type','supplier','seller_id',supplier_c));
  PERFORM public.staff_case_command(staff,r,gen_random_uuid(),3,'seller_contact',farmer_a);
  BEGIN PERFORM public.staff_case_command(staff,r,gen_random_uuid(),4,'seller_contact',farmer_a||jsonb_build_object('seller_id',absent));
    RAISE EXCEPTION 'Unknown farmer accepted'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN PERFORM public.staff_case_command(staff,r,gen_random_uuid(),4,'seller_contact',farmer_a||'{"seller_type":"supplier"}');
    RAISE EXCEPTION 'Wrong typed seller accepted'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN PERFORM public.staff_case_command(staff,r,gen_random_uuid(),4,'seller_contact',farmer_a||'{"reply":true}');
    RAISE EXCEPTION 'Buyer reply accepted on seller event'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
  PERFORM public.staff_case_command(staff,r,gen_random_uuid(),4,'seller_contact',base||jsonb_build_object('seller_type','supplier','seller_id',supplier_d));
  result:=public.staff_case_read(staff,r);
  SELECT farmer_profile_id,supplier_profile_id,status,updated_at INTO STRICT after_contacts FROM public.lead_requests WHERE id=r;
  IF original IS DISTINCT FROM after_contacts OR result->'outcome' IS DISTINCT FROM before_case->'outcome'
     OR result->'first_reply' IS DISTINCT FROM 'null'::jsonb OR (result->>'version')::bigint<>5
     OR jsonb_array_length(result->'sellers_contacted')<>4 OR jsonb_array_length(result->'timeline')<>5
     OR NOT ((result->'sellers_contacted') @> jsonb_build_array(
       jsonb_build_object('seller_type','farmer','seller_id',farm_a,'contact_count',2),
       jsonb_build_object('seller_type','farmer','seller_id',farm_b,'contact_count',1),
       jsonb_build_object('seller_type','supplier','seller_id',supplier_c,'contact_count',1),
       jsonb_build_object('seller_type','supplier','seller_id',supplier_d,'contact_count',1))) THEN
    RAISE EXCEPTION 'Contact summary, match, first reply or source changed incorrectly';
  END IF;
  PERFORM public.staff_case_command(staff,other_r,gen_random_uuid(),0,'seller_contact',farmer_a);
  IF EXISTS(SELECT FROM public.lead_requests WHERE id=other_r AND num_nonnulls(farmer_profile_id,supplier_profile_id)<>0) THEN
    RAISE EXCEPTION 'Contact populated a source-less request'; END IF;
  IF public.staff_case_read(staff,other_r)->'confirmed_history' IS DISTINCT FROM '[]'::jsonb THEN RAISE EXCEPTION 'Unconfirmed history exposed'; END IF;
  link:=public.staff_case_command(staff,r,gen_random_uuid(),5,'link','{"confirmed":true,"reason":"Fixture only","create_identity":true}');
  link:=public.staff_case_command(staff,other_r,gen_random_uuid(),1,'link',
        jsonb_build_object('confirmed',true,'reason','Confirmed fixture','buyer_id',link->>'buyer_id'));
  past:=public.staff_case_read(staff,other_r)->'confirmed_history';
  IF jsonb_array_length(past)<>1 OR past->0->>'request_id' IS DISTINCT FROM r::text OR
     past->0->'sellers_contacted' IS DISTINCT FROM result->'sellers_contacted' THEN RAISE EXCEPTION 'Incorrect confirmed history'; END IF;
  PERFORM public.staff_case_command(staff,other_r,gen_random_uuid(),2,'unlink',
    jsonb_build_object('confirmed',true,'reason','Fixture unlink','link_id',link->>'link_id'));
  past:=public.staff_case_read(staff,other_r);
  IF past->'confirmed_history' IS DISTINCT FROM '[]'::jsonb OR past->'buyer_id' IS DISTINCT FROM 'null'::jsonb
    OR jsonb_array_length(past->'timeline')<>3 OR NOT ((past->'timeline') @> '[{"kind":"unlink"},{"kind":"seller_contact"},{"kind":"link"}]'::jsonb)
    OR (public.staff_case_read(staff,r)->'sellers_contacted') IS DISTINCT FROM result->'sellers_contacted' THEN
    RAISE EXCEPTION 'Unlink changed durable contact or audit history';
  END IF;
END $sourcing$;
RESET ROLE;
-- Use the existing creator's ADMIN option solely to grant the two helper permissions
-- as their owner. Return to postgres and relinquish SET before probing the real table.
GRANT gg_staff_api TO postgres WITH SET TRUE, INHERIT FALSE;
SET LOCAL ROLE gg_staff_api;
GRANT EXECUTE ON FUNCTION staff_crm.event_keys_ok(text,jsonb), staff_crm.keys_ok(jsonb,text[],text[]) TO postgres;
RESET ROLE;
REVOKE gg_staff_api FROM postgres GRANTED BY postgres;

DO $constraints$
DECLARE
  event_id uuid;
  actual text;
BEGIN
  SELECT id INTO STRICT event_id FROM staff_crm.events WHERE request_id=current_setting('gg.review.case_uuid')::uuid AND version=1;
  BEGIN
    UPDATE staff_crm.events SET supplier_id=current_setting('gg.review.supplier_c')::uuid WHERE id=event_id;
    RAISE EXCEPTION 'Two seller targets accepted';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS actual = CONSTRAINT_NAME;
    IF actual IS DISTINCT FROM 'events_check1' THEN RAISE EXCEPTION 'Two seller targets rejected by unexpected constraint %',actual; END IF;
  END;
  BEGIN
    UPDATE staff_crm.events SET farmer_id=NULL WHERE id=event_id;
    RAISE EXCEPTION 'Missing seller target accepted';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS actual = CONSTRAINT_NAME;
    IF actual IS DISTINCT FROM 'events_check1' THEN RAISE EXCEPTION 'Missing seller target rejected by unexpected constraint %',actual; END IF;
  END;
  BEGIN
    UPDATE staff_crm.events SET farmer_id=current_setting('gg.review.farm_b')::uuid WHERE id=event_id;
    RAISE EXCEPTION 'Seller ID disagrees with payload accepted';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS actual = CONSTRAINT_NAME;
    IF actual IS DISTINCT FROM 'seller_contact_target_matches_evidence' THEN RAISE EXCEPTION 'Seller ID disagrees with payload rejected by unexpected constraint %',actual; END IF;
  END;
  BEGIN
    UPDATE staff_crm.events SET first_buyer_reply=true WHERE id=event_id;
    RAISE EXCEPTION 'Seller first reply accepted';
  EXCEPTION WHEN check_violation THEN
    GET STACKED DIAGNOSTICS actual = CONSTRAINT_NAME;
    IF actual IS DISTINCT FROM 'events_check2' THEN RAISE EXCEPTION 'Seller first reply rejected by unexpected constraint %',actual; END IF;
  END;
END $constraints$;

SELECT count(*) FILTER (WHERE kind='seller_contact') AS seller_contact_events,
       count(DISTINCT farmer_id) AS distinct_farms, count(DISTINCT supplier_id) AS distinct_suppliers,
       count(*) FILTER (WHERE first_buyer_reply) AS first_buyer_replies,
       count(*) FILTER (WHERE kind='unlink') AS audited_unlinks,
       4 AS verified_named_constraint_probes
FROM staff_crm.events WHERE request_id IN (current_setting('gg.review.case_uuid')::uuid,current_setting('gg.review.other_case_uuid')::uuid);
ROLLBACK;

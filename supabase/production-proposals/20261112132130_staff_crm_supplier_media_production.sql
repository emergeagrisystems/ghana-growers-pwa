-- UNAPPLIED. Ghana Growers admin CRM + supplier media. PRODUCTION PROPOSAL ONLY.
-- Review copy outside supabase/migrations. Submit the entire file as ONE transaction
-- only after separate execution authority. Stop on any error; do not skip guards.
BEGIN;
SET LOCAL search_path = '';
SET LOCAL timezone = 'UTC';
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $guard$
BEGIN
  IF current_database() <> 'postgres' OR current_user <> 'postgres'
     OR (pg_catalog.pg_control_system()).system_identifier::text <> '7642734024280108049' THEN
    RAISE EXCEPTION 'Wrong Production cluster, database, or migration role';
  END IF;
  IF pg_catalog.to_regnamespace('staff_crm') IS NOT NULL OR pg_catalog.to_regrole('gg_staff_api') IS NOT NULL THEN
    RAISE EXCEPTION 'CRM namespace/role already exists; reconcile before execution';
  END IF;
  IF EXISTS (SELECT FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN
    ('staff_case_command','staff_case_read','staff_today','staff_supplier_media_save','staff_supplier_media_lease','staff_supplier_media_finish')) THEN
    RAISE EXCEPTION 'Existing RPC or overload; stop';
  END IF;
  IF (SELECT count(*) FROM storage.buckets WHERE
       (id='suppliers' AND public AND file_size_limit=5242880)
       OR (id='supplier-application-media' AND NOT public AND file_size_limit=8388608)) <> 2
     OR NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid='storage.objects'::regclass)
     OR NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid='public.lead_requests'::regclass)
     OR NOT (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid='public.suppliers'::regclass) THEN
    RAISE EXCEPTION 'Bucket or RLS baseline differs';
  END IF;
  IF (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects')<>3
     OR NOT EXISTS (SELECT FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects'
       AND policyname='Public read Ghana Growers launch media' AND cmd='SELECT' AND roles=ARRAY['public']::name[]
       AND qual=$expr$(bucket_id = ANY (ARRAY['marketplace'::text, 'farmers'::text, 'suppliers'::text, 'stories'::text]))$expr$)
     OR NOT EXISTS (SELECT FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects'
       AND policyname='Service role manages private profile application media' AND cmd='ALL' AND roles=ARRAY['service_role']::name[]
       AND qual=$expr$(bucket_id = ANY (ARRAY['farmer-application-media'::text, 'supplier-application-media'::text]))$expr$ AND with_check=qual)
     OR NOT EXISTS (SELECT FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects'
       AND policyname='Service role manages listing submission images' AND cmd='ALL' AND roles=ARRAY['service_role']::name[]
       AND qual=$expr$(bucket_id = 'listing-submissions'::text)$expr$ AND with_check=qual)
     OR EXISTS (SELECT FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename IN ('suppliers','lead_requests')) THEN
    RAISE EXCEPTION 'Policy baseline differs; review current grants/policies';
  END IF;
END $guard$;

-- No bucket/config/data changes. Hide this entire prefix from ordinary Storage
-- list/search/metadata access, including attached objects. Public GET by known URL
-- still works via the public bucket endpoint; do not use the filename as a secret.
CREATE POLICY gg_hide_supplier_editor_uploads ON storage.objects
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (bucket_id <> 'suppliers' OR (name <> 'editor-uploads' AND name NOT LIKE 'editor-uploads/%'));

SET LOCAL createrole_self_grant = '';
CREATE ROLE gg_staff_api NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
-- PG17 requires ability to SET ROLE for transfers. Only migration administrator,
-- temporarily. Never grant membership to service_role or an application identity.
GRANT gg_staff_api TO postgres WITH SET TRUE, INHERIT FALSE;
CREATE SCHEMA staff_crm AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA staff_crm FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA staff_crm TO gg_staff_api, service_role;
GRANT USAGE ON SCHEMA public TO gg_staff_api;
-- Temporary ownership-transfer prerequisite. Revoked below in the same transaction.
GRANT CREATE ON SCHEMA staff_crm TO gg_staff_api;

CREATE TABLE staff_crm.cases (
  request_id uuid PRIMARY KEY REFERENCES public.lead_requests(id) ON DELETE RESTRICT,
  version bigint NOT NULL DEFAULT 0 CHECK (version>=0),
  owner_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  next_action text CHECK (next_action IS NULL OR length(btrim(next_action)) BETWEEN 1 AND 300),
  due_at timestamptz CHECK (due_at IS NULL OR (isfinite(due_at) AND next_action IS NOT NULL)),
  outcome text CHECK (outcome IS NULL OR length(btrim(outcome)) BETWEEN 1 AND 300),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cases_owner_due ON staff_crm.cases(owner_id,due_at) WHERE due_at IS NOT NULL;
CREATE TABLE staff_crm.buyer_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE staff_crm.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL UNIQUE,
  request_id uuid NOT NULL REFERENCES staff_crm.cases(request_id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  version bigint NOT NULL CHECK(version>0),
  kind text NOT NULL CHECK(kind IN ('claim','handover','note','follow_up_set','follow_up_completed','buyer_contact','seller_contact','status','link','unlink')),
  input jsonb NOT NULL CHECK(jsonb_typeof(input)='object' AND octet_length(input::text)<=16384),
  occurred_at timestamptz NOT NULL CHECK(isfinite(occurred_at)),
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  channel text CHECK(channel IN ('whatsapp','phone','email','other')),
  farmer_id uuid REFERENCES public.farmers(id) ON DELETE RESTRICT,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  first_buyer_reply boolean NOT NULL DEFAULT false,
  link_id uuid, buyer_id uuid REFERENCES staff_crm.buyer_identities(id) ON DELETE RESTRICT,
  CHECK ((channel IS NOT NULL) = (kind IN ('buyer_contact','seller_contact'))),
  CHECK (num_nonnulls(farmer_id,supplier_id) = CASE WHEN kind='seller_contact' THEN 1 ELSE 0 END),
  CONSTRAINT seller_contact_target_matches_evidence CHECK (
    kind <> 'seller_contact' OR (
      NOT first_buyer_reply AND input @> '{"confirmed":true}'::jsonb
      AND input->>'seller_type' = CASE WHEN farmer_id IS NOT NULL THEN 'farmer' ELSE 'supplier' END
      AND lower(input->>'seller_id') = coalesce(farmer_id,supplier_id)::text
    ) IS TRUE
  ),
  CHECK (NOT first_buyer_reply OR (kind='buyer_contact' AND input @> '{"confirmed":true,"reply":true}'::jsonb)),
  CHECK ((kind IN ('link','unlink')) = (link_id IS NOT NULL) AND (link_id IS NULL) = (buyer_id IS NULL)),
  UNIQUE(request_id,version),
  UNIQUE(id,request_id,link_id,buyer_id,kind)
);
CREATE UNIQUE INDEX events_one_first ON staff_crm.events(request_id) WHERE first_buyer_reply;
CREATE INDEX events_timeline ON staff_crm.events(request_id,recorded_at DESC,id);
CREATE TABLE staff_crm.buyer_links (
  id uuid PRIMARY KEY,
  buyer_id uuid NOT NULL REFERENCES staff_crm.buyer_identities(id) ON DELETE RESTRICT,
  request_id uuid NOT NULL REFERENCES staff_crm.cases(request_id) ON DELETE RESTRICT,
  confirmed_event uuid NOT NULL UNIQUE, unlinked_event uuid UNIQUE,
  confirmed_kind text GENERATED ALWAYS AS ('link'::text) STORED,
  unlinked_kind text GENERATED ALWAYS AS ('unlink'::text) STORED,
  FOREIGN KEY(confirmed_event,request_id,id,buyer_id,confirmed_kind)
    REFERENCES staff_crm.events(id,request_id,link_id,buyer_id,kind) ON DELETE RESTRICT,
  FOREIGN KEY(unlinked_event,request_id,id,buyer_id,unlinked_kind)
    REFERENCES staff_crm.events(id,request_id,link_id,buyer_id,kind) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX buyer_links_current ON staff_crm.buyer_links(request_id) WHERE unlinked_event IS NULL;
CREATE INDEX buyer_links_history ON staff_crm.buyer_links(buyer_id,request_id) WHERE unlinked_event IS NULL;

CREATE TABLE staff_crm.supplier_media_jobs (
  id uuid PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  request_digest text NOT NULL CHECK(request_digest ~ '^[0-9a-f]{64}$'),
  base_version timestamptz NOT NULL, saved_version timestamptz NOT NULL,
  field text NOT NULL CHECK(field IN ('logo_url','profile_image_url')),
  staged_key text NOT NULL UNIQUE, public_key text NOT NULL UNIQUE,
  source_digest text NOT NULL CHECK(source_digest ~ '^[0-9a-f]{64}$'),
  mime text NOT NULL CHECK(mime IN ('image/jpeg','image/png','image/webp')),
  byte_size integer NOT NULL CHECK(byte_size BETWEEN 1 AND 5242880),
  previous_url text, attached_version timestamptz,
  finish_result text CHECK(finish_result IN ('verified','copy_error','verification_failed')),
  finish_digest text CHECK(finish_digest ~ '^[0-9a-f]{64}$'),
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','copying','attached','superseded','failed')),
  lease_id uuid, lease_history uuid[] NOT NULL DEFAULT '{}', lease_until timestamptz, attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
  error_code text CHECK(error_code IN ('copy_error','verification_failed','version_conflict')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((state='copying')=(lease_until IS NOT NULL)),
  CHECK (cardinality(lease_history)=attempts AND (lease_id IS NULL OR lease_id=ANY(lease_history))),
  CHECK (state<>'copying' OR lease_id IS NOT NULL),
  CHECK ((state='attached')=(attached_version IS NOT NULL)),
  CHECK ((finish_result IS NOT DISTINCT FROM 'verified')=(finish_digest IS NOT NULL)),
  CHECK (staged_key='editor-staging/'||supplier_id||'/'||id||CASE mime WHEN 'image/jpeg' THEN '.jpg' WHEN 'image/png' THEN '.png' ELSE '.webp' END),
  CHECK (public_key='editor-uploads/'||supplier_id||'/'||field||'/'||id||CASE mime WHEN 'image/jpeg' THEN '.jpg' WHEN 'image/png' THEN '.png' ELSE '.webp' END)
);
CREATE INDEX supplier_media_pending ON staff_crm.supplier_media_jobs(state,lease_until,created_at);
CREATE UNIQUE INDEX supplier_media_active ON staff_crm.supplier_media_jobs(supplier_id)
  WHERE state IN ('pending','copying','failed');


-- Template is transaction-local, never holds data. An existing log must match the
-- complete supported contract, including its indexes, defaults and access controls.
CREATE TEMP TABLE gg_audit_contract (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email text NOT NULL,
  action_type text NOT NULL CHECK(action_type IN ('Create','Edit','Verify','Archive','Review','Approve','Reject','Convert','View','Contact','Complete','Close','Submit','Marked Featured','Removed Featured','Featured Expired','Featured Note Updated','Publish')),
  entity_type text NOT NULL CHECK(entity_type IN ('Farmer','Supplier','Marketplace Listing','Buyer Request','Farmer Application','Buyer Application','Supplier Application','Listing Submission','Buyer Request Submission','Buyer Request Application','Match Opportunity','Lead Request','Featured Enquiry','Success Story')),
  entity_id text, entity_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
) ON COMMIT DROP;
CREATE INDEX gg_expected_recent ON pg_temp.gg_audit_contract(created_at DESC);
CREATE INDEX gg_expected_entity ON pg_temp.gg_audit_contract(entity_type,entity_id);
DO $audit$
DECLARE
  log_oid oid := to_regclass('public.admin_activity_log');
  template_oid oid := 'pg_temp.gg_audit_contract'::regclass;
  mismatch boolean;
BEGIN
  IF log_oid IS NULL THEN
    CREATE TABLE public.admin_activity_log (LIKE pg_temp.gg_audit_contract INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
    ALTER TABLE public.admin_activity_log ADD PRIMARY KEY(id);
    CREATE INDEX admin_activity_log_created_at_idx ON public.admin_activity_log(created_at DESC);
    CREATE INDEX admin_activity_log_entity_idx ON public.admin_activity_log(entity_type,entity_id);
    ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.admin_activity_log FROM PUBLIC, anon, authenticated, service_role;
    GRANT SELECT, INSERT ON public.admin_activity_log TO service_role;
    log_oid := 'public.admin_activity_log'::regclass;
  END IF;
  -- Compare normalized catalog representations, including columns, constraints,
  -- PK, uniqueness, sort direction, predicates, opclasses and expression indexes.
  WITH shape AS (
    SELECT c.oid, jsonb_build_array(
      (SELECT jsonb_agg(jsonb_build_array(a.attname,a.atttypid,a.atttypmod,a.attnotnull,a.attidentity,a.attgenerated,a.attcollation,
              pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum)
       FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
       WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),
      (SELECT jsonb_agg(pg_get_constraintdef(k.oid) ORDER BY pg_get_constraintdef(k.oid))
       FROM pg_constraint k WHERE k.conrelid=c.oid),
      (SELECT jsonb_agg(substr(pg_get_indexdef(i.indexrelid),strpos(pg_get_indexdef(i.indexrelid),' USING '))
         ORDER BY substr(pg_get_indexdef(i.indexrelid),strpos(pg_get_indexdef(i.indexrelid),' USING ')))
       FROM pg_index i WHERE i.indrelid=c.oid)
    ) AS signature FROM pg_class c WHERE c.oid IN (log_oid,template_oid)
  ) SELECT count(DISTINCT signature)<>1 INTO mismatch FROM shape;
  IF mismatch OR NOT EXISTS (SELECT FROM pg_class WHERE oid=log_oid AND relkind='r'
     AND relpersistence='p' AND relrowsecurity AND relowner='postgres'::regrole AND NOT relispartition)
     OR EXISTS (SELECT FROM pg_policy WHERE polrelid=log_oid)
     OR EXISTS (SELECT FROM pg_index WHERE indrelid=log_oid AND (NOT indisvalid OR NOT indisready))
     OR EXISTS (SELECT FROM pg_trigger WHERE tgrelid=log_oid AND NOT tgisinternal)
     OR EXISTS (SELECT FROM pg_attribute WHERE attrelid=log_oid AND attacl IS NOT NULL)
     OR EXISTS (SELECT FROM pg_inherits WHERE inhrelid=log_oid OR inhparent=log_oid)
     OR EXISTS (SELECT FROM pg_class c, LATERAL aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) g
       WHERE c.oid=log_oid AND g.grantee<>c.relowner AND
       (g.grantee<>'service_role'::regrole OR g.privilege_type NOT IN ('SELECT','INSERT') OR g.is_grantable))
     OR NOT has_table_privilege('service_role',log_oid,'SELECT')
     OR NOT has_table_privilege('service_role',log_oid,'INSERT')
     OR NOT EXISTS (SELECT FROM pg_index WHERE indrelid=log_oid AND indexrelid=to_regclass('public.admin_activity_log_created_at_idx'))
     OR NOT EXISTS (SELECT FROM pg_index WHERE indrelid=log_oid AND indexrelid=to_regclass('public.admin_activity_log_entity_idx')) THEN
    RAISE EXCEPTION 'Existing admin_activity_log diverges; stop, preserve every row, review catalog';
  END IF;
END $audit$;

ALTER TABLE staff_crm.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_crm.buyer_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_crm.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_crm.buyer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_crm.supplier_media_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA staff_crm FROM PUBLIC,anon,authenticated,service_role,gg_staff_api;
GRANT SELECT,INSERT,UPDATE ON staff_crm.cases,staff_crm.supplier_media_jobs TO gg_staff_api;
GRANT SELECT,INSERT ON staff_crm.events,staff_crm.buyer_identities,staff_crm.buyer_links TO gg_staff_api;
GRANT UPDATE(unlinked_event) ON staff_crm.buyer_links TO gg_staff_api;
CREATE POLICY api_read ON staff_crm.cases FOR SELECT TO gg_staff_api USING(true);
CREATE POLICY api_insert ON staff_crm.cases FOR INSERT TO gg_staff_api WITH CHECK(true);
CREATE POLICY api_update ON staff_crm.cases FOR UPDATE TO gg_staff_api USING(true) WITH CHECK(true);
CREATE POLICY api_read ON staff_crm.supplier_media_jobs FOR SELECT TO gg_staff_api USING(true);
CREATE POLICY api_insert ON staff_crm.supplier_media_jobs FOR INSERT TO gg_staff_api WITH CHECK(true);
CREATE POLICY api_update ON staff_crm.supplier_media_jobs FOR UPDATE TO gg_staff_api USING(true) WITH CHECK(true);
CREATE POLICY api_read ON staff_crm.buyer_links FOR SELECT TO gg_staff_api USING(true);
CREATE POLICY api_insert ON staff_crm.buyer_links FOR INSERT TO gg_staff_api WITH CHECK(true);
CREATE POLICY api_update ON staff_crm.buyer_links FOR UPDATE TO gg_staff_api USING(true) WITH CHECK(true);
CREATE POLICY api_read ON staff_crm.events FOR SELECT TO gg_staff_api USING(true);
CREATE POLICY api_insert ON staff_crm.events FOR INSERT TO gg_staff_api WITH CHECK(true);
CREATE POLICY api_read ON staff_crm.buyer_identities FOR SELECT TO gg_staff_api USING(true);
CREATE POLICY api_insert ON staff_crm.buyer_identities FOR INSERT TO gg_staff_api WITH CHECK(true);

-- Server already reads contact details and queue summaries using the released staff-only route.
-- CRM touches only the legacy lead status; no reads of names, phone numbers, delivery or notes.
GRANT SELECT(id,created_at,updated_at,status),UPDATE(status)
  ON public.lead_requests TO gg_staff_api;
CREATE POLICY gg_staff_crm_read ON public.lead_requests FOR SELECT TO gg_staff_api USING(true);
CREATE POLICY gg_staff_crm_update ON public.lead_requests FOR UPDATE TO gg_staff_api USING(true) WITH CHECK(true);
-- Match the existing supplier editor field contract; image URL assignment is finish-only.
-- No privileges on status, verification_status, is_featured, launch_ready or other lifecycle controls.
GRANT SELECT(id,updated_at,logo_url,profile_image_url,slug,company_name,contact_person,region,district,category,products_services,service_coverage_area,whatsapp_number,phone,website,verification_notes,featured_until,featured_note,launch_status,profile_review_status,editorial_notes,launch_checklist,gg_standard_status),
      UPDATE(logo_url,profile_image_url,slug,company_name,contact_person,region,district,category,products_services,service_coverage_area,whatsapp_number,phone,website,verification_notes,featured_until,featured_note,launch_status,profile_review_status,editorial_notes,launch_checklist,gg_standard_status)
  ON public.suppliers TO gg_staff_api;
CREATE POLICY gg_staff_crm_read ON public.suppliers FOR SELECT TO gg_staff_api USING(true);
CREATE POLICY gg_staff_crm_update ON public.suppliers FOR UPDATE TO gg_staff_api USING(true) WITH CHECK(true);

-- Internal validators, not API operations. Missing, explicit null, empty strings,
-- unrecognized keys and wrong JSON types are rejected unless explicitly allowed.
CREATE FUNCTION staff_crm.keys_ok(j jsonb, required text[], optional text[] DEFAULT '{}') RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT coalesce(jsonb_typeof(j)='object' AND j ?& required AND
   (j - (required||optional))='{}'::jsonb AND octet_length(j::text)<=16384,false)
$$;
CREATE FUNCTION staff_crm.str(j jsonb,k text,lim integer) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE v text:=btrim(j->>k);
BEGIN
  IF jsonb_typeof(j->k) IS DISTINCT FROM 'string' OR length(v) NOT BETWEEN 1 AND lim THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='Invalid or missing text field: '||k;
  END IF;
  RETURN v;
END $$;
CREATE FUNCTION staff_crm.instant(j jsonb,k text) RETURNS timestamptz
LANGUAGE plpgsql STABLE SET search_path='' SET timezone='UTC' AS $$
DECLARE v text:=staff_crm.str(j,k,40);
BEGIN
  IF v !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{1,6})?(Z|[+-][0-9]{2}:[0-9]{2})$' THEN
    RAISE EXCEPTION 'Explicit ISO time with zone required' USING ERRCODE='22023';
  END IF;
  RETURN v::timestamptz;
END $$;
CREATE FUNCTION staff_crm.event_receipt(e staff_crm.events) RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT jsonb_build_object('result','saved','request_id',e.request_id,'operation_id',e.operation_id,
   'event_id',e.id,'version',e.version,'first_buyer_reply',e.first_buyer_reply,'link_id',e.link_id,'buyer_id',e.buyer_id)
$$;

CREATE FUNCTION staff_crm.event_keys_ok(p_kind text,p_input jsonb) RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE p_kind
    WHEN 'claim' THEN staff_crm.keys_ok(p_input,'{}')
    WHEN 'note' THEN staff_crm.keys_ok(p_input,'{note}')
    WHEN 'handover' THEN staff_crm.keys_ok(p_input,'{owner_id}','{note,next_action,due_at}')
    WHEN 'follow_up_set' THEN staff_crm.keys_ok(p_input,'{next_action,due_at}','{note}')
    WHEN 'follow_up_completed' THEN staff_crm.keys_ok(p_input,'{}','{note}')
    WHEN 'buyer_contact' THEN staff_crm.keys_ok(p_input,'{confirmed,reply,channel,occurred_at}')
    WHEN 'seller_contact' THEN staff_crm.keys_ok(p_input,'{confirmed,channel,occurred_at,seller_type,seller_id}')
    WHEN 'status' THEN staff_crm.keys_ok(p_input,'{status,lead_updated_at}','{outcome}')
    WHEN 'link' THEN (staff_crm.keys_ok(p_input,'{confirmed,buyer_id,reason}') OR staff_crm.keys_ok(p_input,'{confirmed,create_identity,reason}'))
    WHEN 'unlink' THEN staff_crm.keys_ok(p_input,'{confirmed,link_id,reason}')
    ELSE false END
$$;
ALTER TABLE staff_crm.events ADD CONSTRAINT events_closed_payload CHECK(staff_crm.event_keys_ok(kind,input));


CREATE FUNCTION staff_crm.staff_case_command(p_actor uuid,p_request uuid,p_operation uuid,p_expected_version bigint,p_kind text,p_input jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE
  c staff_crm.cases%ROWTYPE; e staff_crm.events%ROWTYPE; link_row staff_crm.buyer_links%ROWTYPE;
  received timestamptz; lead_version timestamptz;
  happened timestamptz:=clock_timestamp(); channel_value text; fid uuid; sid uuid;
  is_first boolean:=false; owner_value uuid; action_value text; due_value timestamptz;
  outcome_value text; change_follow boolean:=false; link_key uuid; identity_key uuid; allowed boolean;
BEGIN
  IF p_actor IS NULL OR p_request IS NULL OR p_operation IS NULL OR p_expected_version IS NULL OR p_expected_version<0
     OR p_kind IS NULL OR jsonb_typeof(p_input) IS DISTINCT FROM 'object' OR octet_length(p_input::text)>16384 THEN
    RAISE EXCEPTION 'Invalid command envelope' USING ERRCODE='22023';
  END IF;
  -- Cross-case serialization also covers two callers reusing one operation on different leads.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_operation::text,4811));
  SELECT * INTO e FROM staff_crm.events WHERE operation_id=p_operation;
  IF FOUND THEN
    IF (e.actor_id,e.request_id,e.kind,e.input,e.version-1)
       IS DISTINCT FROM (p_actor,p_request,p_kind,p_input,p_expected_version) THEN
      RAISE EXCEPTION 'Operation reused with different intent' USING ERRCODE='23505';
    END IF;
    RETURN staff_crm.event_receipt(e);
  END IF;
  SELECT created_at,updated_at INTO STRICT received,lead_version
    FROM public.lead_requests WHERE id=p_request FOR UPDATE;
  INSERT INTO staff_crm.cases(request_id) VALUES(p_request) ON CONFLICT(request_id) DO NOTHING;
  SELECT * INTO STRICT c FROM staff_crm.cases WHERE request_id=p_request FOR UPDATE;
  IF c.version<>p_expected_version THEN
    RAISE EXCEPTION 'Stale edit' USING ERRCODE='40001',DETAIL='current_version='||c.version;
  END IF;
  owner_value:=c.owner_id; action_value:=c.next_action; due_value:=c.due_at; outcome_value:=c.outcome;
  allowed:=staff_crm.event_keys_ok(p_kind,p_input);
  IF NOT allowed THEN RAISE EXCEPTION 'Invalid command kind or keys' USING ERRCODE='22023'; END IF;
  IF p_input ? 'note' THEN PERFORM staff_crm.str(p_input,'note',2000); END IF;
  IF p_input ? 'confirmed' AND (p_input->'confirmed') IS DISTINCT FROM 'true'::jsonb THEN
    RAISE EXCEPTION 'Explicit human confirmation required' USING ERRCODE='22023';
  END IF;

  CASE p_kind
    WHEN 'claim' THEN
      IF c.owner_id IS NOT NULL THEN RAISE EXCEPTION 'Already claimed' USING ERRCODE='40001'; END IF;
      owner_value:=p_actor;
    WHEN 'handover' THEN
      IF c.owner_id IS DISTINCT FROM p_actor THEN RAISE EXCEPTION 'Only the current owner can hand over' USING ERRCODE='42501'; END IF;
      -- Server must authorize nominated recipient using current trusted staff entitlement.
      owner_value:=staff_crm.str(p_input,'owner_id',36)::uuid;
      IF (p_input ? 'next_action')<>(p_input ? 'due_at') THEN RAISE EXCEPTION 'Supply both follow-up fields' USING ERRCODE='22023'; END IF;
      change_follow:=p_input ? 'next_action';
    WHEN 'note' THEN NULL; -- append-only note text is in this event's validated input
    WHEN 'follow_up_set' THEN change_follow:=true;
    WHEN 'follow_up_completed' THEN
      IF c.next_action IS NULL THEN RAISE EXCEPTION 'No open follow-up' USING ERRCODE='22023'; END IF;
      action_value:=NULL; due_value:=NULL;
    WHEN 'buyer_contact','seller_contact' THEN
      happened:=staff_crm.instant(p_input,'occurred_at'); channel_value:=staff_crm.str(p_input,'channel',12);
      IF happened<received OR happened>clock_timestamp() OR channel_value NOT IN ('whatsapp','phone','email','other') THEN
        RAISE EXCEPTION 'Invalid contact time or channel' USING ERRCODE='22023';
      END IF;
      IF p_kind='buyer_contact' THEN
        IF jsonb_typeof(p_input->'reply') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Explicit reply flag required' USING ERRCODE='22023'; END IF;
        is_first:=(p_input->'reply')='true'::jsonb AND NOT EXISTS(SELECT FROM staff_crm.events WHERE request_id=p_request AND first_buyer_reply);
      ELSIF p_input->>'seller_type'='farmer' THEN
        -- The staff gateway resolves the permitted candidate first. This typed FK
        -- checks existence again at INSERT, including a concurrent deletion.
        fid:=staff_crm.str(p_input,'seller_id',36)::uuid;
      ELSIF p_input->>'seller_type'='supplier' THEN
        sid:=staff_crm.str(p_input,'seller_id',36)::uuid;
      ELSE RAISE EXCEPTION 'Invalid seller type' USING ERRCODE='22023'; END IF;
    WHEN 'status' THEN
      IF staff_crm.instant(p_input,'lead_updated_at')<>lead_version THEN RAISE EXCEPTION 'Lead changed' USING ERRCODE='40001'; END IF;
      IF staff_crm.str(p_input,'status',20) NOT IN ('New','Contacted','Negotiating','Completed','Lost') THEN RAISE EXCEPTION 'Unknown status' USING ERRCODE='22023'; END IF;
      IF p_input ? 'outcome' THEN outcome_value:=staff_crm.str(p_input,'outcome',300); END IF;
      UPDATE public.lead_requests SET status=p_input->>'status' WHERE id=p_request AND updated_at=lead_version;
      IF NOT FOUND THEN RAISE EXCEPTION 'Lead changed' USING ERRCODE='40001'; END IF;
    WHEN 'link' THEN
      PERFORM staff_crm.str(p_input,'reason',300);
      IF EXISTS(SELECT FROM staff_crm.buyer_links WHERE request_id=p_request AND unlinked_event IS NULL) THEN
        RAISE EXCEPTION 'Unlink the current identity first' USING ERRCODE='23505';
      END IF;
      IF p_input ? 'create_identity' THEN
        IF (p_input->'create_identity') IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'Explicit creation required' USING ERRCODE='22023'; END IF;
        INSERT INTO staff_crm.buyer_identities(created_by) VALUES(p_actor) RETURNING id INTO identity_key;
      ELSE identity_key:=staff_crm.str(p_input,'buyer_id',36)::uuid; END IF;
      link_key:=gen_random_uuid();
    WHEN 'unlink' THEN
      PERFORM staff_crm.str(p_input,'reason',300);
      SELECT * INTO STRICT link_row FROM staff_crm.buyer_links
        WHERE id=staff_crm.str(p_input,'link_id',36)::uuid AND request_id=p_request AND unlinked_event IS NULL FOR UPDATE;
      link_key:=link_row.id; identity_key:=link_row.buyer_id;
  END CASE;
  IF change_follow THEN
    action_value:=staff_crm.str(p_input,'next_action',300);
    due_value:=staff_crm.instant(p_input,'due_at');
  END IF;
  INSERT INTO staff_crm.events(operation_id,request_id,actor_id,version,kind,input,occurred_at,channel,farmer_id,supplier_id,first_buyer_reply,link_id,buyer_id)
    VALUES(p_operation,p_request,p_actor,c.version+1,p_kind,p_input,happened,channel_value,fid,sid,is_first,link_key,identity_key)
    RETURNING * INTO e;
  IF p_kind='link' THEN
    INSERT INTO staff_crm.buyer_links(id,buyer_id,request_id,confirmed_event) VALUES(link_key,identity_key,p_request,e.id);
  ELSIF p_kind='unlink' THEN
    UPDATE staff_crm.buyer_links SET unlinked_event=e.id WHERE id=link_key AND unlinked_event IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Buyer link changed' USING ERRCODE='40001'; END IF;
  END IF;
  UPDATE staff_crm.cases SET version=e.version,owner_id=owner_value,next_action=action_value,due_at=due_value,
    outcome=outcome_value,updated_at=e.recorded_at WHERE request_id=p_request AND version=c.version;
  IF NOT FOUND THEN RAISE EXCEPTION 'Case changed' USING ERRCODE='40001'; END IF;
  RETURN staff_crm.event_receipt(e);
END $$;

-- Unexposed invoker helper. Only the operation owner can call it. Summaries
-- come exclusively from actual confirmed seller events, never source or match fields.
CREATE FUNCTION staff_crm.sellers_contacted(p_request uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'seller_type',s.seller_type,'seller_id',s.seller_id,
    'contact_count',s.contact_count,'last_contact_at',s.last_contact_at)
    ORDER BY s.last_contact_at DESC,s.seller_type,s.seller_id),'[]'::jsonb)
  FROM (
    SELECT CASE WHEN farmer_id IS NOT NULL THEN 'farmer' ELSE 'supplier' END AS seller_type,
      coalesce(farmer_id,supplier_id) AS seller_id,count(*) AS contact_count,max(occurred_at) AS last_contact_at
    FROM staff_crm.events WHERE request_id=p_request AND kind='seller_contact'
    GROUP BY farmer_id,supplier_id
  ) AS s
$$;

CREATE FUNCTION staff_crm.staff_case_read(p_actor uuid,p_request uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
  IF p_actor IS NULL OR p_request IS NULL THEN RAISE EXCEPTION 'Missing trusted context' USING ERRCODE='22023'; END IF;
  SELECT jsonb_build_object('request_id',l.id,'received_at',l.created_at,'status',l.status,'lead_updated_at',l.updated_at,
    'version',coalesce(c.version,0),'owner_id',c.owner_id,'next_action',c.next_action,'due_at',c.due_at,'outcome',c.outcome,
    'first_reply',(SELECT jsonb_build_object('actor_id',actor_id,'occurred_at',occurred_at,'recorded_at',recorded_at,'channel',channel)
                   FROM staff_crm.events WHERE request_id=l.id AND first_buyer_reply),
    'latest_note',(SELECT jsonb_build_object('text',input->>'note','actor_id',actor_id,'recorded_at',recorded_at)
                   FROM staff_crm.events WHERE request_id=l.id AND input ? 'note' ORDER BY version DESC LIMIT 1),
    'timeline',coalesce((SELECT jsonb_agg(to_jsonb(e)-'operation_id' ORDER BY e.version DESC)
                         FROM staff_crm.events e WHERE e.request_id=l.id),'[]'::jsonb),
    'sellers_contacted',staff_crm.sellers_contacted(l.id),
    'link_id',bl.id,'buyer_id',bl.buyer_id,'confirmed_history',coalesce((SELECT jsonb_agg(
       jsonb_build_object('request_id',h.request_id,'received_at',prior.created_at,'status',prior.status,
         'sellers_contacted',staff_crm.sellers_contacted(h.request_id)) ORDER BY prior.created_at DESC)
       FROM staff_crm.buyer_links h JOIN public.lead_requests prior ON prior.id=h.request_id
       WHERE h.buyer_id=bl.buyer_id AND h.request_id<>l.id AND h.unlinked_event IS NULL),'[]'::jsonb))
  INTO STRICT result FROM public.lead_requests l LEFT JOIN staff_crm.cases c ON c.request_id=l.id
  LEFT JOIN staff_crm.buyer_links bl ON bl.request_id=l.id AND bl.unlinked_event IS NULL WHERE l.id=p_request;
  RETURN result;
END $$;

CREATE FUNCTION staff_crm.staff_today(p_actor uuid,p_now timestamptz) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
BEGIN
  IF p_actor IS NULL OR p_now IS NULL OR NOT isfinite(p_now) THEN RAISE EXCEPTION 'Missing trusted actor or clock' USING ERRCODE='22023'; END IF;
  -- Application joins these private references to its existing authorized queue reads.
  -- Unanswered receipts are candidates only; the versioned Ghana calendar and evidence
  -- cutoff determine reminder/overdue. No holiday guesses or historical backfill.
  RETURN jsonb_build_object('as_of',p_now,'my_follow_ups',coalesce((SELECT jsonb_agg(
    jsonb_build_object('request_id',request_id,'version',version,'next_action',next_action,'due_at',due_at)
    ORDER BY due_at,request_id) FROM staff_crm.cases WHERE owner_id=p_actor AND due_at < date_trunc('day',p_now)+interval '1 day'),'[]'::jsonb),
    'unanswered_receipts',coalesce((SELECT jsonb_agg(jsonb_build_object('request_id',l.id,'received_at',l.created_at)
    ORDER BY l.created_at,l.id) FROM public.lead_requests l WHERE l.created_at<=p_now
    AND NOT EXISTS (SELECT FROM staff_crm.events e WHERE e.request_id=l.id AND e.first_buyer_reply)),'[]'::jsonb));
END $$;


-- Additional final two private parameters are observed catalog facts. Only the
-- public invoker wrapper looks at storage metadata, using the existing service role.
CREATE FUNCTION staff_crm.staff_supplier_media_save(p_actor uuid,p_supplier uuid,p_operation uuid,p_base_version timestamptz,
  p_field text,p_staged_key text,p_digest text,p_profile_patch jsonb,p_source_mime text,p_source_size bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE j staff_crm.supplier_media_jobs%ROWTYPE; fingerprint text; prior_url text; prior_version timestamptz;
  saved timestamptz; dest text; ext text; key text; val text; n integer;
BEGIN
  IF p_actor IS NULL OR p_supplier IS NULL OR p_operation IS NULL OR p_base_version IS NULL OR NOT isfinite(p_base_version)
    OR p_field IS NULL OR p_field NOT IN ('logo_url','profile_image_url') OR p_digest IS NULL OR p_digest !~ '^[0-9a-f]{64}$'
    OR p_staged_key IS NULL OR NOT staff_crm.keys_ok(p_profile_patch,'{}','{slug,company_name,contact_person,region,district,category,products_services,service_coverage_area,whatsapp_number,phone,website,verification_notes,featured_until,featured_note,launch_status,profile_review_status,editorial_notes,launch_checklist,gg_standard_status}') THEN
    RAISE EXCEPTION 'Invalid media Save envelope or unsupported patch' USING ERRCODE='22023';
  END IF;
  FOR key IN SELECT jsonb_object_keys(p_profile_patch) LOOP
    IF key='products_services' THEN
      IF jsonb_typeof(p_profile_patch->key)<>'array' THEN RAISE EXCEPTION 'Expected products list' USING ERRCODE='22023'; END IF;
      IF jsonb_array_length(p_profile_patch->key)>80 OR EXISTS(SELECT FROM jsonb_array_elements(p_profile_patch->key) t(v)
        WHERE jsonb_typeof(v)<>'string' OR length(btrim(v #>> '{}')) NOT BETWEEN 1 AND 200) THEN
        RAISE EXCEPTION 'Invalid products list' USING ERRCODE='22023'; END IF;
    ELSIF key='launch_checklist' THEN
      IF NOT staff_crm.keys_ok(p_profile_patch->key,'{approvedNoPhoto}') OR
         (p_profile_patch->key->'approvedNoPhoto') IS DISTINCT FROM 'false'::jsonb THEN
        RAISE EXCEPTION 'Photo Save permits only approvedNoPhoto=false; other checklist values are preserved' USING ERRCODE='22023'; END IF;
    ELSIF p_profile_patch->key='null'::jsonb THEN
      IF key NOT IN ('slug','service_coverage_area','whatsapp_number','phone','website','verification_notes','featured_until','featured_note','editorial_notes')
        THEN RAISE EXCEPTION 'Required profile field is null' USING ERRCODE='22023'; END IF;
    ELSE
      n:=CASE WHEN key IN ('editorial_notes','verification_notes','featured_note','website') THEN 2000
              WHEN key='service_coverage_area' THEN 500 WHEN key IN ('phone','whatsapp_number') THEN 64 ELSE 200 END;
      val:=staff_crm.str(p_profile_patch,key,n);
      IF (key='slug' AND val !~ '^[a-z0-9]+(-[a-z0-9]+)*$')
        OR (key='featured_until' AND val !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
        OR (key='website' AND val !~* '^https?://[^[:space:]]+$')
        OR (key='category' AND val NOT IN ('Seeds','Fertilizers','Agrochemicals','Farm Equipment','Irrigation Systems','Packaging','Logistics','Storage','Financial Services','Agricultural Consulting'))
        OR (key='launch_status' AND val NOT IN ('Public Supplier','Featured Supplier','Founding Supplier 2026','Needs Improvement','Hold'))
        OR (key='profile_review_status' AND val NOT IN ('Needs Review','In Review','Ready','Hold'))
        OR (key='gg_standard_status' AND val NOT IN ('Pending','Member','Suspended')) THEN
        RAISE EXCEPTION 'Invalid profile field: %',key USING ERRCODE='22023';
      END IF;
    END IF;
  END LOOP;
  fingerprint:=encode(sha256(convert_to(jsonb_build_array(p_actor,p_supplier,p_operation,p_base_version,p_field,
    p_staged_key,p_digest,p_profile_patch)::text,'UTF8')),'hex');
  PERFORM pg_advisory_xact_lock(hashtextextended(p_operation::text,4812));
  SELECT * INTO j FROM staff_crm.supplier_media_jobs WHERE id=p_operation;
  IF FOUND THEN
    IF j.request_digest<>fingerprint THEN RAISE EXCEPTION 'Media operation reused with different intent' USING ERRCODE='23505'; END IF;
    -- Even after successful cleanup or supersession, replay returns the SAME Save receipt.
    RETURN jsonb_build_object('result','saved','job_id',j.id,'supplier_id',j.supplier_id,'saved_version',j.saved_version);
  END IF;
  ext:=CASE p_source_mime WHEN 'image/jpeg' THEN '.jpg' WHEN 'image/png' THEN '.png' WHEN 'image/webp' THEN '.webp' END;
  IF ext IS NULL OR p_source_size IS NULL OR p_source_size NOT BETWEEN 1 AND 5242880
    OR p_staged_key IS DISTINCT FROM ('editor-staging/'||p_supplier||'/'||p_operation||ext) THEN
    RAISE EXCEPTION 'Private staged image missing or invalid' USING ERRCODE='22023';
  END IF;
  dest:='editor-uploads/'||p_supplier||'/'||p_field||'/'||p_operation||ext;
  SELECT updated_at,CASE p_field WHEN 'logo_url' THEN logo_url ELSE profile_image_url END
    INTO STRICT prior_version,prior_url FROM public.suppliers WHERE id=p_supplier FOR UPDATE;
  IF prior_version<>p_base_version THEN RAISE EXCEPTION 'Supplier profile changed' USING ERRCODE='40001'; END IF;
  UPDATE public.suppliers SET
    slug=CASE WHEN p_profile_patch ? 'slug' THEN btrim(p_profile_patch->>'slug') ELSE slug END,
    company_name=CASE WHEN p_profile_patch ? 'company_name' THEN btrim(p_profile_patch->>'company_name') ELSE company_name END,
    contact_person=CASE WHEN p_profile_patch ? 'contact_person' THEN btrim(p_profile_patch->>'contact_person') ELSE contact_person END,
    region=CASE WHEN p_profile_patch ? 'region' THEN btrim(p_profile_patch->>'region') ELSE region END,
    district=CASE WHEN p_profile_patch ? 'district' THEN btrim(p_profile_patch->>'district') ELSE district END,
    category=CASE WHEN p_profile_patch ? 'category' THEN btrim(p_profile_patch->>'category') ELSE category END,
    products_services=CASE WHEN p_profile_patch ? 'products_services' THEN ARRAY(SELECT btrim(x) FROM jsonb_array_elements_text(p_profile_patch->'products_services') WITH ORDINALITY a(x,ord) GROUP BY btrim(x) ORDER BY min(ord)) ELSE products_services END,
    service_coverage_area=CASE WHEN p_profile_patch ? 'service_coverage_area' THEN btrim(p_profile_patch->>'service_coverage_area') ELSE service_coverage_area END,
    whatsapp_number=CASE WHEN p_profile_patch ? 'whatsapp_number' THEN btrim(p_profile_patch->>'whatsapp_number') ELSE whatsapp_number END,
    phone=CASE WHEN p_profile_patch ? 'phone' THEN btrim(p_profile_patch->>'phone') ELSE phone END,
    website=CASE WHEN p_profile_patch ? 'website' THEN btrim(p_profile_patch->>'website') ELSE website END,
    verification_notes=CASE WHEN p_profile_patch ? 'verification_notes' THEN btrim(p_profile_patch->>'verification_notes') ELSE verification_notes END,
    featured_until=CASE WHEN p_profile_patch ? 'featured_until' THEN btrim(p_profile_patch->>'featured_until')::date ELSE featured_until END,
    featured_note=CASE WHEN p_profile_patch ? 'featured_note' THEN btrim(p_profile_patch->>'featured_note') ELSE featured_note END,
    launch_status=CASE WHEN p_profile_patch ? 'launch_status' THEN btrim(p_profile_patch->>'launch_status') ELSE launch_status END,
    profile_review_status=CASE WHEN p_profile_patch ? 'profile_review_status' THEN btrim(p_profile_patch->>'profile_review_status') ELSE profile_review_status END,
    editorial_notes=CASE WHEN p_profile_patch ? 'editorial_notes' THEN btrim(p_profile_patch->>'editorial_notes') ELSE editorial_notes END,
    launch_checklist=CASE WHEN p_profile_patch ? 'launch_checklist' THEN coalesce(launch_checklist,'{}'::jsonb)||(p_profile_patch->'launch_checklist') ELSE launch_checklist END,
    gg_standard_status=CASE WHEN p_profile_patch ? 'gg_standard_status' THEN btrim(p_profile_patch->>'gg_standard_status') ELSE gg_standard_status END
    WHERE id=p_supplier AND updated_at=p_base_version RETURNING updated_at INTO saved;
  IF NOT FOUND OR saved<=p_base_version THEN RAISE EXCEPTION 'Supplier version did not advance; retry in a fresh transaction' USING ERRCODE='40001'; END IF;
  UPDATE staff_crm.supplier_media_jobs SET state='superseded',lease_until=NULL,error_code='version_conflict',updated_at=clock_timestamp()
    WHERE supplier_id=p_supplier AND state IN ('pending','copying','failed');
  INSERT INTO staff_crm.supplier_media_jobs(id,supplier_id,actor_id,request_digest,base_version,saved_version,field,
    staged_key,public_key,source_digest,mime,byte_size,previous_url)
    VALUES(p_operation,p_supplier,p_actor,fingerprint,p_base_version,saved,p_field,p_staged_key,dest,p_digest,p_source_mime,p_source_size,prior_url);
  RETURN jsonb_build_object('result','saved','job_id',p_operation,'supplier_id',p_supplier,'saved_version',saved);
END $$;

CREATE FUNCTION staff_crm.staff_supplier_media_lease(p_job uuid,p_lease uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j staff_crm.supplier_media_jobs%ROWTYPE; t timestamptz;
BEGIN
  IF p_lease IS NULL THEN RAISE EXCEPTION 'Fresh worker lease UUID required' USING ERRCODE='22023'; END IF;
  -- Serialize replays of the same lease; a retry after unknown acquisition must reuse it.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_lease::text,4813));
  SELECT * INTO j FROM staff_crm.supplier_media_jobs WHERE p_lease=ANY(lease_history) FOR UPDATE;
  IF FOUND THEN
    IF p_job IS NOT NULL AND p_job<>j.id THEN RAISE EXCEPTION 'Lease belongs to another job' USING ERRCODE='23505'; END IF;
    IF j.lease_id IS DISTINCT FROM p_lease OR j.state<>'copying' OR j.lease_until<=clock_timestamp() THEN RETURN jsonb_build_object('result','lease_inactive','job_id',j.id); END IF;
  ELSE
    SELECT * INTO j FROM staff_crm.supplier_media_jobs
      WHERE (p_job IS NULL OR id=p_job) AND (state IN ('pending','failed') OR (state='copying' AND lease_until<=clock_timestamp()))
        AND (attempts<3 OR p_job IS NOT NULL)
      ORDER BY created_at,id LIMIT 1 FOR UPDATE SKIP LOCKED;
    IF NOT FOUND THEN RETURN jsonb_build_object('result','no_work'); END IF;
    t:=clock_timestamp();
    UPDATE staff_crm.supplier_media_jobs SET state='copying',lease_id=p_lease,lease_history=array_append(lease_history,p_lease),lease_until=t+interval '2 minutes',
      attempts=attempts+1,updated_at=t,error_code=NULL,finish_result=NULL,finish_digest=NULL WHERE id=j.id RETURNING * INTO j;
  END IF;
  RETURN jsonb_build_object('result','leased','job_id',j.id,'supplier_id',j.supplier_id,'lease_id',j.lease_id,'lease_until',j.lease_until,
    'staged_key',j.staged_key,'public_key',j.public_key,'digest',j.source_digest,'mime',j.mime,'bytes',j.byte_size);
END $$;
CREATE UNIQUE INDEX supplier_media_lease_token ON staff_crm.supplier_media_jobs(lease_id) WHERE lease_id IS NOT NULL;

CREATE FUNCTION staff_crm.staff_supplier_media_finish(p_job uuid,p_lease uuid,p_verified_digest text,p_result text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j staff_crm.supplier_media_jobs%ROWTYPE; sid uuid; current_version timestamptz; attached timestamptz; uri text;
BEGIN
  IF p_job IS NULL OR p_lease IS NULL OR p_result IS NULL OR p_result NOT IN ('verified','copy_error','verification_failed')
    OR (p_result='verified' AND (p_verified_digest IS NULL OR p_verified_digest !~ '^[0-9a-f]{64}$'))
    OR (p_result<>'verified' AND p_verified_digest IS NOT NULL) THEN RAISE EXCEPTION 'Invalid finish evidence' USING ERRCODE='22023'; END IF;
  SELECT supplier_id INTO STRICT sid FROM staff_crm.supplier_media_jobs WHERE id=p_job;
  -- Same lock order as Save. A concurrent edit cannot slip in between the version test and attachment.
  SELECT updated_at INTO STRICT current_version FROM public.suppliers WHERE id=sid FOR UPDATE;
  SELECT * INTO STRICT j FROM staff_crm.supplier_media_jobs WHERE id=p_job FOR UPDATE;
  IF j.lease_id IS DISTINCT FROM p_lease THEN RAISE EXCEPTION 'Stale worker' USING ERRCODE='40001'; END IF;
  IF j.state='attached' AND p_result='verified' AND j.source_digest=p_verified_digest THEN
    RETURN jsonb_build_object('result','attached','job_id',j.id,'version',j.attached_version);
  END IF;
  IF j.state='failed' AND (j.finish_result,j.finish_digest) IS NOT DISTINCT FROM (p_result,p_verified_digest) THEN RETURN jsonb_build_object('result','failed','job_id',j.id); END IF;
  IF j.state='superseded' THEN RETURN jsonb_build_object('result','superseded','job_id',j.id); END IF;
  IF j.state<>'copying' OR j.lease_until<=clock_timestamp() THEN RAISE EXCEPTION 'Lease inactive or expired' USING ERRCODE='40001'; END IF;
  IF current_version<>j.saved_version THEN
    UPDATE staff_crm.supplier_media_jobs SET state='superseded',error_code='version_conflict',lease_until=NULL,updated_at=clock_timestamp() WHERE id=j.id;
    RETURN jsonb_build_object('result','superseded','job_id',j.id);
  END IF;
  IF p_result<>'verified' OR j.source_digest IS DISTINCT FROM p_verified_digest THEN
    UPDATE staff_crm.supplier_media_jobs SET state='failed',finish_result=p_result,finish_digest=p_verified_digest,error_code=CASE WHEN p_result='copy_error' THEN 'copy_error' ELSE 'verification_failed' END,
      lease_until=NULL,updated_at=clock_timestamp() WHERE id=j.id;
    RETURN jsonb_build_object('result','failed','job_id',j.id);
  END IF;
  -- Fixed Production origin. SQL trusts only a privileged worker that has re-downloaded
  -- the destination bytes and checked their SHA-256, magic, MIME and byte count.
  uri:='https://bfasogvmesswweribsji.supabase.co/storage/v1/object/public/suppliers/'||j.public_key;
  IF j.field='logo_url' THEN
    UPDATE public.suppliers SET logo_url=uri,launch_checklist=coalesce(launch_checklist,'{}'::jsonb)||'{"approvedNoPhoto":false}'::jsonb WHERE id=sid AND updated_at=j.saved_version AND logo_url IS NOT DISTINCT FROM j.previous_url RETURNING updated_at INTO attached;
  ELSE
    UPDATE public.suppliers SET profile_image_url=uri,launch_checklist=coalesce(launch_checklist,'{}'::jsonb)||'{"approvedNoPhoto":false}'::jsonb WHERE id=sid AND updated_at=j.saved_version AND profile_image_url IS NOT DISTINCT FROM j.previous_url RETURNING updated_at INTO attached;
  END IF;
  IF NOT FOUND OR attached<=j.saved_version THEN RAISE EXCEPTION 'Attach conflict' USING ERRCODE='40001'; END IF;
  UPDATE staff_crm.supplier_media_jobs SET state='attached',attached_version=attached,lease_until=NULL,error_code=NULL,finish_result=p_result,finish_digest=p_verified_digest,updated_at=clock_timestamp() WHERE id=j.id;
  RETURN jsonb_build_object('result','attached','job_id',j.id,'version',attached);
END $$;


CREATE FUNCTION public.staff_case_command(p_actor uuid,p_request uuid,p_operation uuid,p_expected_version bigint,p_kind text,p_input jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT staff_crm.staff_case_command(p_actor,p_request,p_operation,p_expected_version,p_kind,p_input)
$$;

CREATE FUNCTION public.staff_case_read(p_actor uuid,p_request uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT staff_crm.staff_case_read(p_actor,p_request)
$$;

CREATE FUNCTION public.staff_today(p_actor uuid,p_now timestamptz) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT staff_crm.staff_today(p_actor,p_now)
$$;

CREATE FUNCTION public.staff_supplier_media_save(p_actor uuid,p_supplier uuid,p_operation uuid,p_base_version timestamptz,p_field text,p_staged_key text,p_digest text,p_profile_patch jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  -- service_role already has metadata SELECT. Never grant gg_staff_api storage
  -- table rights. Ignore user_metadata and accept only the live private source.
  SELECT staff_crm.staff_supplier_media_save(p_actor,p_supplier,p_operation,p_base_version,p_field,p_staged_key,p_digest,p_profile_patch,o.mime,o.bytes)
  FROM (VALUES(1)) anchor(n) LEFT JOIN LATERAL (
    SELECT max(metadata->>'mimetype') AS mime,
      max(CASE WHEN metadata->>'size' ~ '^[0-9]{1,9}$' THEN (metadata->>'size')::bigint END) AS bytes
    FROM storage.objects WHERE bucket_id='supplier-application-media' AND name=p_staged_key
      AND archived_at IS NULL AND is_delete_marker IS NOT TRUE HAVING count(*)=1
  ) o ON true
$$;

CREATE FUNCTION public.staff_supplier_media_lease(p_job uuid,p_lease uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT staff_crm.staff_supplier_media_lease(p_job,p_lease)
$$;

CREATE FUNCTION public.staff_supplier_media_finish(p_job uuid,p_lease uuid,p_verified_digest text,p_result text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT staff_crm.staff_supplier_media_finish(p_job,p_lease,p_verified_digest,p_result)
$$;

-- Restrict new routines inside the same transaction. No changes to project-wide
-- default privileges or to the grants on any other public routine.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA staff_crm FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.staff_case_command(uuid,uuid,uuid,bigint,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.staff_case_command(uuid,uuid,uuid,bigint,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION staff_crm.staff_case_command(uuid,uuid,uuid,bigint,text,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.staff_case_read(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.staff_case_read(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION staff_crm.staff_case_read(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.staff_today(uuid,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.staff_today(uuid,timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION staff_crm.staff_today(uuid,timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.staff_supplier_media_save(uuid,uuid,uuid,timestamptz,text,text,text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.staff_supplier_media_save(uuid,uuid,uuid,timestamptz,text,text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION staff_crm.staff_supplier_media_save(uuid,uuid,uuid,timestamptz,text,text,text,jsonb,text,bigint) TO service_role;
REVOKE ALL ON FUNCTION public.staff_supplier_media_lease(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.staff_supplier_media_lease(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION staff_crm.staff_supplier_media_lease(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.staff_supplier_media_finish(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.staff_supplier_media_finish(uuid,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION staff_crm.staff_supplier_media_finish(uuid,uuid,text,text) TO service_role;
ALTER FUNCTION staff_crm.event_keys_ok(text,jsonb) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.keys_ok(jsonb,text[],text[]) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.str(jsonb,text,integer) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.instant(jsonb,text) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.event_receipt(staff_crm.events) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.sellers_contacted(uuid) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.staff_case_command(uuid,uuid,uuid,bigint,text,jsonb) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.staff_case_read(uuid,uuid) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.staff_today(uuid,timestamptz) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.staff_supplier_media_save(uuid,uuid,uuid,timestamptz,text,text,text,jsonb,text,bigint) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.staff_supplier_media_lease(uuid,uuid) OWNER TO gg_staff_api;
ALTER FUNCTION staff_crm.staff_supplier_media_finish(uuid,uuid,text,text) OWNER TO gg_staff_api;
REVOKE CREATE ON SCHEMA staff_crm FROM gg_staff_api;
REVOKE gg_staff_api FROM postgres GRANTED BY postgres;

-- Abort on ambient/default ACLs outside the reviewed contract.
DO $verify$
DECLARE f record; t record; r name;
BEGIN
  IF has_schema_privilege('gg_staff_api','public','CREATE') OR has_schema_privilege('gg_staff_api','staff_crm','CREATE')
    OR has_schema_privilege('service_role','staff_crm','CREATE') THEN RAISE EXCEPTION 'Unexpected schema CREATE privilege'; END IF;
  FOR f IN SELECT p.oid,p.proname,p.proowner,p.prosecdef,p.proconfig,p.proacl,n.nspname
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='staff_crm'
    OR (n.nspname='public' AND p.proname IN ('staff_case_command','staff_case_read','staff_today','staff_supplier_media_save','staff_supplier_media_lease','staff_supplier_media_finish')) LOOP
    IF f.prosecdef IS DISTINCT FROM (f.nspname='staff_crm' AND f.proname LIKE 'staff_%')
      OR (f.nspname='staff_crm' AND f.proowner<>'gg_staff_api'::regrole)
      OR has_function_privilege('anon',f.oid,'EXECUTE') OR has_function_privilege('authenticated',f.oid,'EXECUTE')
      OR has_function_privilege('service_role',f.oid,'EXECUTE') IS DISTINCT FROM (f.proname LIKE 'staff_%')
      OR EXISTS(SELECT FROM aclexplode(coalesce(f.proacl,acldefault('f',f.proowner))) a
        WHERE a.grantee<>f.proowner AND (a.grantee<>'service_role'::regrole OR a.is_grantable)) THEN
      RAISE EXCEPTION 'Unexpected routine privilege on %',f.proname;
    END IF;
  END LOOP;
  FOR t IN SELECT c.oid,c.relowner,c.relacl,c.relrowsecurity FROM pg_class c WHERE c.relnamespace='staff_crm'::regnamespace AND c.relkind='r' LOOP
    IF t.relowner<>'postgres'::regrole OR NOT t.relrowsecurity OR EXISTS(SELECT FROM aclexplode(coalesce(t.relacl,acldefault('r',t.relowner))) a
        WHERE a.grantee<>t.relowner AND (a.grantee<>'gg_staff_api'::regrole OR a.is_grantable)) THEN RAISE EXCEPTION 'Unexpected private table owner, ACL or RLS'; END IF;
    FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role']::name[] LOOP
      IF has_any_column_privilege(r,t.oid,'SELECT,INSERT,UPDATE,REFERENCES') OR has_table_privilege(r,t.oid,'DELETE,TRUNCATE,TRIGGER,MAINTAIN') THEN
        RAISE EXCEPTION 'Direct private relation rights for %',r;
      END IF;
    END LOOP;
  END LOOP;
  IF EXISTS(SELECT FROM pg_auth_members WHERE member='gg_staff_api'::regrole OR (roleid='gg_staff_api'::regrole AND NOT (member='postgres'::regrole AND admin_option AND NOT inherit_option AND NOT set_option))) THEN
    RAISE EXCEPTION 'Unexpected role membership';
  END IF;
END $verify$;
COMMIT;

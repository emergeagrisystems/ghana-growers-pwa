-- Read-only precheck. Returns metadata and aggregate estimates only.
select
  sm.version,
  to_jsonb(sm)->>'name' as name,
  to_jsonb(sm)->>'inserted_at' as inserted_at
from supabase_migrations.schema_migrations sm
order by sm.version;

select
  to_regclass('public.contact_enquiries') is not null as contact_enquiries_exists,
  coalesce(c.reltuples::bigint, 0) as estimated_existing_rows
from (select 1) seed
left join pg_class c on c.oid = to_regclass('public.contact_enquiries');

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'contact_enquiries'
order by ordinal_position;

select
  c.conname as constraint_name,
  c.contype as constraint_type,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
where c.conrelid = to_regclass('public.contact_enquiries')
order by c.conname;

select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
where c.oid = to_regclass('public.contact_enquiries');

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'contact_enquiries'
order by grantee, privilege_type;

select policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'contact_enquiries'
order by policyname;

select
  to_regprocedure('public.consume_lead_request_rate_limit(text,integer,integer)') is not null
    as durable_rate_limit_function_exists;

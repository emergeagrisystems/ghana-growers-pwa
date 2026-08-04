-- Read-only verification. Does not return names, contact details, messages, tokens or UUIDs.
select
  sm.version,
  to_jsonb(sm)->>'name' as name,
  to_jsonb(sm)->>'inserted_at' as inserted_at
from supabase_migrations.schema_migrations sm
where sm.version in ('20260721190621', '20260721223536', '20260723035406', '20260804123000')
order by sm.version;

select to_regclass('public.contact_enquiries') is not null as contact_enquiries_exists;

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
where c.conrelid = 'public.contact_enquiries'::regclass
order by c.conname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'contact_enquiries'
order by indexname;

select
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
where c.oid = 'public.contact_enquiries'::regclass;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'contact_enquiries'
order by grantee, privilege_type;

select
  count(*) filter (where grantee in ('anon', 'authenticated', 'PUBLIC')) as public_direct_grant_count,
  count(*) filter (where grantee = 'service_role' and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')) as service_role_required_grant_count
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'contact_enquiries';

select count(*) as public_policy_count
from pg_policies
where schemaname = 'public'
  and tablename = 'contact_enquiries';

select
  count(*) as total_enquiry_count,
  count(*) filter (where enquiry_type = 'Contact') as contact_count,
  count(*) filter (where enquiry_type = 'Partnership') as partnership_count,
  count(*) filter (where status = 'New') as new_count,
  count(*) filter (where status = 'Contacted') as contacted_count,
  count(*) filter (where status = 'Closed') as closed_count,
  count(*) filter (where enquiry_type not in ('Contact', 'Partnership')) as invalid_type_count,
  count(*) filter (where status not in ('New', 'Contacted', 'Closed')) as invalid_status_count
from public.contact_enquiries;

select
  (select count(*) from public.farmers) as farmer_count,
  (select count(*) from public.suppliers) as supplier_count,
  (select count(*) from public.farmer_applications) as farmer_application_count,
  (select count(*) from public.supplier_applications) as supplier_application_count;

select trigger_name, action_timing, event_manipulation
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'contact_enquiries'
order by trigger_name;

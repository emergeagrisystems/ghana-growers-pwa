-- Read-only verification for 20260723035406_profile_applications_and_private_media.sql.
-- Compare the three row counts below with the precheck output.

select version, name, inserted_at
from supabase_migrations.schema_migrations
where version in ('20260721190621', '20260721223536', '20260723035406')
order by version;

select
  target.table_name,
  to_regclass('public.' || target.table_name) is not null as table_exists
from (values
  ('farmer_applications'),
  ('supplier_applications'),
  ('farmers'),
  ('suppliers')
) as target(table_name)
order by target.table_name;

with expected(table_name, column_name, data_type, udt_name) as (
  values
    ('farmer_applications', 'linked_farmer_id', 'uuid', 'uuid'),
    ('farmer_applications', 'private_document_paths', 'ARRAY', '_text'),
    ('farmer_applications', 'review_state', 'text', 'text'),
    ('supplier_applications', 'linked_supplier_id', 'uuid', 'uuid'),
    ('supplier_applications', 'private_certificate_paths', 'ARRAY', '_text'),
    ('supplier_applications', 'normalized_categories', 'ARRAY', '_text'),
    ('supplier_applications', 'launch_ready', 'boolean', 'bool'),
    ('supplier_applications', 'launch_status', 'text', 'text'),
    ('suppliers', 'source_application_id', 'uuid', 'uuid'),
    ('suppliers', 'launch_ready', 'boolean', 'bool'),
    ('suppliers', 'launch_status', 'text', 'text'),
    ('suppliers', 'verification_date', 'timestamp with time zone', 'timestamptz'),
    ('suppliers', 'verification_notes', 'text', 'text'),
    ('suppliers', 'profile_review_status', 'text', 'text'),
    ('farmers', 'source_application_id', 'uuid', 'uuid')
)
select
  e.table_name,
  e.column_name,
  c.column_name is not null as exists_with_expected_type,
  c.data_type as actual_data_type,
  c.udt_name as actual_udt_name
from expected e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = e.table_name
 and c.column_name = e.column_name
 and c.data_type = e.data_type
 and c.udt_name = e.udt_name
order by e.table_name, e.column_name;

with expected(table_name, constraint_name) as (
  values
    ('farmer_applications', 'farmer_applications_linked_farmer_id_fkey'),
    ('farmer_applications', 'farmer_applications_status_check'),
    ('supplier_applications', 'supplier_applications_linked_supplier_id_fkey'),
    ('supplier_applications', 'supplier_applications_status_check'),
    ('suppliers', 'suppliers_source_application_id_fkey'),
    ('farmers', 'farmers_source_application_id_fkey')
)
select
  e.table_name,
  e.constraint_name,
  c.oid is not null as constraint_exists,
  c.contype,
  c.convalidated
from expected e
left join pg_constraint c
  on c.conname = e.constraint_name
 and c.conrelid = ('public.' || e.table_name)::regclass
order by e.table_name, e.constraint_name;

with expected(index_name) as (
  values
    ('farmer_applications_linked_farmer_uidx'),
    ('farmers_source_application_uidx'),
    ('supplier_applications_linked_supplier_uidx'),
    ('suppliers_source_application_uidx'),
    ('farmer_applications_status_created_idx'),
    ('supplier_applications_review_state_idx')
)
select e.index_name, i.indexname is not null as index_exists, i.indexdef
from expected e
left join pg_indexes i
  on i.schemaname = 'public'
 and i.indexname = e.index_name
order by e.index_name;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('farmer_applications', 'supplier_applications')
order by c.relname;

select
  t.table_name,
  r.role_name,
  count(g.privilege_type) as direct_grant_count,
  array_agg(g.privilege_type order by g.privilege_type) filter (where g.privilege_type is not null) as privileges
from (values ('farmer_applications'), ('supplier_applications')) as t(table_name)
cross join (values ('anon'), ('authenticated'), ('service_role')) as r(role_name)
left join information_schema.role_table_grants g
  on g.table_schema = 'public'
 and g.table_name = t.table_name
 and g.grantee = r.role_name
group by t.table_name, r.role_name
order by t.table_name, r.role_name;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in ('farmer_applications', 'supplier_applications'))
   or (
     schemaname = 'storage'
     and tablename = 'objects'
     and policyname = 'Service role manages private profile application media'
   )
order by schemaname, tablename, policyname;

select
  id,
  public,
  file_size_limit,
  allowed_mime_types,
  public = false as is_private,
  file_size_limit = 8388608 as eight_mb_bucket_limit,
  allowed_mime_types @> array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[] as approved_types_present
from storage.buckets
where id in ('farmer-application-media', 'supplier-application-media')
order by id;

select 'farmers' as table_name, count(*) as exact_row_count from public.farmers
union all
select 'suppliers', count(*) from public.suppliers
union all
select 'supplier_applications', count(*) from public.supplier_applications
union all
select 'farmer_applications', count(*) from public.farmer_applications
order by table_name;

select
  (select count(*) from public.farmer_applications where linked_farmer_id is not null) as linked_farmer_application_count,
  (select count(*) from public.supplier_applications where linked_supplier_id is not null) as linked_supplier_application_count,
  (select count(*) from public.farmers where source_application_id is not null) as farmers_created_from_application_count,
  (select count(*) from public.suppliers where source_application_id is not null) as suppliers_created_from_application_count;

select
  count(*) filter (where bucket_id = 'farmer-application-media') as farmer_application_object_count,
  count(*) filter (where bucket_id = 'supplier-application-media') as supplier_application_object_count
from storage.objects;

-- Public eligibility remains data-driven by the existing status, verification,
-- launch_ready (farmers), slug and source columns. This migration adds no policy,
-- trigger or function that changes those values or publishes profiles.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'farmers' and column_name in ('slug', 'status', 'verification_status', 'launch_ready', 'source', 'is_featured', 'featured_until'))
    or (table_name = 'suppliers' and column_name in ('slug', 'status', 'verification_status', 'source', 'is_featured', 'featured_until'))
  )
order by table_name, column_name;

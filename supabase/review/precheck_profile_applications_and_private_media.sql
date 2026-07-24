-- Read-only precheck for 20260723035406_profile_applications_and_private_media.sql.
-- This file reports metadata and aggregate counts only. It does not return contacts or object names.

select column_name, ordinal_position, data_type, udt_name, is_nullable
from information_schema.columns
where table_schema = 'supabase_migrations'
  and table_name = 'schema_migrations'
order by ordinal_position;

select
  sm.version,
  to_jsonb(sm)->>'name' as name,
  to_jsonb(sm)->>'inserted_at' as inserted_at
from supabase_migrations.schema_migrations sm
order by sm.version;

select
  target.table_schema,
  target.table_name,
  to_regclass(format('%I.%I', target.table_schema, target.table_name)) is not null as table_exists
from (values
  ('public', 'farmers'),
  ('public', 'suppliers'),
  ('public', 'farmer_applications'),
  ('public', 'supplier_applications')
) as target(table_schema, table_name)
order by target.table_name;

select table_name, ordinal_position, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('farmers', 'suppliers', 'farmer_applications', 'supplier_applications')
order by table_name, ordinal_position;

select 'farmers' as table_name, count(*) as exact_row_count from public.farmers
union all
select 'suppliers', count(*) from public.suppliers
union all
select 'supplier_applications', count(*) from public.supplier_applications
order by table_name;

select
  to_jsonb(sa)->>'status' as status,
  count(*) as row_count
from public.supplier_applications sa
group by to_jsonb(sa)->>'status'
order by status nulls first;

select count(*) as supplier_application_status_constraint_violations
from public.supplier_applications sa
where to_jsonb(sa)->>'status' is not null
  and to_jsonb(sa)->>'status' not in ('New', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Converted');

with expected(table_name, column_name) as (
  values
    ('farmer_applications', 'linked_farmer_id'),
    ('supplier_applications', 'linked_supplier_id'),
    ('farmers', 'source_application_id'),
    ('suppliers', 'source_application_id')
)
select
  e.table_name,
  e.column_name,
  c.column_name is not null as link_column_exists,
  c.data_type,
  c.udt_name
from expected e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = e.table_name
 and c.column_name = e.column_name
order by e.table_name, e.column_name;

with expected(table_name) as (
  values ('farmer_applications'), ('supplier_applications')
)
select
  e.table_name,
  c.oid is not null as table_exists,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from expected e
left join pg_namespace n
  on n.nspname = 'public'
left join pg_class c
  on c.relnamespace = n.oid
 and c.relname = e.table_name
 and c.relkind in ('r', 'p')
order by e.table_name;

with expected_tables(table_name) as (
  values ('farmer_applications'), ('supplier_applications')
), expected_roles(role_name) as (
  values ('anon'), ('authenticated'), ('service_role')
)
select
  t.table_name,
  r.role_name,
  count(g.privilege_type) as direct_grant_count,
  array_agg(g.privilege_type order by g.privilege_type)
    filter (where g.privilege_type is not null) as privileges
from expected_tables t
cross join expected_roles r
left join information_schema.role_table_grants g
  on g.table_schema = 'public'
 and g.table_name = t.table_name
 and g.grantee = r.role_name
group by t.table_name, r.role_name
order by t.table_name, r.role_name;

with expected(bucket_id) as (
  values
    ('farmers'),
    ('suppliers'),
    ('farmer-application-media'),
    ('supplier-application-media')
)
select
  e.bucket_id,
  b.id is not null as bucket_exists,
  (to_jsonb(b)->>'public')::boolean as is_public,
  to_jsonb(b)->>'file_size_limit' as file_size_limit,
  to_jsonb(b)->'allowed_mime_types' as allowed_mime_types
from expected e
left join storage.buckets b on b.id = e.bucket_id
order by e.bucket_id;

with expected(bucket_id) as (
  values
    ('farmers'),
    ('suppliers'),
    ('farmer-application-media'),
    ('supplier-application-media')
)
select
  e.bucket_id,
  exists (select 1 from storage.buckets b where b.id = e.bucket_id) as bucket_exists,
  count(o.id) as object_count,
  count(o.id) filter (where o.name like 'applications/%') as application_path_count,
  count(o.id) filter (where o.name like '%/document/%') as document_path_count
from expected e
left join storage.objects o on o.bucket_id = e.bucket_id
group by e.bucket_id
order by e.bucket_id;

with expected(schemaname, tablename, policyname) as (
  values
    ('public', 'farmer_applications', 'Service role manages farmer applications'),
    ('public', 'supplier_applications', 'Service role manages supplier applications'),
    ('storage', 'objects', 'Service role manages private profile application media')
)
select
  e.schemaname,
  e.tablename,
  e.policyname,
  p.policyname is not null as policy_exists,
  p.roles,
  p.cmd
from expected e
left join pg_policies p
  on p.schemaname = e.schemaname
 and p.tablename = e.tablename
 and p.policyname = e.policyname
order by e.schemaname, e.tablename, e.policyname;

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where (schemaname = 'public' and tablename in ('farmer_applications', 'supplier_applications'))
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

-- Read-only precheck. Returns metadata and aggregate counts only.
select
  sm.version,
  to_jsonb(sm)->>'name' as name,
  to_jsonb(sm)->>'inserted_at' as inserted_at
from supabase_migrations.schema_migrations sm
order by sm.version;

select
  to_regclass('public.contact_enquiries') is not null as contact_enquiries_exists,
  pg_get_userbyid(c.relowner) as table_owner,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  c.relacl::text as direct_acl
from pg_class c
where c.oid = to_regclass('public.contact_enquiries');

select
  grantor.rolname as grantor,
  case when acl.grantee = 0 then 'PUBLIC' else grantee.rolname end as grantee,
  acl.privilege_type,
  acl.is_grantable
from pg_class c
cross join lateral aclexplode(c.relacl) acl
left join pg_roles grantor on grantor.oid = acl.grantor
left join pg_roles grantee on grantee.oid = acl.grantee
where c.oid = to_regclass('public.contact_enquiries')
order by grantee, acl.privilege_type;

select
  grantor,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'contact_enquiries'
order by grantee, privilege_type;

with roles(role_name) as (
  values ('service_role'), ('anon'), ('authenticated')
), privileges(privilege_name) as (
  values
    ('SELECT'),
    ('INSERT'),
    ('UPDATE'),
    ('DELETE'),
    ('TRUNCATE'),
    ('REFERENCES'),
    ('TRIGGER'),
    ('MAINTAIN')
)
select
  role_name,
  privilege_name,
  has_table_privilege(role_name, 'public.contact_enquiries', privilege_name) as has_privilege
from roles
cross join privileges
order by role_name, privilege_name;

with recursive inherited_roles(member_oid, role_oid, depth) as (
  select membership.member, membership.roleid, 1
  from pg_auth_members membership
  where membership.member = (select oid from pg_roles where rolname = 'service_role')

  union all

  select inherited.member_oid, membership.roleid, inherited.depth + 1
  from inherited_roles inherited
  join pg_auth_members membership on membership.member = inherited.role_oid
)
select
  member.rolname as member_role,
  inherited.rolname as inherited_role,
  inherited_roles.depth
from inherited_roles
join pg_roles member on member.oid = inherited_roles.member_oid
join pg_roles inherited on inherited.oid = inherited_roles.role_oid
order by inherited_roles.depth, inherited.rolname;

select
  owner_role.rolname as owner_role,
  coalesce(namespace.nspname, 'ALL_SCHEMAS') as schema_name,
  defaults.defaclobjtype as object_type,
  case when acl.grantee = 0 then 'PUBLIC' else grantee.rolname end as grantee,
  acl.privilege_type,
  acl.is_grantable
from pg_default_acl defaults
join pg_roles owner_role on owner_role.oid = defaults.defaclrole
left join pg_namespace namespace on namespace.oid = defaults.defaclnamespace
cross join lateral aclexplode(defaults.defaclacl) acl
left join pg_roles grantee on grantee.oid = acl.grantee
where (namespace.nspname = 'public' or namespace.nspname is null)
  and (acl.grantee = 0 or grantee.rolname in ('service_role', 'anon', 'authenticated'))
order by owner_role.rolname, schema_name, object_type, grantee, acl.privilege_type;

select count(*) as public_policy_count
from pg_policies
where schemaname = 'public'
  and tablename = 'contact_enquiries';

select count(*) as contact_enquiry_count
from public.contact_enquiries;

select
  (select count(*) from public.farmers) as farmer_count,
  (select count(*) from public.suppliers) as supplier_count,
  (select count(*) from public.farmer_applications) as farmer_application_count,
  (select count(*) from public.supplier_applications) as supplier_application_count;

select constraint_entry.conname as constraint_name
from pg_constraint constraint_entry
where constraint_entry.conrelid = to_regclass('public.contact_enquiries')
order by constraint_entry.conname;

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'contact_enquiries'
order by indexname;

select trigger_name, action_timing, event_manipulation
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'contact_enquiries'
order by trigger_name;

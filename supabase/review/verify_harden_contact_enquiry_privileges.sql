-- Read-only verification. Raises an exception if any approved invariant fails.
do $verification$
declare
  v_owner text;
  v_rls_enabled boolean;
  v_rls_forced boolean;
  v_service_direct_count integer;
  v_service_grant_option_count integer;
  v_public_direct_count integer;
begin
  if not exists (
    select 1
    from supabase_migrations.schema_migrations migrations
    where migrations.version = '20260804140000'
  ) then
    raise exception 'verification failed: migration 20260804140000 is not recorded';
  end if;

  if to_regclass('public.contact_enquiries') is null then
    raise exception 'verification failed: public.contact_enquiries does not exist';
  end if;

  select
    pg_get_userbyid(c.relowner),
    c.relrowsecurity,
    c.relforcerowsecurity
  into v_owner, v_rls_enabled, v_rls_forced
  from pg_class c
  where c.oid = 'public.contact_enquiries'::regclass;

  if v_owner <> 'postgres' then
    raise exception 'verification failed: table owner changed from postgres to %', v_owner;
  end if;

  if not v_rls_enabled or not v_rls_forced then
    raise exception 'verification failed: RLS and FORCE ROW LEVEL SECURITY must remain enabled';
  end if;

  if (select count(*) from pg_policies where schemaname = 'public' and tablename = 'contact_enquiries') <> 0 then
    raise exception 'verification failed: contact_enquiries must have no public policies';
  end if;

  select
    count(*),
    count(*) filter (where acl.is_grantable)
  into v_service_direct_count, v_service_grant_option_count
  from pg_class c
  cross join lateral aclexplode(c.relacl) acl
  join pg_roles grantee on grantee.oid = acl.grantee
  where c.oid = 'public.contact_enquiries'::regclass
    and grantee.rolname = 'service_role'
    and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE');

  if v_service_direct_count <> 4 then
    raise exception 'verification failed: service_role must have exactly four direct CRUD grants, found %', v_service_direct_count;
  end if;

  if exists (
    select 1
    from pg_class c
    cross join lateral aclexplode(c.relacl) acl
    join pg_roles grantee on grantee.oid = acl.grantee
    where c.oid = 'public.contact_enquiries'::regclass
      and grantee.rolname = 'service_role'
      and acl.privilege_type not in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  ) then
    raise exception 'verification failed: service_role has an unapproved direct table privilege';
  end if;

  if v_service_grant_option_count <> 0 or exists (
    select 1
    from pg_class c
    cross join lateral aclexplode(c.relacl) acl
    join pg_roles grantee on grantee.oid = acl.grantee
    where c.oid = 'public.contact_enquiries'::regclass
      and grantee.rolname = 'service_role'
      and acl.is_grantable
  ) then
    raise exception 'verification failed: service_role has a table grant option';
  end if;

  if not has_table_privilege('service_role', 'public.contact_enquiries', 'SELECT')
     or not has_table_privilege('service_role', 'public.contact_enquiries', 'INSERT')
     or not has_table_privilege('service_role', 'public.contact_enquiries', 'UPDATE')
     or not has_table_privilege('service_role', 'public.contact_enquiries', 'DELETE') then
    raise exception 'verification failed: service_role lacks required effective CRUD access';
  end if;

  if has_table_privilege('service_role', 'public.contact_enquiries', 'TRUNCATE')
     or has_table_privilege('service_role', 'public.contact_enquiries', 'REFERENCES')
     or has_table_privilege('service_role', 'public.contact_enquiries', 'TRIGGER')
     or has_table_privilege('service_role', 'public.contact_enquiries', 'MAINTAIN') then
    raise exception 'verification failed: service_role retains an unapproved effective table privilege';
  end if;

  select count(*)
  into v_public_direct_count
  from pg_class c
  cross join lateral aclexplode(c.relacl) acl
  left join pg_roles grantee on grantee.oid = acl.grantee
  where c.oid = 'public.contact_enquiries'::regclass
    and (acl.grantee = 0 or grantee.rolname in ('anon', 'authenticated'));

  if v_public_direct_count <> 0 then
    raise exception 'verification failed: PUBLIC, anon or authenticated has a direct table grant';
  end if;

  if exists (
    select 1
    from (values ('anon'), ('authenticated')) roles(role_name)
    cross join (values
      ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
      ('TRUNCATE'), ('REFERENCES'), ('TRIGGER'), ('MAINTAIN')
    ) privileges(privilege_name)
    where has_table_privilege(roles.role_name, 'public.contact_enquiries', privileges.privilege_name)
  ) then
    raise exception 'verification failed: anon or authenticated retains effective table access';
  end if;

  if (select count(*) from pg_constraint where conrelid = 'public.contact_enquiries'::regclass) <> 11 then
    raise exception 'verification failed: contact_enquiries constraint inventory changed';
  end if;

  if (select count(*) from pg_indexes where schemaname = 'public' and tablename = 'contact_enquiries') <> 5 then
    raise exception 'verification failed: contact_enquiries index inventory changed';
  end if;

  if not exists (
    select 1
    from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table = 'contact_enquiries'
      and trigger_name = 'contact_enquiries_updated_at'
      and action_timing = 'BEFORE'
      and event_manipulation = 'UPDATE'
  ) then
    raise exception 'verification failed: contact_enquiries updated_at trigger changed';
  end if;

  if (select count(*) from public.contact_enquiries) <> 0 then
    raise exception 'verification failed: contact enquiry row count changed';
  end if;

  if (select count(*) from public.farmers) <> 119
     or (select count(*) from public.suppliers) <> 0
     or (select count(*) from public.farmer_applications) <> 0
     or (select count(*) from public.supplier_applications) <> 1 then
    raise exception 'verification failed: unrelated aggregate row counts changed';
  end if;
end
$verification$;

select
  pg_get_userbyid(c.relowner) as table_owner,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'contact_enquiries') as policy_count,
  (select count(*) from public.contact_enquiries) as enquiry_count
from pg_class c
where c.oid = 'public.contact_enquiries'::regclass;

select
  grantee.rolname as grantee,
  acl.privilege_type,
  acl.is_grantable,
  has_table_privilege(grantee.rolname, 'public.contact_enquiries', acl.privilege_type) as effective
from pg_class c
cross join lateral aclexplode(c.relacl) acl
join pg_roles grantee on grantee.oid = acl.grantee
where c.oid = 'public.contact_enquiries'::regclass
  and grantee.rolname = 'service_role'
order by acl.privilege_type;

-- Read-only verification for 20260721223536_harden_farmmate_feedback_privileges.sql.
-- Capture the row-count result before and after applying the migration and
-- confirm the value is unchanged.

select
  to_regclass('public.farmmate_pilot_feedback') is not null as table_exists,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  pg_get_userbyid(c.relowner) as table_owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'farmmate_pilot_feedback';

select
  count(*) as farmmate_pilot_feedback_row_count
from public.farmmate_pilot_feedback;

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'farmmate_pilot_feedback'
  and grantee in ('anon', 'authenticated', 'service_role')
order by grantee, privilege_type;

with expected_service_privileges(privilege_type) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
)
select
  not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'farmmate_pilot_feedback'
      and grantee = 'anon'
  ) as anon_has_zero_direct_table_grants,
  not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'farmmate_pilot_feedback'
      and grantee = 'authenticated'
  ) as authenticated_has_zero_direct_table_grants,
  not exists (
    select 1
    from expected_service_privileges expected
    where not exists (
      select 1
      from information_schema.role_table_grants actual
      where actual.table_schema = 'public'
        and actual.table_name = 'farmmate_pilot_feedback'
        and actual.grantee = 'service_role'
        and actual.privilege_type = expected.privilege_type
    )
  ) as service_role_retains_required_privileges;

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'farmmate_pilot_feedback'
order by ordinal_position;

select
  con.conname as constraint_name,
  con.contype as constraint_type,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
where con.conrelid = 'public.farmmate_pilot_feedback'::regclass
order by con.conname;

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'farmmate_pilot_feedback'
order by indexname;

select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'farmmate_pilot_feedback'
order by policyname;

select
  (select count(*) from information_schema.columns
   where table_schema = 'public' and table_name = 'farmmate_pilot_feedback') = 10
    as expected_columns_present,
  (select count(*) from pg_constraint
   where conrelid = 'public.farmmate_pilot_feedback'::regclass) = 3
    as expected_constraints_present,
  (select count(*) from pg_indexes
   where schemaname = 'public' and tablename = 'farmmate_pilot_feedback') = 2
    as expected_indexes_present,
  (select count(*) from pg_policies
   where schemaname = 'public' and tablename = 'farmmate_pilot_feedback') = 0
    as existing_no_policy_state_preserved;

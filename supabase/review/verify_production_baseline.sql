-- Read-only verification after the production baseline history is reconciled.
-- Expected initial history: exactly version 20260721190621.

select
  to_regclass('supabase_migrations.schema_migrations') is not null
    as migration_history_exists;

select
  count(*) = 1 as one_initial_migration,
  bool_and(version = '20260721190621') as baseline_is_only_version,
  string_agg(version, ',' order by version) as recorded_versions
from supabase_migrations.schema_migrations;

with expected(object_name) as (
  values
    ('public.buyer_requests'),
    ('public.farmers'),
    ('public.farmmate_pilot_feedback'),
    ('public.farmmate_usage_events'),
    ('public.lead_request_rate_limits'),
    ('public.lead_requests'),
    ('public.listing_submission_publication_cleanup_queue'),
    ('public.listing_submission_rate_limits'),
    ('public.listing_submissions'),
    ('public.market_prices'),
    ('public.marketplace_listings'),
    ('public.success_stories'),
    ('public.supplier_applications'),
    ('public.suppliers')
)
select object_name
from expected
where to_regclass(object_name) is null
order by object_name;

select 'public tables' as metric, count(*)::bigint as value
from pg_tables where schemaname = 'public'
union all
select 'public functions', count(*)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
union all
select 'public indexes', count(*)
from pg_indexes where schemaname = 'public'
union all
select 'public constraints', count(*)
from pg_constraint c join pg_namespace n on n.oid = c.connamespace
where n.nspname = 'public'
union all
select 'RLS-enabled public tables', count(*)
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
union all
select 'public RLS policies', count(*)
from pg_policies where schemaname = 'public'
order by metric;

select
  p.oid::regprocedure::text as function_name,
  p.prosecdef as security_definer,
  coalesce(array_to_string(p.proconfig, ','), '') as function_config,
  has_function_privilege('anon', p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
  has_function_privilege('service_role', p.oid, 'execute') as service_role_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.oid::regprocedure::text;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('farmers', 'suppliers', 'marketplace', 'stories', 'listing-submissions')
order by id;

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'Public read Ghana Growers launch media',
    'Service role manages listing submission images'
  )
order by policyname;

select
  has_table_privilege('anon', 'public.farmmate_pilot_feedback', 'select')
    as feedback_anon_select_grant,
  has_table_privilege('authenticated', 'public.farmmate_pilot_feedback', 'select')
    as feedback_authenticated_select_grant,
  has_table_privilege('service_role', 'public.farmmate_pilot_feedback', 'select,insert,update,delete')
    as feedback_service_role_crud,
  c.relrowsecurity as feedback_rls_enabled,
  (select count(*) from pg_policies
   where schemaname = 'public' and tablename = 'farmmate_pilot_feedback')
    as feedback_policy_count
from pg_class c
where c.oid = 'public.farmmate_pilot_feedback'::regclass;

-- Compare these counts with the captured precheck output. Reconciliation must
-- not change them.
select 'buyer_requests' as table_name, count(*)::bigint as row_count from public.buyer_requests
union all select 'farmers', count(*) from public.farmers
union all select 'farmmate_pilot_feedback', count(*) from public.farmmate_pilot_feedback
union all select 'farmmate_usage_events', count(*) from public.farmmate_usage_events
union all select 'lead_request_rate_limits', count(*) from public.lead_request_rate_limits
union all select 'lead_requests', count(*) from public.lead_requests
union all select 'listing_submission_publication_cleanup_queue', count(*) from public.listing_submission_publication_cleanup_queue
union all select 'listing_submission_rate_limits', count(*) from public.listing_submission_rate_limits
union all select 'listing_submissions', count(*) from public.listing_submissions
union all select 'market_prices', count(*) from public.market_prices
union all select 'marketplace_listings', count(*) from public.marketplace_listings
union all select 'success_stories', count(*) from public.success_stories
union all select 'supplier_applications', count(*) from public.supplier_applications
union all select 'suppliers', count(*) from public.suppliers
order by table_name;

-- SQL cannot inspect local migration files or a CLI dry run. After this file
-- passes, run migration list and db push --dry-run externally and require no
-- historical backlog.

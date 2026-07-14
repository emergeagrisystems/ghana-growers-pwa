-- Read-only verification after applying 034_unified_buyer_enquiries.sql.
-- This file must not modify data.

select
  to_regclass('public.lead_requests') is not null as lead_requests_exists,
  to_regclass('public.lead_request_rate_limits') is not null as lead_request_rate_limits_exists;

with expected(column_name) as (
  values
    ('id'),
    ('created_at'),
    ('updated_at'),
    ('requester_name'),
    ('phone'),
    ('whatsapp'),
    ('location'),
    ('product_interest'),
    ('quantity_needed'),
    ('message'),
    ('source_type'),
    ('source_id'),
    ('source_name'),
    ('source_page'),
    ('status'),
    ('request_source'),
    ('marketplace_listing_id'),
    ('farmer_profile_id'),
    ('supplier_profile_id'),
    ('source_slug'),
    ('company_name'),
    ('whatsapp_same_as_phone'),
    ('delivery_location'),
    ('required_by'),
    ('listing_snapshot'),
    ('request_dedupe_key')
)
select
  e.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  (c.column_name is not null) as exists
from expected e
left join information_schema.columns c
  on c.table_schema = 'public'
  and c.table_name = 'lead_requests'
  and c.column_name = e.column_name
order by e.column_name;

with expected(constraint_name) as (
  values
    ('lead_requests_pkey'),
    ('lead_requests_status_check'),
    ('lead_requests_source_type_check'),
    ('lead_requests_request_source_check'),
    ('lead_requests_marketplace_listing_id_fkey'),
    ('lead_requests_farmer_profile_id_fkey'),
    ('lead_requests_supplier_profile_id_fkey')
)
select
  e.constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition,
  (c.oid is not null) as exists
from expected e
left join pg_constraint c
  on c.conname = e.constraint_name
  and c.conrelid = 'public.lead_requests'::regclass
order by e.constraint_name;

with expected(index_name) as (
  values
    ('lead_requests_pkey'),
    ('lead_requests_status_idx'),
    ('lead_requests_source_idx'),
    ('lead_requests_request_source_idx'),
    ('lead_requests_marketplace_listing_idx'),
    ('lead_requests_farmer_profile_idx'),
    ('lead_requests_supplier_profile_idx'),
    ('lead_requests_created_at_idx'),
    ('lead_requests_dedupe_key_idx')
)
select
  e.index_name,
  i.indexdef,
  (i.indexname is not null) as exists
from expected e
left join pg_indexes i
  on i.schemaname = 'public'
  and i.tablename = 'lead_requests'
  and i.indexname = e.index_name
order by e.index_name;

select
  t.tgname as trigger_name,
  t.tgenabled as trigger_enabled,
  p.proname as trigger_function
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'public.lead_requests'::regclass
  and not t.tgisinternal
order by t.tgname;

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('lead_requests', 'lead_request_rate_limits')
order by c.relname;

select
  'anon can select lead_requests' as check_name,
  has_table_privilege('anon', 'public.lead_requests', 'select') as result
union all
select
  'authenticated can select lead_requests',
  has_table_privilege('authenticated', 'public.lead_requests', 'select')
union all
select
  'service_role can select lead_requests',
  has_table_privilege('service_role', 'public.lead_requests', 'select')
union all
select
  'service_role can insert lead_requests',
  has_table_privilege('service_role', 'public.lead_requests', 'insert')
union all
select
  'service_role can update lead_requests',
  has_table_privilege('service_role', 'public.lead_requests', 'update')
union all
select
  'anon can select lead_request_rate_limits',
  has_table_privilege('anon', 'public.lead_request_rate_limits', 'select')
union all
select
  'authenticated can select lead_request_rate_limits',
  has_table_privilege('authenticated', 'public.lead_request_rate_limits', 'select')
union all
select
  'service_role can update lead_request_rate_limits',
  has_table_privilege('service_role', 'public.lead_request_rate_limits', 'update');

select
  p.proname,
  p.prosecdef as security_definer,
  p.proconfig as function_config,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'consume_lead_request_rate_limit';

select
  'anon can execute consume_lead_request_rate_limit' as check_name,
  has_function_privilege('anon', 'public.consume_lead_request_rate_limit(text, integer, integer)', 'execute') as result
union all
select
  'authenticated can execute consume_lead_request_rate_limit',
  has_function_privilege('authenticated', 'public.consume_lead_request_rate_limit(text, integer, integer)', 'execute')
union all
select
  'service_role can execute consume_lead_request_rate_limit',
  has_function_privilege('service_role', 'public.consume_lead_request_rate_limit(text, integer, integer)', 'execute');

select
  grantee,
  privilege_type
from information_schema.routine_privileges
where specific_schema = 'public'
  and routine_name = 'consume_lead_request_rate_limit'
  and grantee in ('PUBLIC', 'anon', 'authenticated', 'service_role')
order by grantee, privilege_type;

select
  request_source,
  count(*) as row_count
from public.lead_requests
group by request_source
order by request_source;

select
  status,
  count(*) as row_count
from public.lead_requests
group by status
order by status;

select
  source_type,
  count(*) as row_count
from public.lead_requests
group by source_type
order by source_type;

select
  'rows outside supported request_source values' as check_name,
  count(*) as row_count
from public.lead_requests
where request_source not in ('marketplace_listing', 'farmer_profile', 'supplier_profile', 'generic_sourcing', 'legacy')
union all
select
  'rows outside supported status values',
  count(*)
from public.lead_requests
where status not in ('New', 'Contacted', 'Negotiating', 'Completed', 'Lost')
union all
select
  'rows outside supported source_type values',
  count(*)
from public.lead_requests
where source_type not in ('Farmer', 'Supplier', 'Marketplace Listing', 'Supplier Listing', 'Buyer Request');

select
  'lead_requests row count after migration' as check_name,
  count(*)::text as result
from public.lead_requests;

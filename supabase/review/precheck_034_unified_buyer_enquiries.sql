-- Read-only precheck before applying 034_unified_buyer_enquiries.sql.
-- This file is safe when public.lead_requests is absent.
-- It must not modify data.

select
  to_regclass('public.lead_requests') is not null as lead_requests_exists;

select
  'lead_requests row count' as check_name,
  case
    when to_regclass('public.lead_requests') is null then
      'public.lead_requests is absent; migration 034 will create it.'
    else
      (xpath('/row/row_count/text()', query_to_xml('select count(*) as row_count from public.lead_requests', false, true, '')))[1]::text
  end as result;

select
  'existing status values and counts' as check_name,
  case
    when to_regclass('public.lead_requests') is null then
      'public.lead_requests is absent; no existing statuses to validate.'
    else
      query_to_xml('select status, count(*) as row_count from public.lead_requests group by status order by status', false, true, '')::text
  end as result;

select
  'existing source_type values and counts' as check_name,
  case
    when to_regclass('public.lead_requests') is null then
      'public.lead_requests is absent; no existing source_type values to validate.'
    else
      query_to_xml('select source_type, count(*) as row_count from public.lead_requests group by source_type order by source_type', false, true, '')::text
  end as result;

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'lead_requests'
order by ordinal_position;

select
  c.conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
from pg_constraint c
where c.conrelid = to_regclass('public.lead_requests')
order by c.conname;

select
  'rows that would violate proposed status constraint' as check_name,
  case
    when to_regclass('public.lead_requests') is null then
      'public.lead_requests is absent; no rows would violate the proposed status constraint.'
    else
      (xpath(
        '/row/row_count/text()',
        query_to_xml(
          'select count(*) as row_count from public.lead_requests where status not in (''New'', ''Contacted'', ''Negotiating'', ''Completed'', ''Lost'')',
          false,
          true,
          ''
        )
      ))[1]::text
  end as result;

select
  'rows that would violate proposed source_type constraint' as check_name,
  case
    when to_regclass('public.lead_requests') is null then
      'public.lead_requests is absent; no rows would violate the proposed source_type constraint.'
    else
      (xpath(
        '/row/row_count/text()',
        query_to_xml(
          'select count(*) as row_count from public.lead_requests where source_type not in (''Farmer'', ''Supplier'', ''Marketplace Listing'', ''Supplier Listing'', ''Buyer Request'')',
          false,
          true,
          ''
        )
      ))[1]::text
  end as result;

select
  'marketplace source references not found by id or slug' as check_name,
  case
    when to_regclass('public.lead_requests') is null then
      'public.lead_requests is absent; no marketplace source references to validate.'
    else
      query_to_xml(
        'select lr.id, lr.source_type, lr.source_id from public.lead_requests lr left join public.marketplace_listings ml on ml.id::text = lr.source_id or ml.slug = lr.source_id where lr.source_type in (''Marketplace Listing'', ''Supplier Listing'') and ml.id is null order by lr.created_at desc limit 50',
        false,
        true,
        ''
      )::text
  end as result;

select
  'farmer source references not found by id or slug' as check_name,
  case
    when to_regclass('public.lead_requests') is null then
      'public.lead_requests is absent; no farmer source references to validate.'
    else
      query_to_xml(
        'select lr.id, lr.source_type, lr.source_id from public.lead_requests lr left join public.farmers f on f.id::text = lr.source_id or f.slug = lr.source_id where lr.source_type = ''Farmer'' and lr.source_id <> ''general-produce-request'' and f.id is null order by lr.created_at desc limit 50',
        false,
        true,
        ''
      )::text
  end as result;

select
  'supplier source references not found by id or slug' as check_name,
  case
    when to_regclass('public.lead_requests') is null then
      'public.lead_requests is absent; no supplier source references to validate.'
    else
      query_to_xml(
        'select lr.id, lr.source_type, lr.source_id from public.lead_requests lr left join public.suppliers s on s.id::text = lr.source_id or s.slug = lr.source_id where lr.source_type = ''Supplier'' and s.id is null order by lr.created_at desc limit 50',
        false,
        true,
        ''
      )::text
  end as result;

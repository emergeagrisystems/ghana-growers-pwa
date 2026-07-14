begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.lead_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  requester_name text not null,
  phone text not null,
  whatsapp text not null,
  location text not null,
  product_interest text not null,
  quantity_needed text,
  message text,
  source_type text not null,
  source_id text not null,
  source_name text not null,
  source_page text,
  status text not null default 'New',
  request_source text not null default 'legacy',
  marketplace_listing_id uuid references public.marketplace_listings(id) on delete set null,
  farmer_profile_id uuid references public.farmers(id) on delete set null,
  supplier_profile_id uuid references public.suppliers(id) on delete set null,
  source_slug text,
  company_name text,
  whatsapp_same_as_phone boolean not null default false,
  delivery_location text,
  required_by date,
  listing_snapshot jsonb,
  request_dedupe_key text,
  constraint lead_requests_status_check
    check (status in ('New', 'Contacted', 'Negotiating', 'Completed', 'Lost')),
  constraint lead_requests_source_type_check
    check (source_type in ('Farmer', 'Supplier', 'Marketplace Listing', 'Supplier Listing', 'Buyer Request')),
  constraint lead_requests_request_source_check
    check (request_source in ('marketplace_listing', 'farmer_profile', 'supplier_profile', 'generic_sourcing', 'legacy'))
);

alter table public.lead_requests
  add column if not exists request_source text not null default 'legacy',
  add column if not exists marketplace_listing_id uuid,
  add column if not exists farmer_profile_id uuid,
  add column if not exists supplier_profile_id uuid,
  add column if not exists source_slug text,
  add column if not exists company_name text,
  add column if not exists whatsapp_same_as_phone boolean not null default false,
  add column if not exists delivery_location text,
  add column if not exists required_by date,
  add column if not exists listing_snapshot jsonb,
  add column if not exists request_dedupe_key text,
  add column if not exists updated_at timestamptz not null default now();

update public.lead_requests
set delivery_location = location
where delivery_location is null
  and location is not null;

update public.lead_requests
set request_source = case
  when source_type in ('Marketplace Listing', 'Supplier Listing') then 'marketplace_listing'
  when source_type = 'Farmer' and source_id = 'general-produce-request' then 'generic_sourcing'
  when source_type = 'Farmer' then 'farmer_profile'
  when source_type = 'Supplier' then 'supplier_profile'
  when source_type = 'Buyer Request' then 'generic_sourcing'
  else 'legacy'
end
where request_source = 'legacy'
   or request_source is null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'lead_requests_source_type_check'
      and conrelid = 'public.lead_requests'::regclass
  ) then
    alter table public.lead_requests
      drop constraint lead_requests_source_type_check;
  end if;

  alter table public.lead_requests
    add constraint lead_requests_source_type_check
    check (source_type in ('Farmer', 'Supplier', 'Marketplace Listing', 'Supplier Listing', 'Buyer Request'));

  if exists (
    select 1
    from pg_constraint
    where conname = 'lead_requests_status_check'
      and conrelid = 'public.lead_requests'::regclass
  ) then
    alter table public.lead_requests
      drop constraint lead_requests_status_check;
  end if;

  alter table public.lead_requests
    add constraint lead_requests_status_check
    check (status in ('New', 'Contacted', 'Negotiating', 'Completed', 'Lost'));

  if exists (
    select 1
    from pg_constraint
    where conname = 'lead_requests_request_source_check'
      and conrelid = 'public.lead_requests'::regclass
  ) then
    alter table public.lead_requests
      drop constraint lead_requests_request_source_check;
  end if;

  alter table public.lead_requests
    add constraint lead_requests_request_source_check
    check (request_source in ('marketplace_listing', 'farmer_profile', 'supplier_profile', 'generic_sourcing', 'legacy'));

  if not exists (
    select 1
    from pg_constraint
    where conname = 'lead_requests_marketplace_listing_id_fkey'
      and conrelid = 'public.lead_requests'::regclass
  ) then
    alter table public.lead_requests
      add constraint lead_requests_marketplace_listing_id_fkey
      foreign key (marketplace_listing_id)
      references public.marketplace_listings(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'lead_requests_farmer_profile_id_fkey'
      and conrelid = 'public.lead_requests'::regclass
  ) then
    alter table public.lead_requests
      add constraint lead_requests_farmer_profile_id_fkey
      foreign key (farmer_profile_id)
      references public.farmers(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'lead_requests_supplier_profile_id_fkey'
      and conrelid = 'public.lead_requests'::regclass
  ) then
    alter table public.lead_requests
      add constraint lead_requests_supplier_profile_id_fkey
      foreign key (supplier_profile_id)
      references public.suppliers(id)
      on delete set null;
  end if;
end $$;

drop trigger if exists set_lead_requests_updated_at on public.lead_requests;
create trigger set_lead_requests_updated_at
before update on public.lead_requests
for each row execute function public.set_updated_at();

alter table public.lead_requests enable row level security;

revoke all on table public.lead_requests from anon;
revoke all on table public.lead_requests from authenticated;
grant select, insert, update, delete on public.lead_requests to service_role;

create index if not exists lead_requests_status_idx
  on public.lead_requests (status);

create index if not exists lead_requests_source_idx
  on public.lead_requests (source_type, source_id);

create index if not exists lead_requests_request_source_idx
  on public.lead_requests (request_source);

create index if not exists lead_requests_marketplace_listing_idx
  on public.lead_requests (marketplace_listing_id);

create index if not exists lead_requests_farmer_profile_idx
  on public.lead_requests (farmer_profile_id);

create index if not exists lead_requests_supplier_profile_idx
  on public.lead_requests (supplier_profile_id);

create index if not exists lead_requests_created_at_idx
  on public.lead_requests (created_at desc);

create index if not exists lead_requests_dedupe_key_idx
  on public.lead_requests (request_dedupe_key, created_at desc)
  where request_dedupe_key is not null;

create table if not exists public.lead_request_rate_limits (
  request_key text primary key,
  window_start timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lead_request_rate_limits enable row level security;

revoke all on table public.lead_request_rate_limits from anon;
revoke all on table public.lead_request_rate_limits from authenticated;
grant select, insert, update, delete on public.lead_request_rate_limits to service_role;

create or replace function public.consume_lead_request_rate_limit(
  p_request_key text,
  p_window_seconds integer default 600,
  p_max_attempts integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_attempt_count integer;
  v_reset_at timestamptz;
  v_allowed boolean;
begin
  if nullif(trim(p_request_key), '') is null then
    raise exception 'A request key is required.';
  end if;

  if p_window_seconds <= 0 or p_max_attempts <= 0 then
    raise exception 'Rate limit window and attempt count must be positive.';
  end if;

  delete from public.lead_request_rate_limits
  where window_start < v_now - interval '2 days';

  loop
    update public.lead_request_rate_limits
    set
      window_start = case
        when window_start <= v_now - make_interval(secs => p_window_seconds) then v_now
        else window_start
      end,
      attempt_count = case
        when window_start <= v_now - make_interval(secs => p_window_seconds) then 1
        else attempt_count + 1
      end,
      last_attempt_at = v_now,
      updated_at = v_now
    where request_key = p_request_key
    returning window_start, attempt_count
      into v_window_start, v_attempt_count;

    if found then
      exit;
    end if;

    begin
      insert into public.lead_request_rate_limits (
        request_key,
        window_start,
        attempt_count,
        last_attempt_at,
        created_at,
        updated_at
      )
      values (
        p_request_key,
        v_now,
        1,
        v_now,
        v_now,
        v_now
      )
      returning window_start, attempt_count
        into v_window_start, v_attempt_count;
      exit;
    exception when unique_violation then
      -- A concurrent request inserted the key. Retry and update the locked row.
    end;
  end loop;

  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);
  v_allowed := v_attempt_count <= p_max_attempts;

  return jsonb_build_object(
    'allowed', v_allowed,
    'attempt_count', v_attempt_count,
    'remaining', greatest(p_max_attempts - v_attempt_count, 0),
    'reset_at', v_reset_at
  );
end;
$$;

revoke all on function public.consume_lead_request_rate_limit(text, integer, integer) from public;
revoke all on function public.consume_lead_request_rate_limit(text, integer, integer) from anon;
revoke all on function public.consume_lead_request_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.consume_lead_request_rate_limit(text, integer, integer) to service_role;

comment on table public.lead_requests is
  'Private Ghana Growers buyer enquiry queue used for marketplace listing, farmer profile, supplier profile, generic sourcing, and legacy requests.';

comment on column public.lead_requests.request_source is
  'Private enquiry source: marketplace_listing, farmer_profile, supplier_profile, generic_sourcing, or legacy.';

comment on column public.lead_requests.listing_snapshot is
  'Public-only listing/profile summary captured at request time. Never store private seller contact details here.';

comment on column public.lead_requests.request_dedupe_key is
  'HMAC-derived duplicate key generated server-side. Does not store raw IP, phone, or secret material.';

comment on table public.lead_request_rate_limits is
  'Durable server-side rate-limit counters for public lead request routes. Keys are HMAC-derived and contain no raw IP addresses.';

commit;

-- Ghana Growers Supabase Phase 1 core records
-- Run this in the Supabase SQL Editor before enabling admin persistence.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.farmers (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  farmer_name text not null,
  farm_name text not null,
  region text not null,
  district text not null,
  farm_type text not null,
  products text[] not null default '{}',
  farm_size text,
  whatsapp_number text,
  verification_status text not null default 'Pending Verification',
  profile_image_url text,
  description text,
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  company_name text not null,
  contact_person text not null,
  region text not null,
  district text not null,
  category text not null,
  products_services text[] not null default '{}',
  service_coverage_area text,
  whatsapp_number text,
  phone text,
  website text,
  verification_status text not null default 'Pending Verification',
  logo_url text,
  status text not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  product_name text not null,
  category text not null,
  region text not null,
  district text not null,
  seller_name text not null,
  seller_type text not null default 'Farmer',
  farmer_id uuid references public.farmers(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  quantity text not null,
  unit text not null,
  availability text not null,
  price_range text,
  image_url text,
  whatsapp_number text,
  verification_status text not null default 'Pending Verification',
  status text not null default 'Active',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buyer_requests (
  id uuid primary key default gen_random_uuid(),
  product_needed text not null,
  quantity text not null,
  region text not null,
  district text not null,
  buyer_name text,
  buyer_type text not null,
  deadline date,
  status text not null default 'Open',
  budget_range text,
  delivery_preference text,
  whatsapp_number text,
  notes text,
  verification_status text not null default 'Pending Verification',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_prices (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  region text not null,
  market text not null,
  wholesale_price text not null,
  retail_price text not null,
  currency text not null default 'GHS',
  date_updated date not null,
  trend text not null default 'Stable',
  source text,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_farmers_updated_at on public.farmers;
create trigger set_farmers_updated_at
before update on public.farmers
for each row execute function public.set_updated_at();

drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists set_marketplace_listings_updated_at on public.marketplace_listings;
create trigger set_marketplace_listings_updated_at
before update on public.marketplace_listings
for each row execute function public.set_updated_at();

drop trigger if exists set_buyer_requests_updated_at on public.buyer_requests;
create trigger set_buyer_requests_updated_at
before update on public.buyer_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_market_prices_updated_at on public.market_prices;
create trigger set_market_prices_updated_at
before update on public.market_prices
for each row execute function public.set_updated_at();

alter table public.farmers enable row level security;
alter table public.suppliers enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.buyer_requests enable row level security;
alter table public.market_prices enable row level security;

create index if not exists farmers_region_idx on public.farmers(region);
create index if not exists suppliers_region_idx on public.suppliers(region);
create index if not exists marketplace_listings_region_idx on public.marketplace_listings(region);
create index if not exists buyer_requests_region_idx on public.buyer_requests(region);
create index if not exists market_prices_region_idx on public.market_prices(region);

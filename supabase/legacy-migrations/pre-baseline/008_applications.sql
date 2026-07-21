create table if not exists public.farmer_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_or_farm_name text,
  phone text not null,
  whatsapp_number text not null,
  email text not null,
  region text,
  district text,
  user_type text not null default 'Farmer',
  products_or_services text,
  notes text,
  status text not null default 'New' check (status in ('New', 'Under Review', 'Approved', 'Rejected', 'Converted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buyer_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_or_farm_name text,
  phone text not null,
  whatsapp_number text not null,
  email text not null,
  region text,
  district text,
  user_type text not null default 'Buyer',
  products_or_services text,
  notes text,
  status text not null default 'New' check (status in ('New', 'Under Review', 'Approved', 'Rejected', 'Converted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supplier_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_or_farm_name text,
  phone text not null,
  whatsapp_number text not null,
  email text not null,
  region text,
  district text,
  user_type text not null default 'Supplier',
  products_or_services text,
  notes text,
  status text not null default 'New' check (status in ('New', 'Under Review', 'Approved', 'Rejected', 'Converted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.farmer_applications enable row level security;
alter table public.buyer_applications enable row level security;
alter table public.supplier_applications enable row level security;

create index if not exists farmer_applications_status_idx on public.farmer_applications (status, created_at desc);
create index if not exists buyer_applications_status_idx on public.buyer_applications (status, created_at desc);
create index if not exists supplier_applications_status_idx on public.supplier_applications (status, created_at desc);

alter table public.admin_activity_log drop constraint if exists admin_activity_log_action_type_check;
alter table public.admin_activity_log drop constraint if exists admin_activity_log_entity_type_check;

alter table public.admin_activity_log
  add constraint admin_activity_log_action_type_check
  check (action_type in ('Create', 'Edit', 'Verify', 'Archive', 'Review', 'Approve', 'Reject', 'Convert'));

alter table public.admin_activity_log
  add constraint admin_activity_log_entity_type_check
  check (entity_type in ('Farmer', 'Supplier', 'Marketplace Listing', 'Buyer Request', 'Farmer Application', 'Buyer Application', 'Supplier Application'));

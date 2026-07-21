create table if not exists public.listing_submissions (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  category text not null,
  quantity text not null,
  unit text not null,
  region text not null,
  district text not null,
  seller_name text not null,
  seller_type text not null check (seller_type in ('Farmer', 'Supplier')),
  whatsapp_number text not null,
  description text not null,
  image_url text,
  status text not null default 'New' check (status in ('New', 'Under Review', 'Approved', 'Rejected', 'Converted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.buyer_request_submissions (
  id uuid primary key default gen_random_uuid(),
  product_needed text not null,
  quantity text not null,
  region text not null,
  district text not null,
  buyer_name text not null,
  buyer_type text not null,
  whatsapp_number text not null,
  deadline date not null,
  notes text,
  status text not null default 'New' check (status in ('New', 'Under Review', 'Approved', 'Rejected', 'Converted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listing_submissions enable row level security;
alter table public.buyer_request_submissions enable row level security;

create index if not exists listing_submissions_status_idx on public.listing_submissions (status, created_at desc);
create index if not exists buyer_request_submissions_status_idx on public.buyer_request_submissions (status, created_at desc);

alter table public.admin_activity_log drop constraint if exists admin_activity_log_action_type_check;
alter table public.admin_activity_log drop constraint if exists admin_activity_log_entity_type_check;

alter table public.admin_activity_log
  add constraint admin_activity_log_action_type_check
  check (action_type in ('Create', 'Edit', 'Verify', 'Archive', 'Review', 'Approve', 'Reject', 'Convert'));

alter table public.admin_activity_log
  add constraint admin_activity_log_entity_type_check
  check (entity_type in ('Farmer', 'Supplier', 'Marketplace Listing', 'Buyer Request', 'Farmer Application', 'Buyer Application', 'Supplier Application', 'Listing Submission', 'Buyer Request Submission'));

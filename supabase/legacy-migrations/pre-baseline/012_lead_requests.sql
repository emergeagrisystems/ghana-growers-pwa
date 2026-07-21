-- Ghana Growers Phase 1 lead capture queue
-- Run this in Supabase SQL Editor to store public Request Connection submissions.

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
  constraint lead_requests_status_check check (status in ('New', 'Contacted', 'Negotiating', 'Closed')),
  constraint lead_requests_source_type_check check (source_type in ('Farmer', 'Supplier', 'Marketplace Listing'))
);

drop trigger if exists set_lead_requests_updated_at on public.lead_requests;
create trigger set_lead_requests_updated_at
before update on public.lead_requests
for each row execute function public.set_updated_at();

alter table public.lead_requests enable row level security;

create index if not exists lead_requests_status_idx on public.lead_requests(status);
create index if not exists lead_requests_source_idx on public.lead_requests(source_type, source_id);
create index if not exists lead_requests_created_at_idx on public.lead_requests(created_at desc);

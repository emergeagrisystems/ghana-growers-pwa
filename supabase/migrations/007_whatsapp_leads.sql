create table if not exists public.whatsapp_leads (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_id text not null,
  source_name text not null,
  phone_number text not null,
  page_path text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_leads enable row level security;

create index if not exists whatsapp_leads_created_at_idx
  on public.whatsapp_leads (created_at desc);

create index if not exists whatsapp_leads_source_idx
  on public.whatsapp_leads (source_type, source_id);

comment on table public.whatsapp_leads is
  'Tracks public WhatsApp contact clicks across Ghana Growers.';

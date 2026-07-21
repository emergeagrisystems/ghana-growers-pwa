alter table public.farmers
  add column if not exists source text;

create index if not exists farmers_whatsapp_number_idx
  on public.farmers (whatsapp_number);

create index if not exists farmers_source_idx
  on public.farmers (source);

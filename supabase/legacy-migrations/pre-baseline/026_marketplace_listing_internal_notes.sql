alter table public.marketplace_listings
  add column if not exists internal_operations_notes text;

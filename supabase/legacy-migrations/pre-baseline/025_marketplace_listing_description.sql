alter table public.marketplace_listings
  add column if not exists description text;

alter table public.marketplace_listings
  add column if not exists image_urls text[];

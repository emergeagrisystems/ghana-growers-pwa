-- Ghana Growers Tally farmer application details
-- Run this in Supabase SQL Editor before relying on full imported farmer review.

alter table public.farmers
  add column if not exists phone_number text,
  add column if not exists email text,
  add column if not exists farm_location text,
  add column if not exists farming_experience text,
  add column if not exists currently_harvesting text,
  add column if not exists supply_frequency text,
  add column if not exists delivery_preference text,
  add column if not exists payment_preference text,
  add column if not exists workshop_interest text,
  add column if not exists referral_source text,
  add column if not exists tally_photo_url text,
  add column if not exists original_tally_data jsonb;

create index if not exists farmers_phone_number_idx
  on public.farmers (phone_number);

create index if not exists farmers_email_idx
  on public.farmers (email);

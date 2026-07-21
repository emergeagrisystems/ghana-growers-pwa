begin;

alter table public.marketplace_listings
  add column if not exists selling_method text,
  add column if not exists selling_unit text,
  add column if not exists custom_unit_label text,
  add column if not exists custom_unit_reviewed boolean not null default false,
  add column if not exists unit_size_value numeric(14,3),
  add column if not exists unit_size_measure text,
  add column if not exists unit_size_approximate boolean not null default false,
  add column if not exists price_amount numeric(14,2),
  add column if not exists price_currency text default 'GHS',
  add column if not exists price_basis text,
  add column if not exists units_available numeric(14,3),
  add column if not exists total_quantity_value numeric(14,3),
  add column if not exists total_quantity_measure text,
  add column if not exists minimum_order_value numeric(14,3),
  add column if not exists minimum_order_unit text,
  add column if not exists supply_frequency text,
  add column if not exists available_from_date date,
  add column if not exists grade_description text,
  add column if not exists delivery_details text,
  add column if not exists record_source text;

alter table public.listing_submissions
  add column if not exists selling_method text,
  add column if not exists selling_unit text,
  add column if not exists custom_unit_label text,
  add column if not exists custom_unit_reviewed boolean not null default false,
  add column if not exists unit_size_value numeric(14,3),
  add column if not exists unit_size_measure text,
  add column if not exists unit_size_approximate boolean not null default false,
  add column if not exists price_amount numeric(14,2),
  add column if not exists price_currency text default 'GHS',
  add column if not exists price_basis text,
  add column if not exists units_available numeric(14,3),
  add column if not exists total_quantity_value numeric(14,3),
  add column if not exists total_quantity_measure text,
  add column if not exists minimum_order_value numeric(14,3),
  add column if not exists minimum_order_unit text,
  add column if not exists availability text,
  add column if not exists supply_frequency text,
  add column if not exists available_from_date date,
  add column if not exists grade_description text,
  add column if not exists delivery_details text,
  add column if not exists record_source text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'marketplace_listings_selling_method_check' and conrelid = 'public.marketplace_listings'::regclass) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_selling_method_check
      check (selling_method is null or selling_method in ('packaged_unit', 'weight', 'count', 'livestock', 'volume'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'marketplace_listings_price_amount_check' and conrelid = 'public.marketplace_listings'::regclass) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_price_amount_check
      check (price_amount is null or price_amount >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'marketplace_listings_unit_size_value_check' and conrelid = 'public.marketplace_listings'::regclass) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_unit_size_value_check
      check (unit_size_value is null or unit_size_value > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'marketplace_listings_units_available_check' and conrelid = 'public.marketplace_listings'::regclass) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_units_available_check
      check (units_available is null or units_available >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'marketplace_listings_total_quantity_value_check' and conrelid = 'public.marketplace_listings'::regclass) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_total_quantity_value_check
      check (total_quantity_value is null or total_quantity_value >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'marketplace_listings_minimum_order_value_check' and conrelid = 'public.marketplace_listings'::regclass) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_minimum_order_value_check
      check (minimum_order_value is null or minimum_order_value > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'marketplace_listings_price_currency_check' and conrelid = 'public.marketplace_listings'::regclass) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_price_currency_check
      check (price_currency is null or price_currency ~ '^[A-Z]{3}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'marketplace_listings_supply_frequency_check' and conrelid = 'public.marketplace_listings'::regclass) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_supply_frequency_check
      check (supply_frequency is null or supply_frequency in ('One-time', 'Weekly', 'Monthly', 'On request'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'marketplace_listings_custom_unit_label_check' and conrelid = 'public.marketplace_listings'::regclass) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_custom_unit_label_check
      check (selling_unit is null or lower(selling_unit) <> 'other' or nullif(trim(custom_unit_label), '') is not null);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_submissions_selling_method_check' and conrelid = 'public.listing_submissions'::regclass) then
    alter table public.listing_submissions
      add constraint listing_submissions_selling_method_check
      check (selling_method is null or selling_method in ('packaged_unit', 'weight', 'count', 'livestock', 'volume'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_submissions_price_amount_check' and conrelid = 'public.listing_submissions'::regclass) then
    alter table public.listing_submissions
      add constraint listing_submissions_price_amount_check
      check (price_amount is null or price_amount >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_submissions_unit_size_value_check' and conrelid = 'public.listing_submissions'::regclass) then
    alter table public.listing_submissions
      add constraint listing_submissions_unit_size_value_check
      check (unit_size_value is null or unit_size_value > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_submissions_units_available_check' and conrelid = 'public.listing_submissions'::regclass) then
    alter table public.listing_submissions
      add constraint listing_submissions_units_available_check
      check (units_available is null or units_available >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_submissions_total_quantity_value_check' and conrelid = 'public.listing_submissions'::regclass) then
    alter table public.listing_submissions
      add constraint listing_submissions_total_quantity_value_check
      check (total_quantity_value is null or total_quantity_value >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_submissions_minimum_order_value_check' and conrelid = 'public.listing_submissions'::regclass) then
    alter table public.listing_submissions
      add constraint listing_submissions_minimum_order_value_check
      check (minimum_order_value is null or minimum_order_value > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_submissions_price_currency_check' and conrelid = 'public.listing_submissions'::regclass) then
    alter table public.listing_submissions
      add constraint listing_submissions_price_currency_check
      check (price_currency is null or price_currency ~ '^[A-Z]{3}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_submissions_supply_frequency_check' and conrelid = 'public.listing_submissions'::regclass) then
    alter table public.listing_submissions
      add constraint listing_submissions_supply_frequency_check
      check (supply_frequency is null or supply_frequency in ('One-time', 'Weekly', 'Monthly', 'On request'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listing_submissions_custom_unit_label_check' and conrelid = 'public.listing_submissions'::regclass) then
    alter table public.listing_submissions
      add constraint listing_submissions_custom_unit_label_check
      check (selling_unit is null or lower(selling_unit) <> 'other' or nullif(trim(custom_unit_label), '') is not null);
  end if;
end $$;

create index if not exists marketplace_listings_record_source_idx
  on public.marketplace_listings(record_source);

create index if not exists marketplace_listings_selling_method_idx
  on public.marketplace_listings(selling_method);

commit;

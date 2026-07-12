begin;

create table if not exists public.listing_submissions (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  category text not null,
  quantity text not null,
  unit text not null,
  region text not null,
  district text not null,
  seller_name text not null,
  seller_type text not null,
  whatsapp_number text not null,
  description text not null,
  image_url text,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_submissions_seller_type_check
    check (seller_type in ('Farmer', 'Supplier')),
  constraint listing_submissions_status_check
    check (status in ('New', 'Under Review', 'Approved', 'Rejected', 'Converted'))
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_submissions_seller_type_check'
      and conrelid = 'public.listing_submissions'::regclass
  ) then
    alter table public.listing_submissions
      add constraint listing_submissions_seller_type_check
      check (seller_type in ('Farmer', 'Supplier'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_submissions_status_check'
      and conrelid = 'public.listing_submissions'::regclass
  ) then
    alter table public.listing_submissions
      add constraint listing_submissions_status_check
      check (status in ('New', 'Under Review', 'Approved', 'Rejected', 'Converted'));
  end if;
end $$;

drop trigger if exists set_listing_submissions_updated_at on public.listing_submissions;
create trigger set_listing_submissions_updated_at
before update on public.listing_submissions
for each row execute function public.set_updated_at();

alter table public.listing_submissions enable row level security;

create index if not exists listing_submissions_status_idx
  on public.listing_submissions (status, created_at desc);

create index if not exists listing_submissions_product_idx
  on public.listing_submissions (product_name);

create index if not exists listing_submissions_region_idx
  on public.listing_submissions (region);

revoke all on table public.listing_submissions from anon;
revoke all on table public.listing_submissions from authenticated;

grant insert (
  product_name,
  category,
  quantity,
  unit,
  region,
  district,
  seller_name,
  seller_type,
  whatsapp_number,
  description,
  image_url,
  status
) on public.listing_submissions to anon;

grant select, insert, update, delete on public.listing_submissions to service_role;

drop policy if exists "Allow public listing submission insert" on public.listing_submissions;
create policy "Allow public listing submission insert"
on public.listing_submissions
for insert
to anon
with check (
  status in ('New', 'Under Review')
  and nullif(trim(product_name), '') is not null
  and nullif(trim(category), '') is not null
  and nullif(trim(quantity), '') is not null
  and nullif(trim(unit), '') is not null
  and nullif(trim(region), '') is not null
  and nullif(trim(district), '') is not null
  and nullif(trim(seller_name), '') is not null
  and seller_type in ('Farmer', 'Supplier')
  and nullif(trim(whatsapp_number), '') is not null
  and nullif(trim(description), '') is not null
);

drop policy if exists "Allow service role listing submission access" on public.listing_submissions;
create policy "Allow service role listing submission access"
on public.listing_submissions
for all
to service_role
using (true)
with check (true);

comment on table public.listing_submissions is
  'Public seller listing submissions queued for Ghana Growers admin review before conversion into marketplace_listings.';

commit;

-- Farmer-owned Marketplace Listings
-- Adds explicit ownership fields so listings can be connected to farmer and supplier profiles.

alter table public.marketplace_listings
  add column if not exists owner_type text not null default 'Admin',
  add column if not exists owner_id uuid,
  add column if not exists owner_name text;

update public.marketplace_listings
set owner_type = case
  when lower(coalesce(seller_type, '')) = 'supplier' then 'Supplier'
  when lower(coalesce(seller_type, '')) = 'admin' then 'Admin'
  else 'Farmer'
end
where owner_type is null or owner_type = '';

update public.marketplace_listings
set owner_name = coalesce(nullif(owner_name, ''), nullif(seller_name, ''), 'Ghana Growers')
where owner_name is null or owner_name = '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'marketplace_listings_owner_type_check'
  ) then
    alter table public.marketplace_listings
      add constraint marketplace_listings_owner_type_check
      check (owner_type in ('Farmer', 'Supplier', 'Admin'));
  end if;
end $$;

create index if not exists marketplace_listings_owner_idx
  on public.marketplace_listings(owner_type, owner_id);

create index if not exists marketplace_listings_owner_name_idx
  on public.marketplace_listings(owner_name);

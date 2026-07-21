alter table public.farmers
  add column if not exists gg_standard_status text not null default 'Pending';

alter table public.suppliers
  add column if not exists gg_standard_status text not null default 'Pending';

alter table public.farmers
  drop constraint if exists farmers_gg_standard_status_check;

alter table public.farmers
  add constraint farmers_gg_standard_status_check
  check (gg_standard_status in ('Pending', 'Member', 'Suspended'));

alter table public.suppliers
  drop constraint if exists suppliers_gg_standard_status_check;

alter table public.suppliers
  add constraint suppliers_gg_standard_status_check
  check (gg_standard_status in ('Pending', 'Member', 'Suspended'));

comment on column public.farmers.gg_standard_status is
  'Ghana Growers Standard membership status. Separate from verification. Values: Pending, Member, Suspended.';

comment on column public.suppliers.gg_standard_status is
  'Ghana Growers Standard membership status. Separate from verification. Values: Pending, Member, Suspended.';

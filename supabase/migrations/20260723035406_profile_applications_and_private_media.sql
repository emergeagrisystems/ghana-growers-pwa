begin;

create table if not exists public.farmer_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null,
  farm_name text,
  phone_number text not null,
  whatsapp_number text,
  email text,
  region text not null,
  district text not null,
  location text,
  farm_type text not null default 'Crop',
  crops_products text[] not null default '{}',
  other_products text,
  farm_size text,
  farming_experience text,
  production_details text,
  current_availability text,
  supply_frequency text,
  harvest_season text,
  delivery_preference text,
  application_message text,
  private_profile_image_path text,
  private_farm_image_paths text[] not null default '{}',
  private_produce_image_paths text[] not null default '{}',
  private_document_paths text[] not null default '{}',
  agreement_accepted boolean not null default false,
  status text not null default 'New',
  review_state text not null default 'Pending Review',
  verification_decision text not null default 'Not Reviewed',
  launch_ready boolean not null default false,
  admin_notes text,
  source text,
  source_metadata jsonb not null default '{}',
  linked_farmer_id uuid,
  reviewed_at timestamptz,
  reviewed_by text,
  approved_at timestamptz,
  rejected_at timestamptz,
  converted_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint farmer_applications_farm_type_check
    check (farm_type in ('Crop', 'Livestock', 'Mixed')),
  constraint farmer_applications_status_check
    check (status in ('New', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Converted')),
  constraint farmer_applications_review_state_check
    check (review_state in ('Pending Review', 'In Review', 'Ready for Decision', 'Decision Recorded')),
  constraint farmer_applications_verification_decision_check
    check (verification_decision in ('Not Reviewed', 'Verified', 'Rejected', 'Needs Information'))
);

alter table public.supplier_applications
  add column if not exists normalized_categories text[] not null default '{}',
  add column if not exists private_logo_path text,
  add column if not exists private_photo_paths text[] not null default '{}',
  add column if not exists private_certificate_paths text[] not null default '{}',
  add column if not exists private_document_paths text[] not null default '{}',
  add column if not exists review_state text not null default 'Pending Review',
  add column if not exists verification_decision text not null default 'Not Reviewed',
  add column if not exists launch_status text not null default 'Needs Improvement',
  add column if not exists homepage_candidate boolean not null default false,
  add column if not exists marketplace_featured boolean not null default false,
  add column if not exists story_candidate boolean not null default false,
  add column if not exists editorial_notes text,
  add column if not exists launch_ready boolean not null default false,
  add column if not exists launch_checklist jsonb not null default '{}',
  add column if not exists editorial_updated_at timestamptz,
  add column if not exists editorial_updated_by text,
  add column if not exists admin_notes text,
  add column if not exists source text,
  add column if not exists source_metadata jsonb not null default '{}',
  add column if not exists linked_supplier_id uuid,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists converted_at timestamptz,
  add column if not exists published_at timestamptz;

alter table public.suppliers
  add column if not exists launch_ready boolean not null default false,
  add column if not exists launch_status text not null default 'Needs Improvement',
  add column if not exists source_application_id uuid,
  add column if not exists verification_date timestamptz,
  add column if not exists verified_by text,
  add column if not exists verification_notes text,
  add column if not exists gg_standard_status text not null default 'Pending',
  add column if not exists profile_review_status text not null default 'Needs Review',
  add column if not exists profile_image_url text,
  add column if not exists source text,
  add column if not exists homepage_candidate boolean not null default false,
  add column if not exists marketplace_featured boolean not null default false,
  add column if not exists story_candidate boolean not null default false,
  add column if not exists editorial_notes text,
  add column if not exists launch_checklist jsonb not null default '{}',
  add column if not exists editorial_updated_at timestamptz,
  add column if not exists editorial_updated_by text;

alter table public.farmers
  add column if not exists source_application_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'supplier_applications_status_check'
      and conrelid = 'public.supplier_applications'::regclass
  ) then
    alter table public.supplier_applications
      add constraint supplier_applications_status_check
      check (status is null or status in ('New', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Converted'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'supplier_applications_review_state_check'
      and conrelid = 'public.supplier_applications'::regclass
  ) then
    alter table public.supplier_applications
      add constraint supplier_applications_review_state_check
      check (review_state in ('Pending Review', 'In Review', 'Ready for Decision', 'Decision Recorded'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'supplier_applications_verification_decision_check'
      and conrelid = 'public.supplier_applications'::regclass
  ) then
    alter table public.supplier_applications
      add constraint supplier_applications_verification_decision_check
      check (verification_decision in ('Not Reviewed', 'Verified', 'Rejected', 'Needs Information'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'supplier_applications_launch_status_check'
      and conrelid = 'public.supplier_applications'::regclass
  ) then
    alter table public.supplier_applications
      add constraint supplier_applications_launch_status_check
      check (launch_status in ('Public Supplier', 'Featured Supplier', 'Founding Supplier 2026', 'Needs Improvement', 'Hold'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'suppliers_launch_status_check'
      and conrelid = 'public.suppliers'::regclass
  ) then
    alter table public.suppliers
      add constraint suppliers_launch_status_check
      check (launch_status in ('Public Supplier', 'Featured Supplier', 'Founding Supplier 2026', 'Needs Improvement', 'Hold'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'suppliers_profile_review_status_check'
      and conrelid = 'public.suppliers'::regclass
  ) then
    alter table public.suppliers
      add constraint suppliers_profile_review_status_check
      check (profile_review_status in ('Needs Review', 'In Review', 'Ready', 'Hold'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'farmer_applications_linked_farmer_id_fkey'
      and conrelid = 'public.farmer_applications'::regclass
  ) then
    alter table public.farmer_applications
      add constraint farmer_applications_linked_farmer_id_fkey
      foreign key (linked_farmer_id) references public.farmers(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'farmers_source_application_id_fkey'
      and conrelid = 'public.farmers'::regclass
  ) then
    alter table public.farmers
      add constraint farmers_source_application_id_fkey
      foreign key (source_application_id) references public.farmer_applications(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'supplier_applications_linked_supplier_id_fkey'
      and conrelid = 'public.supplier_applications'::regclass
  ) then
    alter table public.supplier_applications
      add constraint supplier_applications_linked_supplier_id_fkey
      foreign key (linked_supplier_id) references public.suppliers(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'suppliers_source_application_id_fkey'
      and conrelid = 'public.suppliers'::regclass
  ) then
    alter table public.suppliers
      add constraint suppliers_source_application_id_fkey
      foreign key (source_application_id) references public.supplier_applications(id) on delete set null;
  end if;
end
$$;

create unique index if not exists farmer_applications_linked_farmer_uidx
  on public.farmer_applications (linked_farmer_id)
  where linked_farmer_id is not null;

create unique index if not exists farmers_source_application_uidx
  on public.farmers (source_application_id)
  where source_application_id is not null;

create unique index if not exists supplier_applications_linked_supplier_uidx
  on public.supplier_applications (linked_supplier_id)
  where linked_supplier_id is not null;

create unique index if not exists suppliers_source_application_uidx
  on public.suppliers (source_application_id)
  where source_application_id is not null;

create index if not exists farmer_applications_status_created_idx
  on public.farmer_applications (status, created_at desc);

create index if not exists farmer_applications_review_state_idx
  on public.farmer_applications (review_state, created_at desc);

create index if not exists supplier_applications_review_state_idx
  on public.supplier_applications (review_state, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_farmer_applications_updated_at'
      and tgrelid = 'public.farmer_applications'::regclass
      and not tgisinternal
  ) then
    create trigger set_farmer_applications_updated_at
      before update on public.farmer_applications
      for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_supplier_applications_updated_at'
      and tgrelid = 'public.supplier_applications'::regclass
      and not tgisinternal
  ) then
    create trigger set_supplier_applications_updated_at
      before update on public.supplier_applications
      for each row execute function public.set_updated_at();
  end if;
end
$$;

alter table public.farmer_applications enable row level security;
alter table public.supplier_applications enable row level security;

revoke all on table public.farmer_applications from public, anon, authenticated;
revoke all on table public.supplier_applications from public, anon, authenticated;
grant all on table public.farmer_applications to service_role;
grant all on table public.supplier_applications to service_role;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'farmer_applications'
      and policyname = 'Service role manages farmer applications'
  ) then
    create policy "Service role manages farmer applications"
      on public.farmer_applications
      for all
      to service_role
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'supplier_applications'
      and policyname = 'Service role manages supplier applications'
  ) then
    create policy "Service role manages supplier applications"
      on public.supplier_applications
      for all
      to service_role
      using (true)
      with check (true);
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'farmer-application-media',
    'farmer-application-media',
    false,
    8388608,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'supplier-application-media',
    'supplier-application-media',
    false,
    8388608,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Service role manages private profile application media'
  ) then
    create policy "Service role manages private profile application media"
      on storage.objects
      for all
      to service_role
      using (bucket_id in ('farmer-application-media', 'supplier-application-media'))
      with check (bucket_id in ('farmer-application-media', 'supplier-application-media'));
  end if;
end
$$;

comment on table public.farmer_applications is
  'Private farmer applications. Server and authenticated admin workflows only; never expose through public profile DTOs.';
comment on column public.farmer_applications.private_document_paths is
  'Private storage object paths only. Never store signed or public URLs.';
comment on column public.supplier_applications.private_certificate_paths is
  'Private storage object paths only. Never expose certificates in public supplier DTOs.';
comment on column public.farmers.source_application_id is
  'Optional one-to-one source application link. Does not make a profile public.';
comment on column public.suppliers.source_application_id is
  'Optional one-to-one source application link. Does not make a profile public.';

commit;

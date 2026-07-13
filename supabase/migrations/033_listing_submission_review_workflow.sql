begin;

alter table public.listing_submissions
  add column if not exists submission_reference text,
  add column if not exists marketplace_pathway text,
  add column if not exists subcategory text,
  add column if not exists variety text,
  add column if not exists seller_contact_name text,
  add column if not exists phone_number text,
  add column if not exists whatsapp_same_as_phone boolean not null default false,
  add column if not exists existing_member text,
  add column if not exists pickup_location text,
  add column if not exists delivery_available text,
  add column if not exists additional_notes text,
  add column if not exists image_urls text[],
  add column if not exists main_image_path text,
  add column if not exists seller_match_status text,
  add column if not exists matched_farmer_id uuid,
  add column if not exists matched_supplier_id uuid,
  add column if not exists assigned_reviewer text,
  add column if not exists admin_notes text,
  add column if not exists seller_message text,
  add column if not exists status_history jsonb not null default '[]'::jsonb,
  add column if not exists published_listing_id uuid,
  add column if not exists published_at timestamptz,
  add column if not exists published_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists submission_dedupe_key text,
  add column if not exists source text not null default 'public_submission';

alter table public.marketplace_listings
  add column if not exists source_submission_id uuid references public.listing_submissions(id) on delete set null;

update public.listing_submissions
set submission_reference = 'LS-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where submission_reference is null;

alter table public.listing_submissions
  alter column submission_reference set default ('LS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));

create unique index if not exists listing_submissions_reference_idx
  on public.listing_submissions (submission_reference);

create unique index if not exists listing_submissions_dedupe_open_idx
  on public.listing_submissions (submission_dedupe_key)
  where submission_dedupe_key is not null
    and status not in ('Rejected', 'Expired', 'Published', 'Converted');

create index if not exists listing_submissions_phone_idx
  on public.listing_submissions (phone_number);

create index if not exists listing_submissions_source_idx
  on public.listing_submissions (source);

create index if not exists listing_submissions_published_listing_idx
  on public.listing_submissions (published_listing_id);

create index if not exists listing_submissions_assigned_reviewer_idx
  on public.listing_submissions (assigned_reviewer);

create unique index if not exists marketplace_listings_source_submission_idx
  on public.marketplace_listings (source_submission_id)
  where source_submission_id is not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'listing_submissions_status_check'
      and conrelid = 'public.listing_submissions'::regclass
  ) then
    alter table public.listing_submissions
      drop constraint listing_submissions_status_check;
  end if;

  alter table public.listing_submissions
    add constraint listing_submissions_status_check
    check (status in ('New', 'Needs Information', 'Under Review', 'Approved', 'Published', 'Paused', 'Rejected', 'Expired', 'Converted'));

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_submissions_existing_member_check'
      and conrelid = 'public.listing_submissions'::regclass
  ) then
    alter table public.listing_submissions
      add constraint listing_submissions_existing_member_check
      check (existing_member is null or existing_member in ('Yes', 'No', 'Not sure'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_submissions_delivery_available_check'
      and conrelid = 'public.listing_submissions'::regclass
  ) then
    alter table public.listing_submissions
      add constraint listing_submissions_delivery_available_check
      check (delivery_available is null or delivery_available in ('Yes', 'No', 'To be confirmed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_submissions_source_check'
      and conrelid = 'public.listing_submissions'::regclass
  ) then
    alter table public.listing_submissions
      add constraint listing_submissions_source_check
      check (source in ('public_submission', 'admin', 'whatsapp_assisted', 'import'));
  end if;
end $$;

create table if not exists public.listing_submission_rate_limits (
  request_key text primary key,
  window_start timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listing_submission_rate_limits enable row level security;

revoke all on table public.listing_submission_rate_limits from anon;
revoke all on table public.listing_submission_rate_limits from authenticated;
grant select, insert, update, delete on public.listing_submission_rate_limits to service_role;

create table if not exists public.listing_submission_publication_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.listing_submissions(id) on delete set null,
  public_paths text[] not null,
  reason text not null,
  last_error text,
  status text not null default 'Pending' check (status in ('Pending', 'Resolved', 'Failed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.listing_submission_publication_cleanup_queue enable row level security;

revoke all on table public.listing_submission_publication_cleanup_queue from anon;
revoke all on table public.listing_submission_publication_cleanup_queue from authenticated;
grant select, insert, update, delete on public.listing_submission_publication_cleanup_queue to service_role;

create or replace function public.consume_listing_submission_rate_limit(
  p_request_key text,
  p_window_seconds integer default 600,
  p_max_attempts integer default 3
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_attempt_count integer;
  v_reset_at timestamptz;
  v_allowed boolean;
begin
  if nullif(trim(p_request_key), '') is null then
    raise exception 'A request key is required.';
  end if;

  if p_window_seconds <= 0 or p_max_attempts <= 0 then
    raise exception 'Rate limit window and attempt count must be positive.';
  end if;

  delete from public.listing_submission_rate_limits
  where window_start < v_now - interval '2 days';

  loop
    update public.listing_submission_rate_limits
    set
      window_start = case
        when window_start <= v_now - make_interval(secs => p_window_seconds) then v_now
        else window_start
      end,
      attempt_count = case
        when window_start <= v_now - make_interval(secs => p_window_seconds) then 1
        else attempt_count + 1
      end,
      last_attempt_at = v_now,
      updated_at = v_now
    where request_key = p_request_key
    returning window_start, attempt_count
      into v_window_start, v_attempt_count;

    if found then
      exit;
    end if;

    begin
      insert into public.listing_submission_rate_limits (
        request_key,
        window_start,
        attempt_count,
        last_attempt_at,
        created_at,
        updated_at
      )
      values (
        p_request_key,
        v_now,
        1,
        v_now,
        v_now,
        v_now
      )
      returning window_start, attempt_count
        into v_window_start, v_attempt_count;
      exit;
    exception when unique_violation then
      -- A concurrent request inserted the key. Retry and update the locked row.
    end;
  end loop;

  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);
  v_allowed := v_attempt_count <= p_max_attempts;

  return jsonb_build_object(
    'allowed', v_allowed,
    'attempt_count', v_attempt_count,
    'remaining', greatest(p_max_attempts - v_attempt_count, 0),
    'reset_at', v_reset_at
  );
end;
$$;

revoke all on function public.consume_listing_submission_rate_limit(text, integer, integer) from public;
revoke all on function public.consume_listing_submission_rate_limit(text, integer, integer) from anon;
revoke all on function public.consume_listing_submission_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.consume_listing_submission_rate_limit(text, integer, integer) to service_role;

create or replace function public.slugify_marketplace_listing(value text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(trim(both '-' from regexp_replace(lower(coalesce(value, 'listing')), '[^a-z0-9]+', '-', 'g')), ''),
    'listing'
  );
$$;

revoke all on function public.slugify_marketplace_listing(text) from public;
revoke all on function public.slugify_marketplace_listing(text) from anon;
revoke all on function public.slugify_marketplace_listing(text) from authenticated;
grant execute on function public.slugify_marketplace_listing(text) to service_role;

create or replace function public.publish_listing_submission(
  p_submission_id uuid,
  p_admin_email text,
  p_public_image_urls text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission public.listing_submissions%rowtype;
  v_existing public.marketplace_listings%rowtype;
  v_listing public.marketplace_listings%rowtype;
  v_owner_type text;
  v_base_slug text;
  v_slug text;
  v_suffix integer := 2;
  v_status_history jsonb;
begin
  if p_submission_id is null then
    raise exception 'Submission ID is required.';
  end if;

  if nullif(trim(p_admin_email), '') is null then
    raise exception 'Approving admin is required.';
  end if;

  select *
  into v_submission
  from public.listing_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'Listing submission was not found.';
  end if;

  select *
  into v_existing
  from public.marketplace_listings
  where source_submission_id = p_submission_id
     or (v_submission.published_listing_id is not null and id = v_submission.published_listing_id)
  limit 1;

  if found then
    update public.listing_submissions
    set
      status = 'Published',
      published_listing_id = v_existing.id,
      published_at = coalesce(published_at, now()),
      published_by = coalesce(published_by, p_admin_email),
      approved_at = coalesce(approved_at, now()),
      approved_by = coalesce(approved_by, p_admin_email),
      assigned_reviewer = p_admin_email,
      updated_at = now()
    where id = p_submission_id;

    return jsonb_build_object(
      'listing_id', v_existing.id,
      'slug', v_existing.slug,
      'reused', true
    );
  end if;

  if v_submission.status in ('Published', 'Converted', 'Rejected', 'Expired', 'Paused') then
    raise exception 'Submission status % is not eligible for publication.', v_submission.status;
  end if;

  if p_public_image_urls is null or array_length(p_public_image_urls, 1) is null then
    raise exception 'At least one approved public image is required.';
  end if;

  v_owner_type := case when v_submission.seller_type = 'Supplier' then 'Supplier' else 'Farmer' end;
  v_base_slug := public.slugify_marketplace_listing(v_submission.product_name || '-' || v_submission.seller_name);
  v_slug := v_base_slug;

  while exists (select 1 from public.marketplace_listings where slug = v_slug) loop
    v_slug := v_base_slug || '-' || v_suffix::text;
    v_suffix := v_suffix + 1;
  end loop;

  insert into public.marketplace_listings (
    slug,
    product_name,
    category,
    region,
    district,
    seller_name,
    seller_type,
    owner_type,
    owner_id,
    owner_name,
    quantity,
    unit,
    selling_method,
    selling_unit,
    custom_unit_label,
    custom_unit_reviewed,
    unit_size_value,
    unit_size_measure,
    unit_size_approximate,
    price_amount,
    price_currency,
    price_basis,
    units_available,
    total_quantity_value,
    total_quantity_measure,
    minimum_order_value,
    minimum_order_unit,
    availability,
    supply_frequency,
    available_from_date,
    grade_description,
    delivery_details,
    record_source,
    source_submission_id,
    description,
    image_url,
    image_urls,
    status,
    verification_status,
    featured
  )
  values (
    v_slug,
    v_submission.product_name,
    v_submission.category,
    v_submission.region,
    v_submission.district,
    v_submission.seller_name,
    v_submission.seller_type,
    v_owner_type,
    null,
    v_submission.seller_name,
    v_submission.quantity,
    v_submission.unit,
    v_submission.selling_method,
    v_submission.selling_unit,
    v_submission.custom_unit_label,
    coalesce(v_submission.custom_unit_reviewed, false),
    v_submission.unit_size_value,
    v_submission.unit_size_measure,
    coalesce(v_submission.unit_size_approximate, false),
    v_submission.price_amount,
    v_submission.price_currency,
    v_submission.price_basis,
    v_submission.units_available,
    v_submission.total_quantity_value,
    v_submission.total_quantity_measure,
    v_submission.minimum_order_value,
    v_submission.minimum_order_unit,
    coalesce(v_submission.availability, 'Available'),
    v_submission.supply_frequency,
    v_submission.available_from_date,
    v_submission.grade_description,
    v_submission.delivery_details,
    'public_submission',
    v_submission.id,
    v_submission.description,
    p_public_image_urls[1],
    p_public_image_urls,
    'Active',
    'Pending Verification',
    false
  )
  returning *
    into v_listing;

  v_status_history := coalesce(v_submission.status_history, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'status', 'Published',
      'actor', p_admin_email,
      'note', 'Approved and published',
      'at', now()
    )
  );

  update public.listing_submissions
  set
    status = 'Published',
    published_listing_id = v_listing.id,
    published_at = now(),
    published_by = p_admin_email,
    approved_at = now(),
    approved_by = p_admin_email,
    assigned_reviewer = p_admin_email,
    status_history = v_status_history,
    updated_at = now()
  where id = v_submission.id;

  return jsonb_build_object(
    'listing_id', v_listing.id,
    'slug', v_listing.slug,
    'reused', false
  );
exception
  when unique_violation then
    select *
    into v_existing
    from public.marketplace_listings
    where source_submission_id = p_submission_id
    limit 1;

    if found then
      update public.listing_submissions
      set
        status = 'Published',
        published_listing_id = v_existing.id,
        published_at = coalesce(published_at, now()),
        published_by = coalesce(published_by, p_admin_email),
        approved_at = coalesce(approved_at, now()),
        approved_by = coalesce(approved_by, p_admin_email),
        assigned_reviewer = p_admin_email,
        updated_at = now()
      where id = p_submission_id;

      return jsonb_build_object(
        'listing_id', v_existing.id,
        'slug', v_existing.slug,
        'reused', true
      );
    end if;

    raise;
end;
$$;

revoke all on function public.publish_listing_submission(uuid, text, text[]) from public;
revoke all on function public.publish_listing_submission(uuid, text, text[]) from anon;
revoke all on function public.publish_listing_submission(uuid, text, text[]) from authenticated;
grant execute on function public.publish_listing_submission(uuid, text, text[]) to service_role;

revoke all on table public.listing_submissions from anon;
revoke all on table public.listing_submissions from authenticated;

grant insert (
  product_name,
  marketplace_pathway,
  subcategory,
  variety,
  category,
  quantity,
  unit,
  selling_method,
  selling_unit,
  custom_unit_label,
  custom_unit_reviewed,
  unit_size_value,
  unit_size_measure,
  unit_size_approximate,
  price_amount,
  price_currency,
  price_basis,
  units_available,
  total_quantity_value,
  total_quantity_measure,
  minimum_order_value,
  minimum_order_unit,
  availability,
  supply_frequency,
  available_from_date,
  grade_description,
  delivery_details,
  pickup_location,
  delivery_available,
  additional_notes,
  region,
  district,
  seller_name,
  seller_contact_name,
  seller_type,
  phone_number,
  whatsapp_number,
  whatsapp_same_as_phone,
  existing_member,
  description
) on public.listing_submissions to anon;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'listing_submissions'
      and policyname = 'Allow public listing submission insert'
  ) then
    alter policy "Allow public listing submission insert"
    on public.listing_submissions
    with check (
      status = 'New'
      and source = 'public_submission'
      and nullif(trim(product_name), '') is not null
      and nullif(trim(category), '') is not null
      and nullif(trim(quantity), '') is not null
      and nullif(trim(unit), '') is not null
      and nullif(trim(region), '') is not null
      and nullif(trim(district), '') is not null
      and nullif(trim(seller_name), '') is not null
      and seller_type in ('Farmer', 'Supplier')
      and nullif(trim(phone_number), '') is not null
      and nullif(trim(whatsapp_number), '') is not null
      and nullif(trim(description), '') is not null
    );
  else
    create policy "Allow public listing submission insert"
    on public.listing_submissions
    for insert
    to anon
    with check (
      status = 'New'
      and source = 'public_submission'
      and nullif(trim(product_name), '') is not null
      and nullif(trim(category), '') is not null
      and nullif(trim(quantity), '') is not null
      and nullif(trim(unit), '') is not null
      and nullif(trim(region), '') is not null
      and nullif(trim(district), '') is not null
      and nullif(trim(seller_name), '') is not null
      and seller_type in ('Farmer', 'Supplier')
      and nullif(trim(phone_number), '') is not null
      and nullif(trim(whatsapp_number), '') is not null
      and nullif(trim(description), '') is not null
    );
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-submissions',
  'listing-submissions',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Service role manages listing submission images'
  ) then
    create policy "Service role manages listing submission images"
    on storage.objects
    for all
    to service_role
    using (bucket_id = 'listing-submissions')
    with check (bucket_id = 'listing-submissions');
  end if;
end $$;

comment on table public.listing_submission_rate_limits is
  'Service-role-only durable public listing submission rate limit buckets keyed by server-side HMAC hashes.';

comment on table public.listing_submission_publication_cleanup_queue is
  'Service-role-only cleanup queue for public marketplace images copied before a failed publication attempt.';

commit;

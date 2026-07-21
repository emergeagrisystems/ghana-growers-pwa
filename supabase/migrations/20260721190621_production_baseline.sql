-- Ghana Growers production schema baseline.
--
-- This schema-only migration was reconstructed from the verified
-- pre-031 production backup, migrations 031-035 as applied manually,
-- and read-only production catalog checks performed on 2026-07-21.
-- It intentionally contains no business records, auth users, private
-- messages, phone numbers, uploaded objects, or other production data.
--
-- The broad anon/authenticated table privileges currently present on
-- farmmate_pilot_feedback are mirrored here for historical exactness.
-- A separate review-only proposal contains the intended hardening.

begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

--
-- PostgreSQL schema-only dump
--

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: consume_lead_request_rate_limit(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consume_lead_request_rate_limit(p_request_key text, p_window_seconds integer DEFAULT 600, p_max_attempts integer DEFAULT 5) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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

  delete from public.lead_request_rate_limits
  where window_start < v_now - interval '2 days';

  loop
    update public.lead_request_rate_limits
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
      insert into public.lead_request_rate_limits (
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


--
-- Name: consume_listing_submission_rate_limit(text, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.consume_listing_submission_rate_limit(p_request_key text, p_window_seconds integer DEFAULT 600, p_max_attempts integer DEFAULT 3) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


--
-- Name: publish_listing_submission(uuid, text, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.publish_listing_submission(p_submission_id uuid, p_admin_email text, p_public_image_urls text[]) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: slugify_marketplace_listing(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.slugify_marketplace_listing(value text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  select coalesce(
    nullif(trim(both '-' from regexp_replace(lower(coalesce(value, 'listing')), '[^a-z0-9]+', '-', 'g')), ''),
    'listing'
  );
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: buyer_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buyer_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_needed text NOT NULL,
    quantity text NOT NULL,
    region text NOT NULL,
    district text NOT NULL,
    buyer_name text,
    buyer_type text NOT NULL,
    deadline date,
    status text DEFAULT 'Open'::text NOT NULL,
    budget_range text,
    delivery_preference text,
    whatsapp_number text,
    notes text,
    verification_status text DEFAULT 'Pending Verification'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: farmers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.farmers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text,
    farmer_name text NOT NULL,
    farm_name text NOT NULL,
    region text NOT NULL,
    district text NOT NULL,
    farm_type text NOT NULL,
    products text[] DEFAULT '{}'::text[] NOT NULL,
    farm_size text,
    whatsapp_number text,
    verification_status text DEFAULT 'Pending Verification'::text NOT NULL,
    profile_image_url text,
    description text,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    verification_date timestamp with time zone,
    verified_by text,
    verification_notes text,
    source text,
    phone_number text,
    email text,
    farm_location text,
    farming_experience text,
    currently_harvesting text,
    supply_frequency text,
    delivery_preference text,
    payment_preference text,
    workshop_interest text,
    referral_source text,
    tally_photo_url text,
    original_tally_data jsonb,
    is_featured boolean DEFAULT false NOT NULL,
    featured_until date,
    featured_note text,
    imported_photo_url text,
    launch_status text DEFAULT 'Needs Improvement'::text NOT NULL,
    homepage_candidate boolean DEFAULT false NOT NULL,
    marketplace_featured boolean DEFAULT false NOT NULL,
    story_candidate boolean DEFAULT false NOT NULL,
    editorial_notes text,
    launch_ready boolean DEFAULT false NOT NULL,
    launch_checklist jsonb DEFAULT '{}'::jsonb NOT NULL,
    editorial_updated_at timestamp with time zone,
    editorial_updated_by text,
    document_urls text[] DEFAULT '{}'::text[],
    gg_standard_status text DEFAULT 'Pending'::text,
    farm_photo_urls text[] DEFAULT '{}'::text[],
    produce_photo_urls text[] DEFAULT '{}'::text[],
    tally_file_references jsonb DEFAULT '{}'::jsonb,
    photo_import_status text,
    photo_import_notes text,
    CONSTRAINT farmers_launch_status_check CHECK ((launch_status = ANY (ARRAY['Public Farmer'::text, 'Featured Farmer'::text, 'Founding Farmer 2026'::text, 'Needs Improvement'::text, 'Hold'::text])))
);


--
-- Name: farmmate_pilot_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.farmmate_pilot_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_or_nickname text,
    region text,
    main_crop text,
    tested_feature text NOT NULL,
    helpfulness text NOT NULL,
    confusion text,
    improvement text,
    would_use_again text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT farmmate_pilot_feedback_helpfulness_check CHECK ((helpfulness = ANY (ARRAY['yes'::text, 'partly'::text, 'not_yet'::text]))),
    CONSTRAINT farmmate_pilot_feedback_would_use_again_check CHECK ((would_use_again = ANY (ARRAY['yes'::text, 'maybe'::text, 'no'::text])))
);


--
-- Name: TABLE farmmate_pilot_feedback; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.farmmate_pilot_feedback IS 'Controlled GG FarmMate pilot feedback. Feedback is submitted server-side only; public clients should not read this table directly.';


--
-- Name: COLUMN farmmate_pilot_feedback.name_or_nickname; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.farmmate_pilot_feedback.name_or_nickname IS 'Optional tester name or nickname. Do not require login, phone number or exact location for pilot feedback.';


--
-- Name: farmmate_usage_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.farmmate_usage_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    anonymous_user_hash text NOT NULL,
    tool text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT farmmate_usage_events_tool_check CHECK ((tool = ANY (ARRAY['ask_farmmate'::text, 'crop_doctor'::text])))
);


--
-- Name: lead_request_rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_request_rate_limits (
    request_key text NOT NULL,
    window_start timestamp with time zone DEFAULT now() NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    last_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lead_request_rate_limits_attempt_count_check CHECK ((attempt_count >= 0))
);


--
-- Name: TABLE lead_request_rate_limits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lead_request_rate_limits IS 'Durable server-side rate-limit counters for public lead request routes. Keys are HMAC-derived and contain no raw IP addresses.';


--
-- Name: lead_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    requester_name text NOT NULL,
    phone text NOT NULL,
    whatsapp text NOT NULL,
    location text NOT NULL,
    product_interest text NOT NULL,
    quantity_needed text,
    message text,
    source_type text NOT NULL,
    source_id text NOT NULL,
    source_name text NOT NULL,
    source_page text,
    status text DEFAULT 'New'::text NOT NULL,
    request_source text DEFAULT 'legacy'::text NOT NULL,
    marketplace_listing_id uuid,
    farmer_profile_id uuid,
    supplier_profile_id uuid,
    source_slug text,
    company_name text,
    whatsapp_same_as_phone boolean DEFAULT false NOT NULL,
    delivery_location text,
    required_by date,
    listing_snapshot jsonb,
    request_dedupe_key text,
    CONSTRAINT lead_requests_request_source_check CHECK ((request_source = ANY (ARRAY['marketplace_listing'::text, 'farmer_profile'::text, 'supplier_profile'::text, 'generic_sourcing'::text, 'legacy'::text]))),
    CONSTRAINT lead_requests_source_type_check CHECK ((source_type = ANY (ARRAY['Farmer'::text, 'Supplier'::text, 'Marketplace Listing'::text, 'Supplier Listing'::text, 'Buyer Request'::text]))),
    CONSTRAINT lead_requests_status_check CHECK ((status = ANY (ARRAY['New'::text, 'Contacted'::text, 'Negotiating'::text, 'Completed'::text, 'Lost'::text])))
);


--
-- Name: TABLE lead_requests; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.lead_requests IS 'Private Ghana Growers buyer enquiry queue used for marketplace listing, farmer profile, supplier profile, generic sourcing, and legacy requests.';


--
-- Name: COLUMN lead_requests.request_source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lead_requests.request_source IS 'Private enquiry source: marketplace_listing, farmer_profile, supplier_profile, generic_sourcing, or legacy.';


--
-- Name: COLUMN lead_requests.listing_snapshot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lead_requests.listing_snapshot IS 'Public-only listing/profile summary captured at request time. Never store private seller contact details here.';


--
-- Name: COLUMN lead_requests.request_dedupe_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.lead_requests.request_dedupe_key IS 'HMAC-derived duplicate key generated server-side. Does not store raw IP, phone, or secret material.';


--
-- Name: listing_submission_publication_cleanup_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_submission_publication_cleanup_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid,
    public_paths text[] NOT NULL,
    reason text NOT NULL,
    last_error text,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    CONSTRAINT listing_submission_publication_cleanup_queue_status_check CHECK ((status = ANY (ARRAY['Pending'::text, 'Resolved'::text, 'Failed'::text])))
);


--
-- Name: TABLE listing_submission_publication_cleanup_queue; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.listing_submission_publication_cleanup_queue IS 'Service-role-only cleanup queue for public marketplace images copied before a failed publication attempt.';


--
-- Name: listing_submission_rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_submission_rate_limits (
    request_key text NOT NULL,
    window_start timestamp with time zone DEFAULT now() NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    last_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT listing_submission_rate_limits_attempt_count_check CHECK ((attempt_count >= 0))
);


--
-- Name: TABLE listing_submission_rate_limits; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.listing_submission_rate_limits IS 'Service-role-only durable public listing submission rate limit buckets keyed by server-side HMAC hashes.';


--
-- Name: listing_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.listing_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_name text NOT NULL,
    category text NOT NULL,
    quantity text NOT NULL,
    unit text NOT NULL,
    region text NOT NULL,
    district text NOT NULL,
    seller_name text NOT NULL,
    seller_type text NOT NULL,
    whatsapp_number text NOT NULL,
    description text NOT NULL,
    image_url text,
    status text DEFAULT 'New'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    selling_method text,
    selling_unit text,
    custom_unit_label text,
    custom_unit_reviewed boolean DEFAULT false NOT NULL,
    unit_size_value numeric(14,3),
    unit_size_measure text,
    unit_size_approximate boolean DEFAULT false NOT NULL,
    price_amount numeric(14,2),
    price_currency text DEFAULT 'GHS'::text,
    price_basis text,
    units_available numeric(14,3),
    total_quantity_value numeric(14,3),
    total_quantity_measure text,
    minimum_order_value numeric(14,3),
    minimum_order_unit text,
    availability text,
    supply_frequency text,
    available_from_date date,
    grade_description text,
    delivery_details text,
    record_source text,
    submission_reference text DEFAULT ('LS-'::text || upper(substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 8))),
    marketplace_pathway text,
    subcategory text,
    variety text,
    seller_contact_name text,
    phone_number text,
    whatsapp_same_as_phone boolean DEFAULT false NOT NULL,
    existing_member text,
    pickup_location text,
    delivery_available text,
    additional_notes text,
    image_urls text[],
    main_image_path text,
    seller_match_status text,
    matched_farmer_id uuid,
    matched_supplier_id uuid,
    assigned_reviewer text,
    admin_notes text,
    seller_message text,
    status_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    published_listing_id uuid,
    published_at timestamp with time zone,
    published_by text,
    approved_at timestamp with time zone,
    approved_by text,
    submission_dedupe_key text,
    source text DEFAULT 'public_submission'::text NOT NULL,
    CONSTRAINT listing_submissions_custom_unit_label_check CHECK (((selling_unit IS NULL) OR (lower(selling_unit) <> 'other'::text) OR (NULLIF(TRIM(BOTH FROM custom_unit_label), ''::text) IS NOT NULL))),
    CONSTRAINT listing_submissions_delivery_available_check CHECK (((delivery_available IS NULL) OR (delivery_available = ANY (ARRAY['Yes'::text, 'No'::text, 'To be confirmed'::text])))),
    CONSTRAINT listing_submissions_existing_member_check CHECK (((existing_member IS NULL) OR (existing_member = ANY (ARRAY['Yes'::text, 'No'::text, 'Not sure'::text])))),
    CONSTRAINT listing_submissions_minimum_order_value_check CHECK (((minimum_order_value IS NULL) OR (minimum_order_value > (0)::numeric))),
    CONSTRAINT listing_submissions_price_amount_check CHECK (((price_amount IS NULL) OR (price_amount >= (0)::numeric))),
    CONSTRAINT listing_submissions_price_currency_check CHECK (((price_currency IS NULL) OR (price_currency ~ '^[A-Z]{3}$'::text))),
    CONSTRAINT listing_submissions_seller_type_check CHECK ((seller_type = ANY (ARRAY['Farmer'::text, 'Supplier'::text]))),
    CONSTRAINT listing_submissions_selling_method_check CHECK (((selling_method IS NULL) OR (selling_method = ANY (ARRAY['packaged_unit'::text, 'weight'::text, 'count'::text, 'livestock'::text, 'volume'::text])))),
    CONSTRAINT listing_submissions_source_check CHECK ((source = ANY (ARRAY['public_submission'::text, 'admin'::text, 'whatsapp_assisted'::text, 'import'::text]))),
    CONSTRAINT listing_submissions_status_check CHECK ((status = ANY (ARRAY['New'::text, 'Needs Information'::text, 'Under Review'::text, 'Approved'::text, 'Published'::text, 'Paused'::text, 'Rejected'::text, 'Expired'::text, 'Converted'::text]))),
    CONSTRAINT listing_submissions_supply_frequency_check CHECK (((supply_frequency IS NULL) OR (supply_frequency = ANY (ARRAY['One-time'::text, 'Weekly'::text, 'Monthly'::text, 'On request'::text])))),
    CONSTRAINT listing_submissions_total_quantity_value_check CHECK (((total_quantity_value IS NULL) OR (total_quantity_value >= (0)::numeric))),
    CONSTRAINT listing_submissions_unit_size_value_check CHECK (((unit_size_value IS NULL) OR (unit_size_value > (0)::numeric))),
    CONSTRAINT listing_submissions_units_available_check CHECK (((units_available IS NULL) OR (units_available >= (0)::numeric)))
);


--
-- Name: TABLE listing_submissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.listing_submissions IS 'Public seller listing submissions queued for Ghana Growers admin review before conversion into marketplace_listings.';


--
-- Name: market_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product text NOT NULL,
    region text NOT NULL,
    market text NOT NULL,
    wholesale_price text NOT NULL,
    retail_price text NOT NULL,
    currency text DEFAULT 'GHS'::text NOT NULL,
    date_updated date NOT NULL,
    trend text DEFAULT 'Stable'::text NOT NULL,
    source text,
    status text DEFAULT 'Active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: marketplace_listings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_listings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text,
    product_name text NOT NULL,
    category text NOT NULL,
    region text NOT NULL,
    district text NOT NULL,
    seller_name text NOT NULL,
    seller_type text DEFAULT 'Farmer'::text NOT NULL,
    farmer_id uuid,
    supplier_id uuid,
    quantity text NOT NULL,
    unit text NOT NULL,
    availability text NOT NULL,
    price_range text,
    image_url text,
    whatsapp_number text,
    verification_status text DEFAULT 'Pending Verification'::text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    featured_until date,
    featured_note text,
    owner_type text DEFAULT 'Admin'::text,
    owner_id uuid,
    owner_name text,
    description text,
    internal_operations_notes text,
    image_urls text[],
    selling_method text,
    selling_unit text,
    custom_unit_label text,
    custom_unit_reviewed boolean DEFAULT false NOT NULL,
    unit_size_value numeric(14,3),
    unit_size_measure text,
    unit_size_approximate boolean DEFAULT false NOT NULL,
    price_amount numeric(14,2),
    price_currency text DEFAULT 'GHS'::text,
    price_basis text,
    units_available numeric(14,3),
    total_quantity_value numeric(14,3),
    total_quantity_measure text,
    minimum_order_value numeric(14,3),
    minimum_order_unit text,
    supply_frequency text,
    available_from_date date,
    grade_description text,
    delivery_details text,
    record_source text,
    source_submission_id uuid,
    CONSTRAINT marketplace_listings_custom_unit_label_check CHECK (((selling_unit IS NULL) OR (lower(selling_unit) <> 'other'::text) OR (NULLIF(TRIM(BOTH FROM custom_unit_label), ''::text) IS NOT NULL))),
    CONSTRAINT marketplace_listings_minimum_order_value_check CHECK (((minimum_order_value IS NULL) OR (minimum_order_value > (0)::numeric))),
    CONSTRAINT marketplace_listings_price_amount_check CHECK (((price_amount IS NULL) OR (price_amount >= (0)::numeric))),
    CONSTRAINT marketplace_listings_price_currency_check CHECK (((price_currency IS NULL) OR (price_currency ~ '^[A-Z]{3}$'::text))),
    CONSTRAINT marketplace_listings_selling_method_check CHECK (((selling_method IS NULL) OR (selling_method = ANY (ARRAY['packaged_unit'::text, 'weight'::text, 'count'::text, 'livestock'::text, 'volume'::text])))),
    CONSTRAINT marketplace_listings_supply_frequency_check CHECK (((supply_frequency IS NULL) OR (supply_frequency = ANY (ARRAY['One-time'::text, 'Weekly'::text, 'Monthly'::text, 'On request'::text])))),
    CONSTRAINT marketplace_listings_total_quantity_value_check CHECK (((total_quantity_value IS NULL) OR (total_quantity_value >= (0)::numeric))),
    CONSTRAINT marketplace_listings_unit_size_value_check CHECK (((unit_size_value IS NULL) OR (unit_size_value > (0)::numeric))),
    CONSTRAINT marketplace_listings_units_available_check CHECK (((units_available IS NULL) OR (units_available >= (0)::numeric)))
);


--
-- Name: success_stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.success_stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text,
    title text,
    category text,
    person_business_name text,
    region text,
    summary text,
    outcome text,
    story_date date,
    image_url text,
    status text DEFAULT 'Draft'::text,
    farmer_id uuid,
    farmer_name text,
    farm_name text,
    crops text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: supplier_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    business_or_farm_name text,
    business_name text,
    contact_person text,
    phone text,
    whatsapp_number text,
    email text,
    region text,
    district text,
    user_type text DEFAULT 'Supplier'::text,
    products_or_services text,
    notes text,
    website_url text,
    registration_number text,
    categories text[] DEFAULT '{}'::text[],
    regions_served text[] DEFAULT '{}'::text[],
    business_description text,
    years_in_business text,
    logo_url text,
    photo_urls text[] DEFAULT '{}'::text[],
    certificate_urls text[] DEFAULT '{}'::text[],
    gg_standard_agreement boolean DEFAULT false,
    status text DEFAULT 'Pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text,
    company_name text NOT NULL,
    contact_person text NOT NULL,
    region text NOT NULL,
    district text NOT NULL,
    category text NOT NULL,
    products_services text[] DEFAULT '{}'::text[] NOT NULL,
    service_coverage_area text,
    whatsapp_number text,
    phone text,
    website text,
    verification_status text DEFAULT 'Pending Verification'::text NOT NULL,
    logo_url text,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    featured_until date,
    featured_note text
);


--
-- Name: buyer_requests buyer_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buyer_requests
    ADD CONSTRAINT buyer_requests_pkey PRIMARY KEY (id);


--
-- Name: farmers farmers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.farmers
    ADD CONSTRAINT farmers_pkey PRIMARY KEY (id);


--
-- Name: farmers farmers_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.farmers
    ADD CONSTRAINT farmers_slug_key UNIQUE (slug);


--
-- Name: farmmate_pilot_feedback farmmate_pilot_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.farmmate_pilot_feedback
    ADD CONSTRAINT farmmate_pilot_feedback_pkey PRIMARY KEY (id);


--
-- Name: farmmate_usage_events farmmate_usage_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.farmmate_usage_events
    ADD CONSTRAINT farmmate_usage_events_pkey PRIMARY KEY (id);


--
-- Name: lead_request_rate_limits lead_request_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_request_rate_limits
    ADD CONSTRAINT lead_request_rate_limits_pkey PRIMARY KEY (request_key);


--
-- Name: lead_requests lead_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_requests
    ADD CONSTRAINT lead_requests_pkey PRIMARY KEY (id);


--
-- Name: listing_submission_publication_cleanup_queue listing_submission_publication_cleanup_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_submission_publication_cleanup_queue
    ADD CONSTRAINT listing_submission_publication_cleanup_queue_pkey PRIMARY KEY (id);


--
-- Name: listing_submission_rate_limits listing_submission_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_submission_rate_limits
    ADD CONSTRAINT listing_submission_rate_limits_pkey PRIMARY KEY (request_key);


--
-- Name: listing_submissions listing_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_submissions
    ADD CONSTRAINT listing_submissions_pkey PRIMARY KEY (id);


--
-- Name: market_prices market_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_prices
    ADD CONSTRAINT market_prices_pkey PRIMARY KEY (id);


--
-- Name: marketplace_listings marketplace_listings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_pkey PRIMARY KEY (id);


--
-- Name: marketplace_listings marketplace_listings_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_slug_key UNIQUE (slug);


--
-- Name: success_stories success_stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.success_stories
    ADD CONSTRAINT success_stories_pkey PRIMARY KEY (id);


--
-- Name: success_stories success_stories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.success_stories
    ADD CONSTRAINT success_stories_slug_key UNIQUE (slug);


--
-- Name: supplier_applications supplier_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_applications
    ADD CONSTRAINT supplier_applications_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_slug_key UNIQUE (slug);


--
-- Name: buyer_requests_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX buyer_requests_region_idx ON public.buyer_requests USING btree (region);


--
-- Name: farmers_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_created_at_idx ON public.farmers USING btree (created_at DESC);


--
-- Name: farmers_district_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_district_idx ON public.farmers USING btree (district);


--
-- Name: farmers_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_email_idx ON public.farmers USING btree (email);


--
-- Name: farmers_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_featured_idx ON public.farmers USING btree (is_featured, featured_until);


--
-- Name: farmers_gg_standard_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_gg_standard_status_idx ON public.farmers USING btree (gg_standard_status);


--
-- Name: farmers_homepage_candidate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_homepage_candidate_idx ON public.farmers USING btree (homepage_candidate) WHERE (homepage_candidate = true);


--
-- Name: farmers_imported_photo_url_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_imported_photo_url_idx ON public.farmers USING btree (imported_photo_url) WHERE (imported_photo_url IS NOT NULL);


--
-- Name: farmers_launch_ready_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_launch_ready_idx ON public.farmers USING btree (launch_ready) WHERE (launch_ready = true);


--
-- Name: farmers_launch_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_launch_status_idx ON public.farmers USING btree (launch_status);


--
-- Name: farmers_marketplace_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_marketplace_featured_idx ON public.farmers USING btree (marketplace_featured) WHERE (marketplace_featured = true);


--
-- Name: farmers_phone_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_phone_number_idx ON public.farmers USING btree (phone_number);


--
-- Name: farmers_photo_import_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_photo_import_status_idx ON public.farmers USING btree (photo_import_status) WHERE (photo_import_status IS NOT NULL);


--
-- Name: farmers_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_region_idx ON public.farmers USING btree (region);


--
-- Name: farmers_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_slug_idx ON public.farmers USING btree (slug);


--
-- Name: farmers_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_source_idx ON public.farmers USING btree (source);


--
-- Name: farmers_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_status_idx ON public.farmers USING btree (status);


--
-- Name: farmers_story_candidate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_story_candidate_idx ON public.farmers USING btree (story_candidate) WHERE (story_candidate = true);


--
-- Name: farmers_verification_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_verification_status_idx ON public.farmers USING btree (verification_status);


--
-- Name: farmers_whatsapp_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmers_whatsapp_number_idx ON public.farmers USING btree (whatsapp_number);


--
-- Name: farmmate_pilot_feedback_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmmate_pilot_feedback_created_idx ON public.farmmate_pilot_feedback USING btree (created_at DESC);


--
-- Name: farmmate_usage_events_hash_tool_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX farmmate_usage_events_hash_tool_created_idx ON public.farmmate_usage_events USING btree (anonymous_user_hash, tool, created_at DESC);


--
-- Name: lead_requests_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_requests_created_at_idx ON public.lead_requests USING btree (created_at DESC);


--
-- Name: lead_requests_dedupe_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_requests_dedupe_key_idx ON public.lead_requests USING btree (request_dedupe_key, created_at DESC) WHERE (request_dedupe_key IS NOT NULL);


--
-- Name: lead_requests_farmer_profile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_requests_farmer_profile_idx ON public.lead_requests USING btree (farmer_profile_id);


--
-- Name: lead_requests_marketplace_listing_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_requests_marketplace_listing_idx ON public.lead_requests USING btree (marketplace_listing_id);


--
-- Name: lead_requests_request_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_requests_request_source_idx ON public.lead_requests USING btree (request_source);


--
-- Name: lead_requests_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_requests_source_idx ON public.lead_requests USING btree (source_type, source_id);


--
-- Name: lead_requests_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_requests_status_idx ON public.lead_requests USING btree (status);


--
-- Name: lead_requests_supplier_profile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lead_requests_supplier_profile_idx ON public.lead_requests USING btree (supplier_profile_id);


--
-- Name: listing_submissions_assigned_reviewer_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_submissions_assigned_reviewer_idx ON public.listing_submissions USING btree (assigned_reviewer);


--
-- Name: listing_submissions_dedupe_open_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX listing_submissions_dedupe_open_idx ON public.listing_submissions USING btree (submission_dedupe_key) WHERE ((submission_dedupe_key IS NOT NULL) AND (status <> ALL (ARRAY['Rejected'::text, 'Expired'::text, 'Published'::text, 'Converted'::text])));


--
-- Name: listing_submissions_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_submissions_phone_idx ON public.listing_submissions USING btree (phone_number);


--
-- Name: listing_submissions_product_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_submissions_product_idx ON public.listing_submissions USING btree (product_name);


--
-- Name: listing_submissions_published_listing_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_submissions_published_listing_idx ON public.listing_submissions USING btree (published_listing_id);


--
-- Name: listing_submissions_reference_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX listing_submissions_reference_idx ON public.listing_submissions USING btree (submission_reference);


--
-- Name: listing_submissions_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_submissions_region_idx ON public.listing_submissions USING btree (region);


--
-- Name: listing_submissions_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_submissions_source_idx ON public.listing_submissions USING btree (source);


--
-- Name: listing_submissions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX listing_submissions_status_idx ON public.listing_submissions USING btree (status, created_at DESC);


--
-- Name: market_prices_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX market_prices_region_idx ON public.market_prices USING btree (region);


--
-- Name: marketplace_listings_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_listings_featured_idx ON public.marketplace_listings USING btree (is_featured, featured_until);


--
-- Name: marketplace_listings_owner_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_listings_owner_idx ON public.marketplace_listings USING btree (owner_type, owner_id);


--
-- Name: marketplace_listings_owner_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_listings_owner_name_idx ON public.marketplace_listings USING btree (owner_name);


--
-- Name: marketplace_listings_record_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_listings_record_source_idx ON public.marketplace_listings USING btree (record_source);


--
-- Name: marketplace_listings_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_listings_region_idx ON public.marketplace_listings USING btree (region);


--
-- Name: marketplace_listings_selling_method_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX marketplace_listings_selling_method_idx ON public.marketplace_listings USING btree (selling_method);


--
-- Name: marketplace_listings_source_submission_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX marketplace_listings_source_submission_idx ON public.marketplace_listings USING btree (source_submission_id) WHERE (source_submission_id IS NOT NULL);


--
-- Name: success_stories_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX success_stories_category_idx ON public.success_stories USING btree (category);


--
-- Name: success_stories_farmer_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX success_stories_farmer_id_idx ON public.success_stories USING btree (farmer_id);


--
-- Name: success_stories_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX success_stories_status_idx ON public.success_stories USING btree (status);


--
-- Name: success_stories_story_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX success_stories_story_date_idx ON public.success_stories USING btree (story_date DESC);


--
-- Name: supplier_applications_categories_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_applications_categories_idx ON public.supplier_applications USING gin (categories);


--
-- Name: supplier_applications_regions_served_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_applications_regions_served_idx ON public.supplier_applications USING gin (regions_served);


--
-- Name: supplier_applications_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX supplier_applications_status_idx ON public.supplier_applications USING btree (status);


--
-- Name: suppliers_featured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suppliers_featured_idx ON public.suppliers USING btree (is_featured, featured_until);


--
-- Name: suppliers_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX suppliers_region_idx ON public.suppliers USING btree (region);


--
-- Name: buyer_requests set_buyer_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_buyer_requests_updated_at BEFORE UPDATE ON public.buyer_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: farmers set_farmers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_farmers_updated_at BEFORE UPDATE ON public.farmers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lead_requests set_lead_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_lead_requests_updated_at BEFORE UPDATE ON public.lead_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: listing_submissions set_listing_submissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_listing_submissions_updated_at BEFORE UPDATE ON public.listing_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: market_prices set_market_prices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_market_prices_updated_at BEFORE UPDATE ON public.market_prices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: marketplace_listings set_marketplace_listings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: suppliers set_suppliers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lead_requests lead_requests_farmer_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_requests
    ADD CONSTRAINT lead_requests_farmer_profile_id_fkey FOREIGN KEY (farmer_profile_id) REFERENCES public.farmers(id) ON DELETE SET NULL;


--
-- Name: lead_requests lead_requests_marketplace_listing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_requests
    ADD CONSTRAINT lead_requests_marketplace_listing_id_fkey FOREIGN KEY (marketplace_listing_id) REFERENCES public.marketplace_listings(id) ON DELETE SET NULL;


--
-- Name: lead_requests lead_requests_supplier_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_requests
    ADD CONSTRAINT lead_requests_supplier_profile_id_fkey FOREIGN KEY (supplier_profile_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: listing_submission_publication_cleanup_queue listing_submission_publication_cleanup_queue_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.listing_submission_publication_cleanup_queue
    ADD CONSTRAINT listing_submission_publication_cleanup_queue_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.listing_submissions(id) ON DELETE SET NULL;


--
-- Name: marketplace_listings marketplace_listings_farmer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_farmer_id_fkey FOREIGN KEY (farmer_id) REFERENCES public.farmers(id) ON DELETE SET NULL;


--
-- Name: marketplace_listings marketplace_listings_source_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_source_submission_id_fkey FOREIGN KEY (source_submission_id) REFERENCES public.listing_submissions(id) ON DELETE SET NULL;


--
-- Name: marketplace_listings marketplace_listings_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_listings
    ADD CONSTRAINT marketplace_listings_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: listing_submissions Allow public listing submission insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public listing submission insert" ON public.listing_submissions FOR INSERT TO anon WITH CHECK (((status = 'New'::text) AND (source = 'public_submission'::text) AND (NULLIF(TRIM(BOTH FROM product_name), ''::text) IS NOT NULL) AND (NULLIF(TRIM(BOTH FROM category), ''::text) IS NOT NULL) AND (NULLIF(TRIM(BOTH FROM quantity), ''::text) IS NOT NULL) AND (NULLIF(TRIM(BOTH FROM unit), ''::text) IS NOT NULL) AND (NULLIF(TRIM(BOTH FROM region), ''::text) IS NOT NULL) AND (NULLIF(TRIM(BOTH FROM district), ''::text) IS NOT NULL) AND (NULLIF(TRIM(BOTH FROM seller_name), ''::text) IS NOT NULL) AND (seller_type = ANY (ARRAY['Farmer'::text, 'Supplier'::text])) AND (NULLIF(TRIM(BOTH FROM phone_number), ''::text) IS NOT NULL) AND (NULLIF(TRIM(BOTH FROM whatsapp_number), ''::text) IS NOT NULL) AND (NULLIF(TRIM(BOTH FROM description), ''::text) IS NOT NULL)));


--
-- Name: listing_submissions Allow service role listing submission access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow service role listing submission access" ON public.listing_submissions TO service_role USING (true) WITH CHECK (true);


--
-- Name: buyer_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.buyer_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: farmers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;

--
-- Name: farmmate_pilot_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.farmmate_pilot_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: farmmate_usage_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.farmmate_usage_events ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_request_rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_request_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: lead_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lead_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: listing_submission_publication_cleanup_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listing_submission_publication_cleanup_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: listing_submission_rate_limits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listing_submission_rate_limits ENABLE ROW LEVEL SECURITY;

--
-- Name: listing_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.listing_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: market_prices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

--
-- Name: marketplace_listings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

--
-- Name: success_stories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

--
-- Name: supplier_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.supplier_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- Name: FUNCTION consume_lead_request_rate_limit(p_request_key text, p_window_seconds integer, p_max_attempts integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.consume_lead_request_rate_limit(p_request_key text, p_window_seconds integer, p_max_attempts integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.consume_lead_request_rate_limit(p_request_key text, p_window_seconds integer, p_max_attempts integer) TO service_role;


--
-- Name: FUNCTION consume_listing_submission_rate_limit(p_request_key text, p_window_seconds integer, p_max_attempts integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.consume_listing_submission_rate_limit(p_request_key text, p_window_seconds integer, p_max_attempts integer) FROM PUBLIC;
GRANT ALL ON FUNCTION public.consume_listing_submission_rate_limit(p_request_key text, p_window_seconds integer, p_max_attempts integer) TO service_role;


--
-- Name: FUNCTION publish_listing_submission(p_submission_id uuid, p_admin_email text, p_public_image_urls text[]); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.publish_listing_submission(p_submission_id uuid, p_admin_email text, p_public_image_urls text[]) FROM PUBLIC;
GRANT ALL ON FUNCTION public.publish_listing_submission(p_submission_id uuid, p_admin_email text, p_public_image_urls text[]) TO service_role;


--
-- Name: FUNCTION slugify_marketplace_listing(value text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.slugify_marketplace_listing(value text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.slugify_marketplace_listing(value text) TO service_role;


--
-- Name: TABLE farmmate_pilot_feedback; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.farmmate_pilot_feedback TO service_role;
GRANT ALL ON TABLE public.farmmate_pilot_feedback TO anon;
GRANT ALL ON TABLE public.farmmate_pilot_feedback TO authenticated;


--
-- Name: TABLE lead_request_rate_limits; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lead_request_rate_limits TO service_role;


--
-- Name: TABLE lead_requests; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.lead_requests TO service_role;


--
-- Name: TABLE listing_submission_publication_cleanup_queue; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.listing_submission_publication_cleanup_queue TO service_role;


--
-- Name: TABLE listing_submission_rate_limits; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.listing_submission_rate_limits TO service_role;


--
-- Name: TABLE listing_submissions; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.listing_submissions TO service_role;


--
-- Name: COLUMN listing_submissions.product_name; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(product_name) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.category; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(category) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.quantity; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(quantity) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.unit; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(unit) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.region; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(region) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.district; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(district) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.seller_name; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(seller_name) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.seller_type; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(seller_type) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.whatsapp_number; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(whatsapp_number) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.description; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(description) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.selling_method; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(selling_method) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.selling_unit; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(selling_unit) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.custom_unit_label; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(custom_unit_label) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.custom_unit_reviewed; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(custom_unit_reviewed) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.unit_size_value; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(unit_size_value) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.unit_size_measure; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(unit_size_measure) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.unit_size_approximate; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(unit_size_approximate) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.price_amount; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(price_amount) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.price_currency; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(price_currency) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.price_basis; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(price_basis) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.units_available; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(units_available) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.total_quantity_value; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(total_quantity_value) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.total_quantity_measure; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(total_quantity_measure) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.minimum_order_value; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(minimum_order_value) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.minimum_order_unit; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(minimum_order_unit) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.availability; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(availability) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.supply_frequency; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(supply_frequency) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.available_from_date; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(available_from_date) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.grade_description; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(grade_description) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.delivery_details; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(delivery_details) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.marketplace_pathway; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(marketplace_pathway) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.subcategory; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(subcategory) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.variety; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(variety) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.seller_contact_name; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(seller_contact_name) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.phone_number; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(phone_number) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.whatsapp_same_as_phone; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(whatsapp_same_as_phone) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.existing_member; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(existing_member) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.pickup_location; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(pickup_location) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.delivery_available; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(delivery_available) ON TABLE public.listing_submissions TO anon;


--
-- Name: COLUMN listing_submissions.additional_notes; Type: ACL; Schema: public; Owner: -
--

GRANT INSERT(additional_notes) ON TABLE public.listing_submissions TO anon;


--
-- Production table privilege state
--

GRANT ALL ON TABLE
  public.buyer_requests,
  public.farmers,
  public.farmmate_pilot_feedback,
  public.farmmate_usage_events,
  public.market_prices,
  public.marketplace_listings,
  public.success_stories,
  public.supplier_applications,
  public.suppliers
TO anon, authenticated, service_role;

REVOKE ALL ON TABLE
  public.lead_request_rate_limits,
  public.lead_requests,
  public.listing_submission_publication_cleanup_queue,
  public.listing_submission_rate_limits,
  public.listing_submissions
FROM anon, authenticated;

GRANT ALL ON TABLE
  public.lead_request_rate_limits,
  public.lead_requests,
  public.listing_submission_publication_cleanup_queue,
  public.listing_submission_rate_limits,
  public.listing_submissions
TO service_role;

-- Production permits anonymous submissions through a constrained column set.
-- Keep this grant after the table-level revoke so it is not cleared.
GRANT INSERT (
  additional_notes,
  availability,
  available_from_date,
  category,
  custom_unit_label,
  custom_unit_reviewed,
  delivery_available,
  delivery_details,
  description,
  district,
  existing_member,
  grade_description,
  marketplace_pathway,
  minimum_order_unit,
  minimum_order_value,
  phone_number,
  pickup_location,
  price_amount,
  price_basis,
  price_currency,
  product_name,
  quantity,
  region,
  seller_contact_name,
  seller_name,
  seller_type,
  selling_method,
  selling_unit,
  subcategory,
  supply_frequency,
  total_quantity_measure,
  total_quantity_value,
  unit,
  unit_size_approximate,
  unit_size_measure,
  unit_size_value,
  units_available,
  variety,
  whatsapp_number,
  whatsapp_same_as_phone
) ON TABLE public.listing_submissions TO anon;

--
-- Required storage infrastructure rows omitted by schema-only pg_dump
--

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('farmers', 'farmers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('suppliers', 'suppliers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('marketplace', 'marketplace', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('stories', 'stories', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('listing-submissions', 'listing-submissions', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read Ghana Growers launch media" ON storage.objects;
CREATE POLICY "Public read Ghana Growers launch media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id IN ('marketplace', 'farmers', 'suppliers', 'stories'));

DROP POLICY IF EXISTS "Service role manages listing submission images" ON storage.objects;
CREATE POLICY "Service role manages listing submission images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'listing-submissions')
WITH CHECK (bucket_id = 'listing-submissions');

commit;

-- PostgreSQL schema-only baseline complete.

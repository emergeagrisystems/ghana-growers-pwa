begin;

-- RC1 application data is accessed through trusted server loaders/routes.
-- Keep existing service_role privileges and managed auth/storage unchanged.
revoke all privileges on table
  public.buyer_requests,
  public.farmers,
  public.farmmate_pilot_feedback,
  public.farmmate_usage_events,
  public.lead_request_rate_limits,
  public.lead_requests,
  public.listing_submission_publication_cleanup_queue,
  public.listing_submission_rate_limits,
  public.listing_submissions,
  public.market_prices,
  public.marketplace_listings,
  public.success_stories,
  public.supplier_applications,
  public.suppliers,
  public.farmer_applications,
  public.hq_integration_rate_limits,
  public.hq_integration_nonces,
  public.contact_enquiries
from public, anon, authenticated;

-- Explicitly remove the historical listing column grants as well.
do $hardening$
declare
  v_columns text;
begin
  select string_agg(quote_ident(attname), ', ' order by attnum)
  into v_columns
  from pg_attribute
  where attrelid = 'public.listing_submissions'::regclass
    and attnum > 0 and not attisdropped;
  if v_columns is null then
    raise exception 'Expected listing submission columns are absent';
  end if;
  execute format(
    'revoke all privileges (%s) on table public.listing_submissions from public, anon, authenticated',
    v_columns
  );
end
$hardening$;

drop policy if exists "Allow public listing submission insert"
  on public.listing_submissions;

revoke all privileges on function
  public.consume_lead_request_rate_limit(text, integer, integer),
  public.consume_listing_submission_rate_limit(text, integer, integer),
  public.publish_listing_submission(uuid, text, text[]),
  public.set_updated_at(),
  public.slugify_marketplace_listing(text),
  public.consume_hq_integration_rate_limit(text, integer, integer),
  public.consume_hq_integration_nonce(uuid, timestamptz),
  public.set_contact_enquiries_updated_at()
from public, anon, authenticated;

grant execute on function
  public.consume_lead_request_rate_limit(text, integer, integer),
  public.consume_listing_submission_rate_limit(text, integer, integer),
  public.publish_listing_submission(uuid, text, text[]),
  public.set_updated_at(),
  public.slugify_marketplace_listing(text),
  public.consume_hq_integration_rate_limit(text, integer, integer),
  public.consume_hq_integration_nonce(uuid, timestamptz),
  public.set_contact_enquiries_updated_at()
to service_role;

commit;

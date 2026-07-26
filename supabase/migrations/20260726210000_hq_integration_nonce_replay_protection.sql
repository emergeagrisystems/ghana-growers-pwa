create table if not exists public.hq_integration_nonces (
  nonce_value uuid primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint hq_integration_nonces_expiry_check check (expires_at > created_at)
);

create index if not exists hq_integration_nonces_expires_at_idx
  on public.hq_integration_nonces (expires_at);

alter table public.hq_integration_nonces enable row level security;

revoke all on table public.hq_integration_nonces from public, anon, authenticated;
grant select, insert, delete on table public.hq_integration_nonces to service_role;

create or replace function public.consume_hq_integration_nonce(
  p_nonce_value uuid,
  p_expires_at timestamptz
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_inserted boolean := false;
begin
  if p_nonce_value is null or p_expires_at is null then
    return false;
  end if;

  -- The signed timestamp can be at most five minutes in the future and the
  -- nonce must remain reserved through the complete five-minute replay window.
  if p_expires_at <= v_now or p_expires_at > v_now + interval '10 minutes' then
    return false;
  end if;

  -- A record is removed only after its signed request can no longer pass the
  -- timestamp check, so cleanup cannot make an otherwise valid replay usable.
  delete from public.hq_integration_nonces
  where expires_at <= v_now;

  with inserted as (
    insert into public.hq_integration_nonces (
      nonce_value,
      created_at,
      expires_at
    ) values (
      p_nonce_value,
      v_now,
      p_expires_at
    )
    on conflict (nonce_value) do nothing
    returning nonce_value
  )
  select exists(select 1 from inserted) into v_inserted;

  return v_inserted;
end;
$$;

revoke all on function public.consume_hq_integration_nonce(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.consume_hq_integration_nonce(uuid, timestamptz) to service_role;

comment on table public.hq_integration_nonces is
  'Service-role-only one-time nonces for the signed HQ integration replay window.';

create table if not exists public.hq_integration_rate_limits (
  request_key text primary key,
  window_start timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hq_integration_rate_limits enable row level security;

revoke all on table public.hq_integration_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table public.hq_integration_rate_limits to service_role;

create or replace function public.consume_hq_integration_rate_limit(
  p_request_key text,
  p_window_seconds integer default 60,
  p_max_attempts integer default 60
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_attempt_count integer;
  v_reset_at timestamptz;
begin
  if nullif(trim(p_request_key), '') is null then
    raise exception 'A request key is required.';
  end if;

  if p_window_seconds <= 0 or p_max_attempts <= 0 then
    raise exception 'Rate limit window and attempt count must be positive.';
  end if;

  delete from public.hq_integration_rate_limits
  where window_start < v_now - interval '2 days';

  loop
    update public.hq_integration_rate_limits
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
    returning window_start, attempt_count into v_window_start, v_attempt_count;

    if found then
      exit;
    end if;

    begin
      insert into public.hq_integration_rate_limits (
        request_key,
        window_start,
        attempt_count,
        last_attempt_at,
        created_at,
        updated_at
      ) values (
        p_request_key,
        v_now,
        1,
        v_now,
        v_now,
        v_now
      )
      returning window_start, attempt_count into v_window_start, v_attempt_count;
      exit;
    exception when unique_violation then
      -- A concurrent request inserted the key. Retry against the locked row.
    end;
  end loop;

  v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

  return jsonb_build_object(
    'allowed', v_attempt_count <= p_max_attempts,
    'attempt_count', v_attempt_count,
    'remaining', greatest(p_max_attempts - v_attempt_count, 0),
    'reset_at', v_reset_at
  );
end;
$$;

revoke all on function public.consume_hq_integration_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_hq_integration_rate_limit(text, integer, integer) to service_role;

comment on table public.hq_integration_rate_limits is
  'Service-role-only durable rate-limit counters for the signed HQ approval counts integration.';

begin;

-- Preserve every existing event as charged history. We cannot infer which
-- legacy calls produced a usable answer, so do not relabel or refund them.
alter table public.farmmate_usage_events
  add column ask_consultation_key text,
  add column ask_question_fingerprint text,
  add column ask_outcome text not null default 'legacy_charged',
  add column ask_attempt_count smallint not null default 0,
  add column ask_attempt_started_at timestamptz;

alter table public.farmmate_usage_events
  add constraint farmmate_ask_outcome_check check
    (ask_outcome in ('legacy_charged', 'awaiting_follow_up', 'generating', 'failed', 'answer_unconfirmed', 'succeeded')),
  add constraint farmmate_ask_attempt_count_check check
    (ask_attempt_count between 0 and 2),
  add constraint farmmate_ask_consultation_key_check check
    (ask_consultation_key is null or ask_consultation_key ~ '^[0-9a-f]{64}$'),
  add constraint farmmate_ask_question_fingerprint_check check
    (ask_question_fingerprint is null or ask_question_fingerprint ~ '^[0-9a-f]{64}$');

create unique index farmmate_ask_consultation_key_unique
  on public.farmmate_usage_events (ask_consultation_key)
  where tool = 'ask_farmmate' and ask_consultation_key is not null;

-- One database transaction makes the limit check and reservation indivisible.
-- The existing five-in-six-hours charge and 3.5-second rapid rules remain.
create function public.reserve_farmmate_ask(
  p_anonymous_user_hash text,
  p_consultation_key text,
  p_question_fingerprint text,
  p_guided boolean,
  p_complete_immediately boolean default false
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_row public.farmmate_usage_events%rowtype;
  v_used integer;
  v_last_attempt timestamptz;
  v_id uuid;
  v_next_outcome text;
begin
  if p_anonymous_user_hash is null or p_anonymous_user_hash !~ '^[0-9a-f]{64}$'
    or p_consultation_key is null or p_consultation_key !~ '^[0-9a-f]{64}$'
    or p_question_fingerprint is null or p_question_fingerprint !~ '^[0-9a-f]{64}$'
    or p_guided is null
    or p_complete_immediately is null
    or (p_guided and p_complete_immediately) then
    return pg_catalog.jsonb_build_object('decision', 'invalid_request');
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('farmmate_ask:' || p_anonymous_user_hash, 0)
  );

  select * into v_row
  from public.farmmate_usage_events
  where ask_consultation_key = p_consultation_key
    and tool = 'ask_farmmate'
  for update;

  select max(coalesce(ask_attempt_started_at, created_at))
    into v_last_attempt
  from public.farmmate_usage_events
  where anonymous_user_hash = p_anonymous_user_hash
    and tool = 'ask_farmmate'
    and created_at > v_now - interval '6 hours';

  if v_row.id is not null then
    if v_row.anonymous_user_hash <> p_anonymous_user_hash
      or v_row.ask_question_fingerprint <> p_question_fingerprint then
      return pg_catalog.jsonb_build_object('decision', 'question_mismatch');
    end if;
    if v_row.created_at <= v_now - interval '6 hours' then
      return pg_catalog.jsonb_build_object('decision', 'recovery_expired');
    end if;
    if v_row.ask_outcome = 'succeeded' then
      return pg_catalog.jsonb_build_object('decision', 'already_processed');
    end if;
    if v_row.ask_outcome = 'awaiting_follow_up' then
      return pg_catalog.jsonb_build_object(
        'decision', 'resume_guided', 'event_id', v_row.id,
        'attempt_count', v_row.ask_attempt_count
      );
    end if;
    if v_row.ask_outcome = 'generating'
      and v_row.ask_attempt_started_at > v_now - interval '75 seconds' then
      return pg_catalog.jsonb_build_object('decision', 'in_progress');
    end if;
    if v_row.ask_attempt_count >= 2 then
      return pg_catalog.jsonb_build_object('decision', 'retry_exhausted');
    end if;
    if v_last_attempt is not null
      and v_last_attempt > v_now - interval '3500 milliseconds' then
      return pg_catalog.jsonb_build_object('decision', 'rapid_submission');
    end if;

    v_next_outcome := case
      when p_complete_immediately then 'succeeded'
      when p_guided then 'awaiting_follow_up'
      else 'generating'
    end;
    update public.farmmate_usage_events
    set ask_outcome = v_next_outcome,
        ask_attempt_count = ask_attempt_count + 1,
        ask_attempt_started_at = v_now
    where id = v_row.id;
    return pg_catalog.jsonb_build_object(
      'decision', 'reserved_retry', 'event_id', v_row.id,
      'attempt_count', v_row.ask_attempt_count + 1, 'new_credit', false
    );
  end if;

  select count(*) into v_used
  from public.farmmate_usage_events
  where anonymous_user_hash = p_anonymous_user_hash
    and tool = 'ask_farmmate'
    and created_at > v_now - interval '6 hours';
  if v_used >= 5 then
    return pg_catalog.jsonb_build_object('decision', 'credits_exhausted');
  end if;
  if v_last_attempt is not null
    and v_last_attempt > v_now - interval '3500 milliseconds' then
    return pg_catalog.jsonb_build_object('decision', 'rapid_submission');
  end if;

  v_next_outcome := case
    when p_complete_immediately then 'succeeded'
    when p_guided then 'awaiting_follow_up'
    else 'generating'
  end;
  insert into public.farmmate_usage_events (
    anonymous_user_hash, tool, created_at, ask_consultation_key,
    ask_question_fingerprint, ask_outcome, ask_attempt_count,
    ask_attempt_started_at
  ) values (
    p_anonymous_user_hash, 'ask_farmmate', v_now, p_consultation_key,
    p_question_fingerprint, v_next_outcome, 1, v_now
  ) returning id into v_id;

  return pg_catalog.jsonb_build_object(
    'decision', 'reserved_new', 'event_id', v_id,
    'attempt_count', 1, 'new_credit', true
  );
end
$function$;

-- A signed guided continuation must claim its event ID before this step.
create function public.begin_farmmate_ask_generation(
  p_anonymous_user_hash text,
  p_consultation_key text,
  p_event_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_attempt_count smallint;
begin
  update public.farmmate_usage_events
  set ask_outcome = 'generating',
      ask_attempt_started_at = pg_catalog.clock_timestamp()
  where anonymous_user_hash = p_anonymous_user_hash
    and ask_consultation_key = p_consultation_key
    and id = p_event_id
    and tool = 'ask_farmmate'
    and ask_outcome = 'awaiting_follow_up'
  returning ask_attempt_count into v_attempt_count;

  if v_attempt_count is null then
    return pg_catalog.jsonb_build_object('started', false);
  end if;
  return pg_catalog.jsonb_build_object('started', true, 'attempt_count', v_attempt_count);
end
$function$;

-- Compare-and-set prevents a late response from an older attempt from
-- changing the outcome of a newer retry.
create function public.settle_farmmate_ask(
  p_anonymous_user_hash text,
  p_consultation_key text,
  p_event_id uuid,
  p_attempt_count smallint,
  p_success boolean
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_id uuid;
begin
  if p_success is null then
    return false;
  end if;
  update public.farmmate_usage_events
  set ask_outcome = case when p_success then 'answer_unconfirmed' else 'failed' end
  where anonymous_user_hash = p_anonymous_user_hash
    and ask_consultation_key = p_consultation_key
    and id = p_event_id
    and tool = 'ask_farmmate'
    and ask_outcome = 'generating'
    and ask_attempt_count = p_attempt_count
  returning id into v_id;
  return v_id is not null;
end
$function$;

-- Browser acknowledgement happens only after a complete answer is parsed.
-- An unacknowledged response may have been lost in transit, so it retains
-- one bounded retry instead of being silently treated as delivered.
create function public.acknowledge_farmmate_ask(
  p_anonymous_user_hash text,
  p_consultation_key text,
  p_event_id uuid,
  p_attempt_count smallint
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_id uuid;
begin
  update public.farmmate_usage_events
  set ask_outcome = 'succeeded'
  where anonymous_user_hash = p_anonymous_user_hash
    and ask_consultation_key = p_consultation_key
    and id = p_event_id
    and tool = 'ask_farmmate'
    and ask_outcome = 'answer_unconfirmed'
    and ask_attempt_count = p_attempt_count
  returning id into v_id;
  return v_id is not null;
end
$function$;

-- RLS remains enabled on the existing table. These invoker RPCs are exposed
-- in public only because the server uses PostgREST; ordinary client roles
-- receive no EXECUTE grant.
revoke all on function public.reserve_farmmate_ask(text, text, text, boolean, boolean)
  from public, anon, authenticated;
revoke all on function public.begin_farmmate_ask_generation(text, text, uuid)
  from public, anon, authenticated;
revoke all on function public.settle_farmmate_ask(text, text, uuid, smallint, boolean)
  from public, anon, authenticated;
revoke all on function public.acknowledge_farmmate_ask(text, text, uuid, smallint)
  from public, anon, authenticated;
grant execute on function public.reserve_farmmate_ask(text, text, text, boolean, boolean)
  to service_role;
grant execute on function public.begin_farmmate_ask_generation(text, text, uuid)
  to service_role;
grant execute on function public.settle_farmmate_ask(text, text, uuid, smallint, boolean)
  to service_role;
grant execute on function public.acknowledge_farmmate_ask(text, text, uuid, smallint)
  to service_role;

commit;

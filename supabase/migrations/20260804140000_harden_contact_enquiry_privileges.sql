do $migration$
declare
  v_owner text;
begin
  if to_regclass('public.contact_enquiries') is null then
    raise exception 'public.contact_enquiries must exist before privileges can be hardened';
  end if;

  select pg_get_userbyid(c.relowner)
  into v_owner
  from pg_class c
  where c.oid = 'public.contact_enquiries'::regclass;

  if v_owner = 'service_role' then
    raise exception 'service_role owns public.contact_enquiries; explicit grants cannot restrict an owner';
  end if;
end
$migration$;

revoke all privileges on table public.contact_enquiries from service_role;
grant select, insert, update, delete on table public.contact_enquiries to service_role;

revoke all privileges on table public.contact_enquiries from public, anon, authenticated;

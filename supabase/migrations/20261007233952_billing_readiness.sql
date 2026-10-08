-- Public pages are rendered by the server after the membership check. Direct
-- Data API reads would bypass that check, so only owners retain browser reads.
drop policy if exists "Published profiles are public" on public.profiles;
drop policy if exists "Visible methods of published profiles are public" on public.payment_methods;
revoke select on public.profiles, public.payment_methods from anon;

-- An active Stripe status is not enough if a renewal webhook never arrives.
create or replace function public.has_active_subscription(uid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and (
        (s.provider = 'comp' and s.status = 'active')
        or (s.status in ('active', 'trialing', 'past_due', 'canceled')
            and s.current_period_end > now())
      )
  );
$$;
revoke all on function public.has_active_subscription(uuid) from public, anon, authenticated;
grant execute on function public.has_active_subscription(uuid) to service_role;

-- A Stripe event and its entitlement change commit together. The event time
-- rejects older deliveries; a different subscription cannot replace a live
-- one unless its checkout completed (or the previous subscription ended).
alter table public.subscriptions
  add column if not exists last_stripe_event_created bigint not null default 0;

create or replace function public.apply_stripe_subscription_event(
  p_event_id text,
  p_event_type text,
  p_event_created bigint,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_plan text,
  p_status text,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean
)
returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  v_rows integer;
begin
  insert into public.billing_events (provider, event_id, event_type)
  values ('stripe', p_event_id, p_event_type)
  on conflict (provider, event_id) do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return false; end if;

  insert into public.subscriptions (
    user_id, provider, provider_customer_id, provider_subscription_id,
    plan, status, current_period_end, cancel_at_period_end, last_stripe_event_created
  ) values (
    p_user_id, 'stripe', p_customer_id, p_subscription_id,
    p_plan, p_status, p_period_end, p_cancel_at_period_end, p_event_created
  )
  on conflict (user_id) do update set
    provider = excluded.provider,
    provider_customer_id = excluded.provider_customer_id,
    provider_subscription_id = excluded.provider_subscription_id,
    plan = excluded.plan,
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    last_stripe_event_created = excluded.last_stripe_event_created
  where public.subscriptions.last_stripe_event_created <= excluded.last_stripe_event_created
    and (
      public.subscriptions.provider_subscription_id = excluded.provider_subscription_id
      or public.subscriptions.provider_subscription_id is null
      or p_event_type = 'checkout.session.completed'
      or public.subscriptions.status not in ('active', 'trialing', 'past_due')
      or public.subscriptions.current_period_end <= now()
    );
  get diagnostics v_rows = row_count;

  update public.billing_events
  set processed_at = now()
  where provider = 'stripe' and event_id = p_event_id;
  return v_rows > 0;
end;
$$;
revoke all on function public.apply_stripe_subscription_event(text, text, bigint, uuid, text, text, text, text, timestamptz, boolean)
  from public, anon, authenticated;
grant execute on function public.apply_stripe_subscription_event(text, text, bigint, uuid, text, text, text, text, timestamptz, boolean)
  to service_role;
grant all on public.subscriptions, public.billing_events to service_role;

-- The bill row lock makes the pending-claim cap reliable under concurrent
-- submissions. Public callers can only reach this through the server action.
create or replace function public.claim_split_payment(
  p_split_id text, p_name text, p_method text
)
returns text
language plpgsql security invoker set search_path = ''
as $$
declare
  v_people integer;
  v_total integer;
  v_confirmed integer;
begin
  select people into v_people
  from public.bill_splits where id = p_split_id for update;
  if not found then return 'missing'; end if;

  select count(*), count(*) filter (where confirmed_at is not null)
  into v_total, v_confirmed
  from public.bill_split_payments where split_id = p_split_id;
  if v_confirmed >= v_people then return 'full'; end if;
  if v_total >= v_people * 2 + 5 then return 'busy'; end if;

  insert into public.bill_split_payments (split_id, name, method)
  values (p_split_id, p_name, p_method);
  return 'created';
end;
$$;
revoke all on function public.claim_split_payment(text, text, text) from public, anon, authenticated;
grant execute on function public.claim_split_payment(text, text, text) to service_role;

-- Keep anonymous analytics writes bounded without storing IP addresses or
-- visitor identifiers. The existing profile/time index supports the count.
create or replace function public.record_analytics_event_limited(
  p_profile_id uuid,
  p_action text,
  p_method_id text,
  p_referrer_host text,
  p_device text,
  p_country text
)
returns boolean
language plpgsql security invoker set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(p_profile_id::text));
  if (select count(*) from public.analytics_events
      where profile_id = p_profile_id and occurred_at > now() - interval '1 minute') >= 120
  then return false; end if;

  insert into public.analytics_events
    (profile_id, action, method_id, referrer_host, device, country, occurred_at)
  values (p_profile_id, p_action, p_method_id, p_referrer_host, p_device, p_country, now());
  return true;
end;
$$;
revoke all on function public.record_analytics_event_limited(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_analytics_event_limited(uuid, text, text, text, text, text)
  to service_role;

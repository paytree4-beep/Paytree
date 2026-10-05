-- =============================================================================
-- PayTree.me: database foundation (Phase 1)
--
-- Creates the tables, constraints, Row Level Security (RLS) policies and helper
-- functions the app is built on. Nothing here stores fake or sample data.
--
-- HOW TO APPLY
--   Supabase CLI:  supabase link --project-ref <ref>   then   supabase db push
--   or paste this whole file into the Supabase SQL editor and run it once.
--
-- SECURITY MODEL IN ONE PARAGRAPH
--   Every table has RLS switched on. The "anon" role (signed-out visitors) can
--   read only published profiles and their visible, non-sensitive payment
--   methods. The "authenticated" role (signed-in users) can additionally read
--   and edit ONLY their own rows. Sensitive bank details, billing events,
--   analytics writes and the reserved-username list are reachable ONLY by the
--   server through the service_role key, which must never reach the browser.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Defaults: new tables in "public" start with NO access for anon/authenticated.
-- Each table below then grants back only what it needs.
-- -----------------------------------------------------------------------------
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
-- Supabase also grants EXECUTE on new functions to the API roles. Revoking only
-- from "public" is NOT enough, so close that door by default too.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Helper: keep updated_at current
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Reserved usernames
-- KEEP IN SYNC with RESERVED_USERNAMES in lib/profiles.ts.
-- -----------------------------------------------------------------------------
create table public.reserved_usernames (
  username text primary key,
  constraint reserved_usernames_lowercase check (username = lower(username))
);

alter table public.reserved_usernames enable row level security;
-- No policies and no grants: only the service role (and the trigger below) can read it.

insert into public.reserved_usernames (username) values
  ('about'),
  ('account'),
  ('admin'),
  ('api'),
  ('app'),
  ('apple-icon.png'),
  ('assets'),
  ('auth'),
  ('billing'),
  ('blog'),
  ('callback'),
  ('checkout'),
  ('confirm'),
  ('contact'),
  ('dashboard'),
  ('docs'),
  ('faq'),
  ('favicon.ico'),
  ('forgot'),
  ('help'),
  ('home'),
  ('icon.svg'),
  ('login'),
  ('logout'),
  ('manifest.webmanifest'),
  ('new'),
  ('official'),
  ('onboarding'),
  ('opengraph-image'),
  ('payments'),
  ('paytree'),
  ('pricing'),
  ('privacy'),
  ('register'),
  ('report'),
  ('reset'),
  ('robots.txt'),
  ('security'),
  ('settings'),
  ('signin'),
  ('signup'),
  ('sitemap.xml'),
  ('staff'),
  ('status'),
  ('support'),
  ('terms'),
  ('twitter-image'),
  ('verify'),
  ('webhook'),
  ('webhooks'),
  ('www');

-- -----------------------------------------------------------------------------
-- profiles: one row per account. Every column here is PUBLIC (shown on the
-- user's page), so the email address and anything private is never stored here;
-- the email stays in Supabase's private auth.users table.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null,
  display_name text not null,
  bio          text,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9_.-]{2,29}$'),
  constraint profiles_display_name_length check (char_length(btrim(display_name)) between 2 and 60),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 140)
);

create unique index profiles_username_key on public.profiles (username);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Reject reserved names no matter how the row is written.
create or replace function public.profiles_reject_reserved_username()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.reserved_usernames r where r.username = new.username) then
    raise exception 'username_reserved' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function public.profiles_reject_reserved_username() from public, anon, authenticated;

create trigger profiles_reject_reserved_username
  before insert or update of username on public.profiles
  for each row execute function public.profiles_reject_reserved_username();

alter table public.profiles enable row level security;

create policy "Published profiles are public"
  on public.profiles for select to anon, authenticated
  using (is_published);

create policy "Owners can read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "Owners can create their own profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy "Owners can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Owners can delete their own profile"
  on public.profiles for delete to authenticated
  using (id = (select auth.uid()));

grant select on public.profiles to anon, authenticated;
grant insert (id, username, display_name, bio) on public.profiles to authenticated;
grant update (username, display_name, bio, is_published) on public.profiles to authenticated;
grant delete on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- payment_methods: what a user chose to show. public_config holds ONLY
-- non-sensitive values (a handle, a link, a masked "last 4"). It is readable by
-- anyone for a published, visible method, so it must never hold bank details.
-- The app validates every value with lib/profiles.ts and re-validates on every
-- public page render, so a bad value here can never become a link.
-- -----------------------------------------------------------------------------
create table public.payment_methods (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  method_id     text not null,
  position      integer not null default 0,
  is_visible    boolean not null default true,
  public_config jsonb not null default '{}'::jsonb,
  has_secret    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint payment_methods_method_id_known check (method_id in ('cashapp', 'venmo', 'paypal', 'stripe', 'square', 'wise', 'custom', 'zelle', 'applecash', 'chime', 'ach', 'wire', 'check', 'crypto')),
  constraint payment_methods_position_range check (position between 0 and 100),
  constraint payment_methods_config_is_object check (jsonb_typeof(public_config) = 'object'),
  constraint payment_methods_config_size check (octet_length(public_config::text) <= 4096),
  -- Belt and braces: bank numbers must live in payment_method_secrets, never here.
  constraint payment_methods_config_no_bank_numbers
    check (not (public_config ?| array['routing', 'account', 'accountNumber', 'routingNumber', 'swift'])),
  constraint payment_methods_one_per_method unique (profile_id, method_id)
);

create index payment_methods_profile_position on public.payment_methods (profile_id, position);

create trigger payment_methods_set_updated_at
  before update on public.payment_methods
  for each row execute function public.set_updated_at();

alter table public.payment_methods enable row level security;

create policy "Visible methods of published profiles are public"
  on public.payment_methods for select to anon, authenticated
  using (
    is_visible
    and exists (
      select 1 from public.profiles p
      where p.id = payment_methods.profile_id and p.is_published
    )
  );

create policy "Owners can read their own methods"
  on public.payment_methods for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "Owners can add their own methods"
  on public.payment_methods for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "Owners can change their own methods"
  on public.payment_methods for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "Owners can remove their own methods"
  on public.payment_methods for delete to authenticated
  using (profile_id = (select auth.uid()));

grant select on public.payment_methods to anon, authenticated;
grant insert (profile_id, method_id, position, is_visible, public_config, has_secret)
  on public.payment_methods to authenticated;
grant update (position, is_visible, public_config, has_secret)
  on public.payment_methods to authenticated;
grant delete on public.payment_methods to authenticated;

-- -----------------------------------------------------------------------------
-- payment_method_secrets: encrypted bank details (ACH and wire).
-- The app encrypts BEFORE saving (AES-256-GCM, key in PAYMENT_DATA_ENCRYPTION_KEY),
-- so this table only ever holds ciphertext. RLS is on and there are NO policies
-- and NO grants: no browser, signed in or not, can read or write it. Only the
-- server (service role) can, and only to reveal details to a visitor who passes
-- the Reveal check, or to let the owner replace them.
-- -----------------------------------------------------------------------------
create table public.payment_method_secrets (
  payment_method_id uuid primary key references public.payment_methods (id) on delete cascade,
  ciphertext        text not null,
  key_version       smallint not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint payment_method_secrets_ciphertext_size check (char_length(ciphertext) between 1 and 4096)
);

create trigger payment_method_secrets_set_updated_at
  before update on public.payment_method_secrets
  for each row execute function public.set_updated_at();

alter table public.payment_method_secrets enable row level security;

-- -----------------------------------------------------------------------------
-- subscriptions: PayTree membership status. Provider-neutral on purpose: the
-- billing provider has not been chosen yet. Only the server writes here (from
-- verified webhooks). Owners can read their own row.
-- -----------------------------------------------------------------------------
create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null unique references auth.users (id) on delete cascade,
  provider                 text not null,
  provider_customer_id     text,
  provider_subscription_id text,
  plan                     text not null,
  status                   text not null,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint subscriptions_plan_known check (plan in ('monthly', 'annual')),
  constraint subscriptions_status_known
    check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'paused')),
  constraint subscriptions_provider_length check (char_length(provider) between 1 and 40),
  constraint subscriptions_provider_ref_unique unique (provider, provider_subscription_id)
);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "Owners can read their own subscription"
  on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.subscriptions to authenticated;

-- Does this account currently have access? A canceled or failed-payment
-- subscription keeps access until the paid period ends. The billing phase may
-- tighten or loosen this (for example a grace period after a failed payment).
create or replace function public.has_active_subscription(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = uid
      and (
        s.status in ('active', 'trialing')
        or (s.status in ('past_due', 'canceled') and s.current_period_end > now())
      )
  );
$$;

revoke all on function public.has_active_subscription(uuid) from public, anon, authenticated;
grant execute on function public.has_active_subscription(uuid) to service_role;

-- -----------------------------------------------------------------------------
-- billing_events: one row per webhook delivery, so a retried webhook is never
-- processed twice. No payload is stored (it can contain personal data).
-- Server only.
-- -----------------------------------------------------------------------------
create table public.billing_events (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null,
  event_id     text not null,
  event_type   text not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  constraint billing_events_provider_event_unique unique (provider, event_id)
);

alter table public.billing_events enable row level security;

-- -----------------------------------------------------------------------------
-- analytics_events: privacy-first page analytics. Stores NO IP address, NO user
-- agent and NO visitor identifier. The server (service role) is the only
-- writer; owners can read events for their own page.
-- -----------------------------------------------------------------------------
create table public.analytics_events (
  id            bigint generated always as identity primary key,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  action        text not null,
  method_id     text,
  referrer_host text,
  device        text not null,
  country       char(2),
  occurred_at   timestamptz not null default now(),
  constraint analytics_events_action_known check (action in ('view', 'open', 'copy')),
  constraint analytics_events_method_known check (method_id is null or method_id in ('cashapp', 'venmo', 'paypal', 'stripe', 'square', 'wise', 'custom', 'zelle', 'applecash', 'chime', 'ach', 'wire', 'check', 'crypto')),
  constraint analytics_events_method_matches_action
    check ((action = 'view' and method_id is null) or (action in ('open', 'copy') and method_id is not null)),
  constraint analytics_events_device_known check (device in ('mobile', 'tablet', 'desktop')),
  constraint analytics_events_country_format check (country is null or country ~ '^[A-Z]{2}$'),
  constraint analytics_events_referrer_length check (referrer_host is null or char_length(referrer_host) <= 100)
);

create index analytics_events_profile_time on public.analytics_events (profile_id, occurred_at desc);
create index analytics_events_occurred_at on public.analytics_events (occurred_at);

alter table public.analytics_events enable row level security;

create policy "Owners can read their own analytics"
  on public.analytics_events for select to authenticated
  using (profile_id = (select auth.uid()));

grant select on public.analytics_events to authenticated;

-- Retention: delete events older than the period you publish in the Privacy
-- Policy. The period is a parameter on purpose; the owner decides it
-- ([ANALYTICS RETENTION PERIOD] in content/legal.ts). Run it on a schedule.
create or replace function public.purge_analytics_older_than(retention interval)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed bigint;
begin
  if retention < interval '1 day' then
    raise exception 'retention_too_short' using errcode = 'invalid_parameter_value';
  end if;
  delete from public.analytics_events where occurred_at < now() - retention;
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.purge_analytics_older_than(interval) from public, anon, authenticated;
grant execute on function public.purge_analytics_older_than(interval) to service_role;

-- To run it automatically, enable the pg_cron extension in Supabase
-- (Database > Extensions) and schedule it. Example, once the retention period is
-- decided (replace '400 days' with YOUR period):
--
--   select cron.schedule(
--     'purge-analytics', '17 3 * * *',
--     $cron$ select public.purge_analytics_older_than(interval '400 days') $cron$
--   );

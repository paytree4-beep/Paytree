-- Payment log: customers tap "I've paid", owners mark payments Received.
-- Optional and off by default. Run once in Supabase > SQL Editor.

alter table public.profiles
  add column if not exists payment_log_enabled boolean not null default false;

grant update (payment_log_enabled) on public.profiles to authenticated;

create table if not exists public.payment_claims (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  payer_name   text not null,
  amount_cents integer,
  method       text,
  note         text,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  received_at  timestamptz,
  constraint payment_claims_name_length check (char_length(btrim(payer_name)) between 2 and 60),
  constraint payment_claims_amount_range check (amount_cents is null or amount_cents between 1 and 100000000),
  constraint payment_claims_method_known check (method is null or method in ('cashapp', 'venmo', 'paypal', 'stripe', 'square', 'wise', 'custom', 'zelle', 'applecash', 'chime', 'ach', 'wire', 'check', 'crypto', 'cash', 'other')),
  constraint payment_claims_note_length check (note is null or char_length(note) <= 140),
  constraint payment_claims_status_known check (status in ('pending', 'received', 'dismissed'))
);

create index if not exists payment_claims_profile_time
  on public.payment_claims (profile_id, created_at desc);

alter table public.payment_claims enable row level security;

-- Customers never write directly: the server inserts with the service role
-- after validating the form. Owners read and update only their own rows.
create policy "Owners can read their own payment log"
  on public.payment_claims for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "Owners can update their own payment log"
  on public.payment_claims for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "Owners can delete from their own payment log"
  on public.payment_claims for delete to authenticated
  using (profile_id = (select auth.uid()));

grant select, delete on public.payment_claims to authenticated;
grant update (status, received_at) on public.payment_claims to authenticated;
grant all on public.payment_claims to service_role;

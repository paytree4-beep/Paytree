-- Apple basket (referral program). Run once in Supabase > SQL Editor.

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles (id) on delete set null;

create table if not exists public.referral_apples (
  id           uuid primary key default gen_random_uuid(),
  referrer_id  uuid not null references public.profiles (id) on delete cascade,
  referred_id  uuid not null unique references public.profiles (id) on delete cascade,
  plan         text not null check (plan in ('monthly', 'annual')),
  amount_cents integer not null check (amount_cents in (50, 300)),
  created_at   timestamptz not null default now(),
  paid_at      timestamptz
);

create index if not exists referral_apples_referrer on public.referral_apples (referrer_id);

alter table public.referral_apples enable row level security;

create policy "Owners can see their own apples"
  on public.referral_apples for select to authenticated
  using (referrer_id = (select auth.uid()));

grant select on public.referral_apples to authenticated;
grant all on public.referral_apples to service_role;

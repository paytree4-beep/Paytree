-- Split the bill + Tip me mode. Run once in Supabase > SQL Editor.

-- Tip me: a page can say "Send me a tip" instead of "Pay".
alter table public.profiles
  add column if not exists page_mode text not null default 'pay';
do $$ begin
  alter table public.profiles add constraint profiles_page_mode_known check (page_mode in ('pay', 'tip'));
exception when duplicate_object then null; end $$;
grant update (page_mode) on public.profiles to authenticated;

-- Split the bill
create table if not exists public.bill_splits (
  id          text primary key check (id ~ '^[a-z0-9]{8}$'),
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 2 and 60),
  total_cents integer not null check (total_cents between 100 and 10000000),
  people      smallint not null check (people between 2 and 50),
  created_at  timestamptz not null default now()
);
create index if not exists bill_splits_owner on public.bill_splits (owner_id, created_at desc);

create table if not exists public.bill_split_payments (
  id         uuid primary key default gen_random_uuid(),
  split_id   text not null references public.bill_splits (id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);
create index if not exists bill_split_payments_split on public.bill_split_payments (split_id, created_at);

alter table public.bill_splits enable row level security;
alter table public.bill_split_payments enable row level security;

create policy "Owners manage their own splits"
  on public.bill_splits for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owners see who paid their splits"
  on public.bill_split_payments for select to authenticated
  using (exists (select 1 from public.bill_splits s where s.id = split_id and s.owner_id = (select auth.uid())));

grant select, insert, delete on public.bill_splits to authenticated;
grant select on public.bill_split_payments to authenticated;
grant all on public.bill_splits, public.bill_split_payments to service_role;

-- Keep these words free for site pages.
insert into public.reserved_usernames (username) values ('bill'), ('split'), ('icons'), ('tip')
on conflict do nothing;

-- Owner confirms each "I've paid" before it counts.
alter table public.bill_split_payments add column if not exists confirmed_at timestamptz;
create policy "Owners confirm payments on their splits"
  on public.bill_split_payments for update to authenticated
  using (exists (select 1 from public.bill_splits s where s.id = split_id and s.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.bill_splits s where s.id = split_id and s.owner_id = (select auth.uid())));
create policy "Owners remove payments on their splits"
  on public.bill_split_payments for delete to authenticated
  using (exists (select 1 from public.bill_splits s where s.id = split_id and s.owner_id = (select auth.uid())));
grant update (confirmed_at), delete on public.bill_split_payments to authenticated;

-- Optional day of the occasion, shown on the bill.
alter table public.bill_splits add column if not exists event_date date;

-- Which payment app the payer opened before tapping "I've paid".
alter table public.bill_split_payments add column if not exists method text;

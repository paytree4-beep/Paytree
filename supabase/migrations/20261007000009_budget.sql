-- Budget + Money tree: what you spend, extra income, and monthly commitments.
-- Private to each owner. Safe to run more than once.

create table if not exists public.commitments (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 2 and 60),
  amount_cents integer not null check (amount_cents between 100 and 100000000),
  due_day      smallint not null check (due_day between 1 and 31),
  category     text not null default 'bills',
  created_at   timestamptz not null default now()
);
create index if not exists commitments_owner on public.commitments (owner_id);

create table if not exists public.money_moves (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  kind          text not null check (kind in ('in', 'out')),
  amount_cents  integer not null check (amount_cents between 1 and 100000000),
  category      text not null default 'other',
  note          text check (note is null or char_length(note) <= 80),
  on_date       date not null,
  commitment_id uuid references public.commitments (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists money_moves_owner_date on public.money_moves (owner_id, on_date desc);

alter table public.commitments enable row level security;
alter table public.money_moves enable row level security;

drop policy if exists "Owners manage their commitments" on public.commitments;
create policy "Owners manage their commitments" on public.commitments for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy if exists "Owners manage their money moves" on public.money_moves;
create policy "Owners manage their money moves" on public.money_moves for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

grant select, insert, delete on public.commitments, public.money_moves to authenticated;
grant all on public.commitments, public.money_moves to service_role;

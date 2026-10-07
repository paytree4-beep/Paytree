-- Invoices: a bill for one customer. Safe to run more than once.

create table if not exists public.invoices (
  id            text primary key check (id ~ '^[a-z0-9]{8}$'),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  customer      text not null check (char_length(btrim(customer)) between 2 and 60),
  title         text not null check (char_length(btrim(title)) between 2 and 80),
  amount_cents  integer not null check (amount_cents between 100 and 10000000),
  due_date      date,
  note          text check (note is null or char_length(note) <= 200),
  claimed_at    timestamptz,
  claimed_method text,
  confirmed_at  timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists invoices_owner on public.invoices (owner_id, created_at desc);

alter table public.invoices enable row level security;

drop policy if exists "Owners manage their own invoices" on public.invoices;
create policy "Owners manage their own invoices" on public.invoices for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

grant select, insert, delete on public.invoices to authenticated;
grant update (claimed_at, claimed_method, confirmed_at) on public.invoices to authenticated;
grant all on public.invoices to service_role;

insert into public.reserved_usernames (username) values ('invoice'), ('invoices')
on conflict do nothing;

-- Daily money email (12 noon New York time): on by default, owners can turn it off.
alter table public.profiles add column if not exists daily_summary boolean not null default true;
grant update (daily_summary) on public.profiles to authenticated;

-- Remembers which days were already emailed, so none goes out twice.
create table if not exists public.daily_summaries (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.daily_summaries enable row level security;
grant all on public.daily_summaries to service_role;

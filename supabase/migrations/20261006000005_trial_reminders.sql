-- Remembers which trial reminder emails were sent, so none goes out twice.
create table if not exists public.trial_reminders (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind    text not null check (kind in ('two_days', 'last_day')),
  sent_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.trial_reminders enable row level security;
grant all on public.trial_reminders to service_role;

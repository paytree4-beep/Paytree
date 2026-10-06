-- Where the "I've paid" box sits among the payment methods on the public page:
-- the number of methods above it. null = after all of them.
alter table public.profiles
  add column if not exists paid_box_position smallint
  check (paid_box_position is null or paid_box_position between 0 and 50);

grant update (paid_box_position) on public.profiles to authenticated;

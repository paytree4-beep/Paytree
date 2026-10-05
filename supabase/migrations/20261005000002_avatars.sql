-- =============================================================================
-- PayTree: profile photos
--
-- Adds a public "avatars" storage bucket and a profiles.avatar_path column.
-- Run once in the Supabase SQL editor (or with `supabase db push`).
--
-- SECURITY
--   * Anyone can view photos (they appear on public pages).
--   * A signed-in user can upload, replace or delete files ONLY inside the
--     folder named after their own user id: avatars/<user id>/...
--   * The bucket accepts JPEG, PNG and WebP up to 1 MB.
--   * avatar_path is checked by the database, so it can only ever point at a
--     file in the owner's own folder, never at another website.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar owners can upload" on storage.objects;
drop policy if exists "Avatar owners can update" on storage.objects;
drop policy if exists "Avatar owners can delete" on storage.objects;
drop policy if exists "Avatar owners can list" on storage.objects;

create policy "Avatar owners can upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Avatar owners can update"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Avatar owners can delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Avatar owners can list"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter table public.profiles add column if not exists avatar_path text;

alter table public.profiles drop constraint if exists profiles_avatar_path_own_folder;
alter table public.profiles add constraint profiles_avatar_path_own_folder check (
  avatar_path is null
  or avatar_path ~ ('^' || id::text || '/[0-9]{10,16}\.jpg$')
);

grant update (avatar_path) on public.profiles to authenticated;

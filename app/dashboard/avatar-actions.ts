"use server";
// app/dashboard/avatar-actions.ts
//
// Upload and remove the profile photo. The browser shrinks the photo to a
// 512 px JPEG before sending it, so uploads stay small. The server checks the
// file again (size and JPEG signature) and stores it in the user's own folder.

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 1024 * 1024;

type Result = { ok: true } | { ok: false; error: string };

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("username, avatar_path").eq("id", user.id).maybeSingle();
  if (!data) return null;
  const row = data as { username: string; avatar_path: string | null };
  return { supabase, userId: user.id as string, username: row.username, oldPath: row.avatar_path };
}

async function removeOldFiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  keep: string | null,
) {
  const { data: files } = await supabase.storage.from("avatars").list(userId, { limit: 100 });
  const stale = ((files ?? []) as { name: string }[])
    .map((f) => `${userId}/${f.name}`)
    .filter((path) => path !== keep);
  if (stale.length > 0) await supabase.storage.from("avatars").remove(stale);
}

export async function uploadAvatar(formData: FormData): Promise<Result> {
  const file = formData.get("avatar");
  if (!(file instanceof Blob) || file.size === 0) return { ok: false, error: "Please choose a photo." };
  if (file.size > MAX_BYTES) return { ok: false, error: "That photo is too large. Please try another." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isJpeg) return { ok: false, error: "Please choose a JPG or PNG photo." };

  const session = await signedIn();
  if (!session) return { ok: false, error: "Please log in again." };
  const { supabase, userId, username } = session;

  const path = `${userId}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, bytes, { contentType: "image/jpeg", cacheControl: "31536000", upsert: false });
  if (uploadError) return { ok: false, error: "We could not upload your photo. Please try again." };

  const { error: saveError } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", userId);
  if (saveError) {
    await supabase.storage.from("avatars").remove([path]);
    return { ok: false, error: "We could not save your photo. Please try again." };
  }

  await removeOldFiles(supabase, userId, path);
  revalidatePath(`/${username}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeAvatar(): Promise<Result> {
  const session = await signedIn();
  if (!session) return { ok: false, error: "Please log in again." };
  const { supabase, userId, username } = session;

  const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", userId);
  if (error) return { ok: false, error: "We could not remove your photo. Please try again." };

  await removeOldFiles(supabase, userId, null);
  revalidatePath(`/${username}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

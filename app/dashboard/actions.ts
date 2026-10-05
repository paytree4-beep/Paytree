"use server";
// app/dashboard/actions.ts
//
// Server Actions for claiming a page and editing it. Every write runs as the
// signed-in user, so Row Level Security only lets people change their own row.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeUsername } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

function cleanDisplayName(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 60) return null;
  return name;
}

function cleanBio(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const bio = raw.replace(/\s+/g, " ").trim();
  return bio.length === 0 ? null : bio.slice(0, 140);
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function claimPage(formData: FormData): Promise<void> {
  const rawName = typeof formData.get("display_name") === "string" ? String(formData.get("display_name")) : "";
  const rawHandle = typeof formData.get("username") === "string" ? String(formData.get("username")) : "";
  const keep = new URLSearchParams({ name: rawName.slice(0, 60), handle: rawHandle.slice(0, 30) });

  const displayName = cleanDisplayName(formData.get("display_name"));
  if (!displayName) redirect(`/onboarding?error=name&${keep}`);

  const username = normalizeUsername(rawHandle);
  if (!username) redirect(`/onboarding?error=handle&${keep}`);

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .insert({ id: user.id, username, display_name: displayName });

  if (error) {
    if (error.code === "23505") {
      // Either the name is taken, or this account already has a page.
      const { data: mine } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (mine) redirect("/dashboard");
      redirect(`/onboarding?error=taken&${keep}`);
    }
    if (error.message.includes("username_reserved")) redirect(`/onboarding?error=reserved&${keep}`);
    redirect(`/onboarding?error=save&${keep}`);
  }

  redirect("/dashboard?notice=welcome");
}

export async function updateProfile(formData: FormData): Promise<void> {
  const displayName = cleanDisplayName(formData.get("display_name"));
  if (!displayName) redirect("/dashboard?error=name");
  const bio = cleanBio(formData.get("bio"));

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, bio })
    .eq("id", user.id)
    .select("username")
    .maybeSingle();

  if (error || !data) redirect("/dashboard?error=save");
  revalidatePath(`/${(data as { username: string }).username}`);
  redirect("/dashboard?notice=saved");
}

export async function setPublished(formData: FormData): Promise<void> {
  const publish = formData.get("publish") === "1";
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_published: publish })
    .eq("id", user.id)
    .select("username")
    .maybeSingle();

  if (error || !data) redirect("/dashboard?error=save");
  revalidatePath(`/${(data as { username: string }).username}`);
  redirect(`/dashboard?notice=${publish ? "published" : "hidden"}`);
}

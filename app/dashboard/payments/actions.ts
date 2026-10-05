"use server";
// app/dashboard/payments/actions.ts
//
// Save and remove payment methods. Runs as the signed-in user, so Row Level
// Security only allows changes to their own rows.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { configFromForm, findMethodForm } from "@/lib/payment-forms";
import { createClient } from "@/lib/supabase/server";

async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/payments");

  const { data } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  if (!data) redirect("/onboarding");
  return { supabase, userId: user.id as string, username: (data as { username: string }).username };
}

export async function savePaymentMethod(formData: FormData): Promise<void> {
  const form = findMethodForm(formData.get("method"));
  if (!form) redirect("/dashboard/payments");

  const config = configFromForm(form, formData);
  if (!config) redirect(`/dashboard/payments?error=invalid&method=${form.id}#${form.id}`);

  const { supabase, userId, username } = await signedIn();

  const { data: existing } = await supabase
    .from("payment_methods")
    .select("id")
    .eq("profile_id", userId)
    .eq("method_id", form.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("payment_methods")
        .update({ public_config: config, is_visible: true })
        .eq("id", (existing as { id: string }).id)
    : await supabase
        .from("payment_methods")
        .insert({ profile_id: userId, method_id: form.id, public_config: config });

  if (error) redirect(`/dashboard/payments?error=save&method=${form.id}#${form.id}`);

  revalidatePath(`/${username}`);
  redirect(`/dashboard/payments?saved=${form.id}#${form.id}`);
}

export async function removePaymentMethod(formData: FormData): Promise<void> {
  const form = findMethodForm(formData.get("method"));
  if (!form) redirect("/dashboard/payments");

  const { supabase, userId, username } = await signedIn();
  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("profile_id", userId)
    .eq("method_id", form.id);

  if (error) redirect(`/dashboard/payments?error=save&method=${form.id}#${form.id}`);

  revalidatePath(`/${username}`);
  redirect(`/dashboard/payments?removed=${form.id}`);
}

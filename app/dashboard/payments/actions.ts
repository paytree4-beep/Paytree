"use server";
// app/dashboard/payments/actions.ts
//
// Save and remove payment methods. Runs as the signed-in user, so Row Level
// Security only allows changes to their own rows.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { configFromForm, findMethodForm, METHOD_FORMS } from "@/lib/payment-forms";
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

async function nextPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<number> {
  const { data } = await supabase
    .from("payment_methods")
    .select("position")
    .eq("profile_id", userId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const top = (data as { position?: number } | null)?.position;
  return typeof top === "number" ? Math.min(top + 1, 100) : 0;
}

export async function savePaymentMethod(formData: FormData): Promise<void> {
  const form = findMethodForm(formData.get("method"));
  if (!form) redirect("/dashboard/payments");

  const config = configFromForm(form, formData);
  if (!config) {
    // Send the typed values back so the person does not have to retype them.
    const keep = new URLSearchParams({ error: "invalid", method: form.id });
    for (const field of form.fields) {
      const value = formData.get(field.name);
      if (typeof value === "string" && value) keep.set(`v_${field.name}`, value.slice(0, field.maxLength));
    }
    redirect(`/dashboard/payments?${keep}#${form.id}`);
  }

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
    : await supabase.from("payment_methods").insert({
        profile_id: userId,
        method_id: form.id,
        public_config: config,
        position: await nextPosition(supabase, userId),
      });

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

/** Saves the owner's order of payment methods (first id = top of the page). */
export async function savePaymentOrder(ids: unknown): Promise<{ ok: boolean }> {
  if (!Array.isArray(ids) || ids.length > METHOD_FORMS.length) return { ok: false };
  const clean = ids.filter((id): id is string => typeof id === "string" && Boolean(findMethodForm(id)));
  if (clean.length !== ids.length || new Set(clean).size !== clean.length) return { ok: false };

  const { supabase, userId, username } = await signedIn();
  for (let i = 0; i < clean.length; i++) {
    const { error } = await supabase
      .from("payment_methods")
      .update({ position: i })
      .eq("profile_id", userId)
      .eq("method_id", clean[i]);
    if (error) return { ok: false };
  }
  revalidatePath(`/${username}`);
  revalidatePath("/dashboard/payments");
  return { ok: true };
}

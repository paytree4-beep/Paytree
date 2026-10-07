"use server";
// app/dashboard/invoices/actions.ts
//
// Create, confirm and delete invoices. Runs as the signed-in owner.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseInvoice } from "@/lib/invoices";
import { isSplitId, newSplitId } from "@/lib/splits";
import { createClient } from "@/lib/supabase/server";

const HERE = "/dashboard/invoices";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${HERE}`);
  return { supabase, user };
}

function invoiceId(formData: FormData): string {
  const id = String(formData.get("id") ?? "");
  if (!isSplitId(id)) redirect(HERE);
  return id;
}

export async function createInvoice(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const parsed = parseInvoice((name) => formData.get(name));
  if ("error" in parsed) redirect(`${HERE}?error=${parsed.error}`);
  const invoice = parsed as Exclude<typeof parsed, { error: unknown }>;

  for (let attempt = 0; attempt < 3; attempt++) {
    const id = newSplitId();
    const { error } = await supabase.from("invoices").insert({
      id,
      owner_id: user.id,
      customer: invoice.customer,
      title: invoice.title,
      amount_cents: invoice.amountCents,
      due_date: invoice.dueDate,
      note: invoice.note,
    });
    if (!error) {
      revalidatePath(HERE);
      redirect(`${HERE}?created=${id}`);
    }
    if (error.code !== "23505") break;
  }
  redirect(`${HERE}?error=save`);
}

/** The owner checked their app: the money arrived. */
export async function confirmInvoice(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = invoiceId(formData);
  await supabase.from("invoices").update({ confirmed_at: new Date().toISOString() }).eq("id", id).eq("owner_id", user.id);
  revalidatePath(HERE);
  redirect(HERE);
}

/** The money never arrived: back to unpaid. */
export async function rejectInvoiceClaim(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = invoiceId(formData);
  await supabase
    .from("invoices")
    .update({ claimed_at: null, claimed_method: null, confirmed_at: null })
    .eq("id", id)
    .eq("owner_id", user.id);
  revalidatePath(HERE);
  redirect(HERE);
}

export async function deleteInvoice(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = invoiceId(formData);
  await supabase.from("invoices").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath(HERE);
  redirect(HERE);
}

// Instant versions: they save in the background and answer yes or no, so the
// page can change at once without reloading.

async function quickOwner(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || typeof id !== "string" || !isSplitId(id)) return null;
  return { supabase, user };
}

export async function confirmInvoiceQuick(id: string): Promise<boolean> {
  const o = await quickOwner(id);
  if (!o) return false;
  const { error } = await o.supabase.from("invoices").update({ confirmed_at: new Date().toISOString() }).eq("id", id).eq("owner_id", o.user.id);
  return !error;
}

export async function rejectInvoiceQuick(id: string): Promise<boolean> {
  const o = await quickOwner(id);
  if (!o) return false;
  const { error } = await o.supabase
    .from("invoices")
    .update({ claimed_at: null, claimed_method: null, confirmed_at: null })
    .eq("id", id)
    .eq("owner_id", o.user.id);
  return !error;
}

export async function deleteInvoiceQuick(id: string): Promise<boolean> {
  const o = await quickOwner(id);
  if (!o) return false;
  const { error } = await o.supabase.from("invoices").delete().eq("id", id).eq("owner_id", o.user.id);
  return !error;
}

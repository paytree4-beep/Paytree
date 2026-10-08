"use server";
// app/invoice/[id]/actions.ts
//
// The customer taps "I've paid" on an invoice. It shows as waiting until the
// owner confirms the money arrived.

import { redirect } from "next/navigation";

import { sendEmail } from "@/lib/email";
import { formatMoney, methodLabel } from "@/lib/payment-log";
import { METHOD_IDS, resolveMethods } from "@/lib/profiles";
import { isSplitId } from "@/lib/splits";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentNoteEmail } from "@/lib/trial-reminders";
import { loadInvoice } from "./data";

export async function claimInvoicePaid(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!isSplitId(id)) redirect("/");
  if (String(formData.get("website") ?? "") !== "") redirect(`/invoice/${id}?paid=1`);

  // The box unlocks after the customer opened one of the payment methods.
  const rawMethod = String(formData.get("method") ?? "");
  const method = METHOD_IDS.find((m) => m === rawMethod);
  if (!method) redirect(`/invoice/${id}?error=method#paid`);

  const admin = createAdminClient();
  if (!admin) redirect(`/invoice/${id}?error=save#paid`);
  const invoiceData = await loadInvoice(id);
  if (!invoiceData) redirect("/");
  if (!resolveMethods(invoiceData.profile.payments).some((m) => m.id === method)) {
    redirect(`/invoice/${id}?error=method#paid`);
  }

  // Only the first claim changes state and sends an owner email.
  const { data: claimed, error } = await admin
    .from("invoices")
    .update({ claimed_at: new Date().toISOString(), claimed_method: method })
    .eq("id", id)
    .is("confirmed_at", null)
    .is("claimed_at", null)
    .select("id")
    .maybeSingle();
  if (error) redirect(`/invoice/${id}?error=save#paid`);
  if (!claimed) redirect(`/invoice/${id}?paid=1`);

  // Let the owner know by email. Never block the customer if this fails.
  try {
    if (invoiceData) {
      const { data: owner } = await admin.auth.admin.getUserById(invoiceData.invoice.owner_id);
      const to = owner?.user?.email;
      if (to) {
        const message = paymentNoteEmail(
          invoiceData.profile.displayName,
          invoiceData.invoice.customer,
          formatMoney(invoiceData.invoice.amount_cents),
          methodLabel(method),
          `Invoice: ${invoiceData.invoice.title}`,
        );
        await sendEmail(to, message.subject, message.html, message.text);
      }
    }
  } catch {
    // ignore
  }

  redirect(`/invoice/${id}?paid=1`);
}

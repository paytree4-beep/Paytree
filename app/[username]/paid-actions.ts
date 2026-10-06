"use server";
// app/[username]/paid-actions.ts
//
// The public "I've paid" form. Anyone can send it, so everything is checked on
// the server: the page must exist, be live and have the payment log turned on.
// A hidden "website" field catches simple spam bots, and each page accepts at
// most 30 notes an hour.

import { redirect } from "next/navigation";

import { sendEmail } from "@/lib/email";
import { formatMoney, methodLabel, parseClaim } from "@/lib/payment-log";
import { paymentNoteEmail } from "@/lib/trial-reminders";
import { getProfileByUsername, normalizeUsername } from "@/lib/profiles";
import { createAdminClient } from "@/lib/supabase/admin";

const HOURLY_LIMIT = 30;

export async function notifyPayment(formData: FormData): Promise<void> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  if (!username) redirect("/");
  const back: (query: string) => never = (query) => redirect(`/${username}?${query}#paid`);

  // Bots fill in every field, people never see this one.
  if (String(formData.get("website") ?? "") !== "") back("paid=1");

  const profile = await getProfileByUsername(username);
  if (!profile?.id || profile.paused || !profile.paymentLog) redirect(`/${username}`);

  const parsed = parseClaim((name) => formData.get(name));
  if ("error" in parsed) back(`paid_error=${parsed.error}`);
  const claim = parsed;

  const admin = createAdminClient();
  if (!admin) back("paid_error=save");

  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await admin
    .from("payment_claims")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profile.id)
    .gte("created_at", hourAgo);
  if (typeof count === "number" && count >= HOURLY_LIMIT) back("paid_error=busy");

  const { error } = await admin.from("payment_claims").insert({
    profile_id: profile.id,
    payer_name: claim.payerName,
    amount_cents: claim.amountCents,
    method: claim.method,
    note: claim.note,
  });
  if (error) back("paid_error=save");

  // Let the owner know by email. Never block the customer if this fails.
  try {
    const { data: owner } = await admin.auth.admin.getUserById(profile.id);
    const to = owner?.user?.email;
    if (to) {
      const message = paymentNoteEmail(
        profile.displayName,
        claim.payerName,
        claim.amountCents === null ? "an amount not given" : formatMoney(claim.amountCents),
        methodLabel(claim.method),
        claim.note,
      );
      await sendEmail(to, message.subject, message.html, message.text);
    }
  } catch {
    // ignore
  }

  back("paid=1");
}

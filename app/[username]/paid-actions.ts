"use server";
// app/[username]/paid-actions.ts
//
// The public "I've paid" form on a payment page was retired: a page only shows
// payment methods now. "I've paid" lives on invoices and split bills, where
// the amount is known. This stays so an old open page that still sends the
// form lands safely on the page instead of failing. It saves nothing.

import { redirect } from "next/navigation";

import { normalizeUsername } from "@/lib/profiles";

export async function notifyPayment(formData: FormData): Promise<void> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  redirect(username ? `/${username}` : "/");
}

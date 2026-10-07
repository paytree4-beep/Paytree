"use server";
// app/dashboard/log/actions.ts
//
// The payment log was retired. These stay only so that an old open page that
// still calls them lands safely on the Money page instead of failing. They
// change nothing.

import { redirect } from "next/navigation";

export async function setPaymentLog(): Promise<void> {
  redirect("/dashboard/budget");
}

export async function markClaim(): Promise<void> {
  redirect("/dashboard/budget");
}

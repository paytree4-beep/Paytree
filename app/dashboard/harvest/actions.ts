"use server";
// app/dashboard/harvest/actions.ts
// The apple basket was retired. Kept so the old route still builds.

import { redirect } from "next/navigation";

export async function markApplesPaid(): Promise<void> {
  redirect("/dashboard");
}

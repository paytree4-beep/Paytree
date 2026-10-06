// app/dashboard/log/export/route.ts
//
// Downloads the payment log as a CSV file that opens in Excel, Numbers and
// Google Sheets. Only the signed-in owner's rows (Row Level Security).

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { claimsToCsv, dayKey, safeTimeZone, type ClaimRow } from "@/lib/payment-log";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/dashboard/log", request.url));

  const timeZone = safeTimeZone((await cookies()).get("pt_tz")?.value);

  const { data, error } = await supabase
    .from("payment_claims")
    .select("id, payer_name, amount_cents, method, note, status, created_at, received_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error) return NextResponse.redirect(new URL("/dashboard/log?error=export", request.url));

  const csv = claimsToCsv((data ?? []) as ClaimRow[], timeZone);
  const name = `paytree-payments-${dayKey(new Date(), timeZone)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}

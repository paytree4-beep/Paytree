// app/dashboard/invoices/export/route.ts
//
// Downloads the owner's invoices as a CSV file for Excel, Numbers and Google
// Sheets. Only the signed-in owner's rows (Row Level Security).

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { invoicesToCsv, type InvoiceRow } from "@/lib/invoices";
import { dayKey, safeTimeZone } from "@/lib/payment-log";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/dashboard/invoices", request.url));

  const timeZone = safeTimeZone((await cookies()).get("pt_tz")?.value);
  const { data, error } = await supabase
    .from("invoices")
    .select("id, customer, title, amount_cents, due_date, note, claimed_at, claimed_method, confirmed_at, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error) return NextResponse.redirect(new URL("/dashboard/invoices?error=export", request.url));

  const csv = invoicesToCsv((data ?? []) as InvoiceRow[], timeZone);
  const name = `paytree-invoices-${dayKey(new Date(), timeZone)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}

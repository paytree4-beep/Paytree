// app/dashboard/money/export/route.ts
//
// Downloads every confirmed payment (payment page, invoices, split bills) as
// one CSV file for Excel, Numbers and Google Sheets.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { moneyToCsv } from "@/lib/money";
import { dayKey, safeTimeZone } from "@/lib/payment-log";
import { createClient } from "@/lib/supabase/server";
import { loadMoneyEntries } from "../data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/dashboard/money", request.url));

  const timeZone = safeTimeZone((await cookies()).get("pt_tz")?.value);
  const entries = await loadMoneyEntries(supabase, user.id);
  const csv = moneyToCsv(entries, timeZone);
  const name = `paytree-money-${dayKey(new Date(), timeZone)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}

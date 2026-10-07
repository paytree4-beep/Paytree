// app/dashboard/money/export/route.ts
//
// Downloads everything that came in and everything the owner spent as one CSV
// file for Excel, Numbers and Google Sheets: the money they added themselves,
// plus the invoices and split bills they confirmed as paid.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { bookToCsv, type BookRow } from "@/lib/budget";
import { SOURCE_LABELS } from "@/lib/money";
import { dayKey, safeTimeZone } from "@/lib/payment-log";
import { createClient } from "@/lib/supabase/server";
import { loadMoneyEntries } from "../data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/dashboard/budget", request.url));

  const timeZone = safeTimeZone((await cookies()).get("pt_tz")?.value);
  const rows: BookRow[] = [];

  const { data: moves } = await supabase
    .from("money_moves")
    .select("kind, amount_cents, category, note, on_date")
    .eq("owner_id", user.id)
    .order("on_date", { ascending: false })
    .limit(20000);
  for (const m of (moves ?? []) as { kind: "in" | "out"; amount_cents: number; category: string; note: string | null; on_date: string }[]) {
    rows.push({
      date: m.on_date,
      kind: m.kind,
      amountCents: m.amount_cents,
      category: m.category,
      note: m.note ?? "",
      source: "Added by me",
    });
  }

  for (const e of await loadMoneyEntries(supabase, user.id)) {
    rows.push({
      date: dayKey(new Date(e.at), timeZone),
      kind: "in",
      amountCents: e.amountCents,
      category: null,
      note: `${e.from} · ${e.what}`,
      source: SOURCE_LABELS[e.source],
    });
  }

  const name = `paytree-money-${dayKey(new Date(), timeZone)}.csv`;
  return new NextResponse(bookToCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}

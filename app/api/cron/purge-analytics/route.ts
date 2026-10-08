// Delete visitor analytics after the 13-month period in the privacy policy.
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const { data, error } = await admin.rpc("purge_analytics_older_than", { retention: "13 months" });
  if (error) return NextResponse.json({ error: "purge failed" }, { status: 500 });
  return NextResponse.json({ removed: data ?? 0 });
}

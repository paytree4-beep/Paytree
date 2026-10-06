// app/auth/recover/route.ts
//
// Receives the session from a password reset link (read from the URL fragment
// by the page that /auth/callback serves) and stores it in cookies, so the
// person can choose a new password on /reset-password.

import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Only accept calls from our own pages, so another site cannot sign a
  // visitor into someone else's account.
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return new NextResponse(null, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const { access_token, refresh_token } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof access_token !== "string" ||
    typeof refresh_token !== "string" ||
    access_token.length > 4096 ||
    refresh_token.length > 1024
  ) {
    return new NextResponse(null, { status: 400 });
  }

  const supabase = await createClient();
  // setSession checks the token with Supabase before saving it.
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return new NextResponse(null, { status: 401 });

  return new NextResponse(null, { status: 204, headers: { "cache-control": "no-store" } });
}

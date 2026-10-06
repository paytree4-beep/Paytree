// app/auth/callback/route.ts
//
// Where the links in Supabase emails land: sign-up confirmation and password
// reset. It turns the one-time code into a signed-in session, then sends the
// person on to the right page.

import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), "/dashboard");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const isReset = next === "/reset-password";
  const isGoogle = searchParams.get("source") === "google";

  // Supabase reports expired or already-used links with an error parameter.
  if (searchParams.get("error") || searchParams.get("error_code")) {
    if (isGoogle) return NextResponse.redirect(`${origin}/login?error=google`);
    return NextResponse.redirect(`${origin}${isReset ? "/forgot?error=link" : "/login?error=link"}`);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    if (isGoogle) return NextResponse.redirect(`${origin}/login?error=google`);
    // The link was opened in a different browser from the one used to sign up.
    // Supabase has already confirmed the email, so the person only needs to
    // log in here.
    return NextResponse.redirect(
      `${origin}${isReset ? "/forgot?error=browser" : "/login?notice=confirmed"}`,
    );
  }

  // Password reset links arrive with the session in the URL fragment
  // (#access_token=...), which never reaches the server. A tiny page reads it
  // in the browser and hands it to /auth/recover, which sets the cookies.
  if (isReset && !code && !tokenHash) {
    return new NextResponse(RECOVER_PAGE, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
      },
    });
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}${isReset ? "/forgot?error=link" : "/login?error=link"}`);
}

const RECOVER_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>PayTree</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FAF5EA;color:#0B4D3B;font:16px/1.5 system-ui,-apple-system,sans-serif}</style>
</head><body><p>One moment…</p>
<script>
(function () {
  var fail = "/forgot?error=link";
  var h = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, "", location.pathname);
  var at = h.get("access_token"), rt = h.get("refresh_token");
  if (!at || !rt || h.get("error")) { location.replace(fail); return; }
  fetch("/auth/recover", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ access_token: at, refresh_token: rt })
  }).then(function (r) {
    location.replace(r.ok ? "/reset-password" : fail);
  }, function () { location.replace(fail); });
})();
</script></body></html>`;

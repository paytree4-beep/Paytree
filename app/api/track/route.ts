// app/api/track/route.ts
//
// Receives view / open / copy events from the public page.
// Same-origin only, tiny payloads only, bots ignored, nothing identifying stored.

import {
  countryFromHeaders,
  deviceFromUserAgent,
  parseTrackPayload,
  recordEvent,
  referrerHost,
} from "@/lib/analytics";
import { getProfileByUsername } from "@/lib/profiles";

export const runtime = "nodejs";

const MAX_BODY_CHARS = 2048;

function status(code: number): Response {
  return new Response(null, { status: code });
}

export async function POST(request: Request): Promise<Response> {
  if (request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") {
    return status(204);
  }
  const host = request.headers.get("host");

  // Only our own pages may report events.
  const origin = request.headers.get("origin");
  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return status(400);
    }
    if (host && originHost !== host) return status(403);
  }

  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return status(413);

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return status(400);
  }

  const payload = parseTrackPayload(json);
  if (!payload) return status(400);

  // The owner looking at their own page is not a visitor.
  const ownerCookie = /(?:^|;\s*)pt_owner=([^;]+)/.exec(request.headers.get("cookie") ?? "")?.[1];
  if (ownerCookie) {
    let owner = "";
    try {
      owner = decodeURIComponent(ownerCookie);
    } catch {
      owner = "";
    }
    if (owner === payload.username) return status(204);
  }

  // Crawlers and link-preview bots are not visitors.
  const device = deviceFromUserAgent(request.headers.get("user-agent"));
  if (device === "bot") return status(204);

  // Ignore events for pages that do not exist.
  const profile = await getProfileByUsername(payload.username);
  if (!profile?.id || profile.paused) return status(404);

  await recordEvent({
    profileId: profile.id,
    username: profile.username,
    action: payload.action,
    method: payload.method,
    referrerHost: referrerHost(payload.referrer, host),
    device,
    country: countryFromHeaders(request.headers),
  });

  return status(204);
}

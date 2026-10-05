// lib/analytics.ts
//
// Privacy-first click tracking for public pages.
//
// What is recorded for each event: the page owner's username, the action
// (view, open, copy), which payment method was used, the time, the referring
// website's domain only, a coarse device type and a two-letter country code.
//
// What is NOT recorded: IP addresses, user agents, cookies, names, emails or
// any identifier that could follow a visitor from one page or day to another.

import { METHOD_IDS, normalizeUsername, type MethodId } from "./profiles";

export type TrackAction = "view" | "open" | "copy";
export type DeviceType = "mobile" | "tablet" | "desktop";

/** What the browser is allowed to send. */
export interface TrackPayload {
  username: string;
  action: TrackAction;
  /** null for "view", a valid method id for "open" and "copy". */
  method: MethodId | null;
  /** Raw document.referrer. Reduced to a domain before anything is stored. */
  referrer: string | null;
}

/** What gets stored. */
export interface AnalyticsEvent {
  username: string;
  action: TrackAction;
  method: MethodId | null;
  referrerHost: string | null;
  device: DeviceType;
  country: string | null;
  occurredAt: Date;
}

const ACTIONS: readonly TrackAction[] = ["view", "open", "copy"];

/** Validates untrusted JSON from the browser. Returns null for anything unexpected. */
export function parseTrackPayload(input: unknown): TrackPayload | null {
  if (typeof input !== "object" || input === null) return null;
  const record = input as Record<string, unknown>;

  const username = typeof record.username === "string" ? normalizeUsername(record.username) : null;
  if (!username) return null;

  const action = ACTIONS.find((a) => a === record.action);
  if (!action) return null;

  let method: MethodId | null = null;
  if (action === "view") {
    if (record.method !== undefined && record.method !== null) return null;
  } else {
    const found = METHOD_IDS.find((id) => id === record.method);
    if (!found) return null;
    method = found;
  }

  const referrer = typeof record.referrer === "string" ? record.referrer.slice(0, 2048) : null;
  return { username, action, method, referrer };
}

/**
 * Reduces a referrer URL to its bare domain ("instagram.com"). Returns null for
 * empty, malformed or non-web values, and for visits that come from our own site.
 */
export function referrerHost(raw: string | null, ownHost: string | null): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!host || host.length > 100) return null;

  if (ownHost) {
    const own = ownHost.toLowerCase().split(":")[0].replace(/^www\./, "");
    if (host === own) return null;
  }
  return host;
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget|python-requests/i;

/** Coarse device class from the user agent. The user agent itself is never stored. */
export function deviceFromUserAgent(userAgent: string | null): DeviceType | "bot" {
  if (!userAgent || BOT_PATTERN.test(userAgent)) return "bot";
  if (/ipad|tablet|android(?!.*mobile)/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** Two-letter country code supplied by the hosting platform, or null. */
export function countryFromHeaders(headers: Headers): string | null {
  const raw = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry");
  if (!raw || !/^[A-Za-z]{2}$/.test(raw)) return null;
  const code = raw.toUpperCase();
  return code === "XX" ? null : code;
}

/**
 * Stores one event with the service role (visitors cannot write to the table
 * directly). Never throws: analytics must not break a payment page.
 */
export async function recordEvent(event: AnalyticsEvent & { profileId: string }): Promise<void> {
  try {
    const { createAdminClient } = await import("./supabase/admin");
    const admin = createAdminClient();
    if (!admin) return;
    await admin.from("analytics_events").insert({
      profile_id: event.profileId,
      action: event.action,
      method_id: event.method,
      referrer_host: event.referrerHost,
      device: event.device,
      country: event.country,
      occurred_at: event.occurredAt.toISOString(),
    });
  } catch {
    // Ignore: a lost analytics event is better than a broken page.
  }
}

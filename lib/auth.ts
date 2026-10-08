// lib/auth.ts
//
// Small helpers shared by the sign-up, log-in and dashboard code.

import { headers } from "next/headers";

import { SITE_URL } from "./site";

/** The address this request arrived on, used to build links in auth emails. */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return SITE_URL;
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Only allow redirects to our own pages, never to another website. */
export function safeNext(raw: unknown, fallback = "/dashboard"): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function cleanEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RULE.test(email)) return null;
  return email;
}

/** At least 8 characters, with at least one letter and one number. */
export function passwordProblem(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length < 8) return "short";
  if (raw.length > 72) return "long";
  if (!/[A-Za-z]/.test(raw) || !/[0-9]/.test(raw)) return "weak";
  return null;
}

/** Reads one value from Next.js searchParams. */
export function param(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

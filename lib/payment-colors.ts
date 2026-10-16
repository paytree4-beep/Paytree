// lib/payment-colors.ts
//
/**
 * Each service's signature color behind a simple icon, so visitors spot the
 * one they use at a glance. Only colors, never the services' own logos.
 */
// This file is used by the browser, so it must not import anything from
// ./profiles except types (profiles.ts pulls in server-only code).
import type { MethodId } from "./profiles";

/** Colors the owner can pick for an "Other payment method". */
export const LOCAL_COLORS = ["green", "blue", "purple", "orange", "red", "pink", "gold", "black"] as const;
export type LocalColor = (typeof LOCAL_COLORS)[number];

/** The colors an owner can pick for an "Other payment method". */
export const LOCAL_BADGES: Record<LocalColor, { bg: string; fg: string }> = {
  green: { bg: "#0A7D5A", fg: "#FFFFFF" },
  blue: { bg: "#2563EB", fg: "#FFFFFF" },
  purple: { bg: "#6D28D9", fg: "#FFFFFF" },
  orange: { bg: "#D9730D", fg: "#FFFFFF" },
  red: { bg: "#DC2626", fg: "#FFFFFF" },
  pink: { bg: "#DB2777", fg: "#FFFFFF" },
  gold: { bg: "#B7791F", fg: "#FFFFFF" },
  black: { bg: "#1A1A1A", fg: "#FFFFFF" },
};

const BADGE_COLORS: Partial<Record<MethodId, { bg: string; fg: string }>> = {
  cashapp: { bg: "#00D632", fg: "#FFFFFF" },
  venmo: { bg: "#008CFF", fg: "#FFFFFF" },
  paypal: { bg: "#003087", fg: "#FFFFFF" },
  stripe: { bg: "#635BFF", fg: "#FFFFFF" },
  square: { bg: "#1A1A1A", fg: "#FFFFFF" },
  wise: { bg: "#9FE870", fg: "#163300" },
  zelle: { bg: "#6D1ED4", fg: "#FFFFFF" },
  applecash: { bg: "#1A1A1A", fg: "#FFFFFF" },
  chime: { bg: "#1EC677", fg: "#FFFFFF" },
  crypto: { bg: "#26A17B", fg: "#FFFFFF" },
  custom: { bg: "#D9B873", fg: "#064E3B" },
};
const DEFAULT_BADGE = { bg: "#E3F0EA", fg: "#064E3B" };

/** `color` is only used by "Other payment method" (id "local"). */
export function badgeColor(id: string, color?: string): { bg: string; fg: string } {
  if (id === "local") return LOCAL_BADGES[LOCAL_COLORS.find((c) => c === color) ?? "green"];
  return BADGE_COLORS[id as MethodId] ?? DEFAULT_BADGE;
}

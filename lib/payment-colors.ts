// lib/payment-colors.ts
//
/**
 * Each service's signature color behind a simple icon, so visitors spot the
 * one they use at a glance. Only colors, never the services' own logos.
 */
import type { MethodId } from "./profiles";

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

export function badgeColor(id: string): { bg: string; fg: string } {
  return BADGE_COLORS[id as MethodId] ?? DEFAULT_BADGE;
}

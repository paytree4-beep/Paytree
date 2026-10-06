"use client";
// components/dashboard/sale-celebration.tsx
//
// When a customer sent "I've paid" since the owner last opened the dashboard,
// apples bounce across the screen once. A cookie remembers the newest note
// already celebrated, so it does not repeat on every visit.

import { useEffect, useState } from "react";

import { AppleCelebration } from "@/components/marketing/apple-celebration";

export const SEEN_COOKIE = "pt_seen_sale";

export function SaleCelebration({ latest }: { latest: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    document.cookie = `${SEEN_COOKIE}=${encodeURIComponent(latest)}; path=/; max-age=31536000; samesite=lax; secure`;
  }, [latest]);

  return show ? <AppleCelebration /> : null;
}

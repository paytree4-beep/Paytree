"use client";
// components/dashboard/time-zone-cookie.tsx
//
// Remembers the owner's time zone in a cookie, so "today" and "this month" in
// the payment log match their own clock. Refreshes once if it changed.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function TimeZoneCookie({ current }: { current: string | null }) {
  const router = useRouter();
  useEffect(() => {
    let zone = "";
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return;
    }
    if (!zone || zone === current) return;
    document.cookie = `pt_tz=${encodeURIComponent(zone)}; path=/; max-age=31536000; samesite=lax; secure`;
    router.refresh();
  }, [current, router]);
  return null;
}

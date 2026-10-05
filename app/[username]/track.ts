// app/[username]/track.ts
//
// Browser-side helper that reports a view, an open or a copy to /api/track.
// It stays silent when the visitor has Global Privacy Control or Do Not Track
// switched on, and it never blocks or breaks the page if the request fails.

import type { MethodId } from "@/lib/profiles";

type TrackEvent =
  | { username: string; action: "view"; referrer: string }
  | { username: string; action: "open" | "copy"; method: MethodId };

function visitorOptedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1";
}

export function track(event: TrackEvent): void {
  if (typeof window === "undefined" || visitorOptedOut()) return;

  const body = JSON.stringify(event);

  try {
    // sendBeacon survives the page being left right after the tap (app handoff).
    if (navigator.sendBeacon) {
      const queued = navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      if (queued) return;
    }
  } catch {
    // Fall through to fetch.
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never affect the visitor.
  });
}

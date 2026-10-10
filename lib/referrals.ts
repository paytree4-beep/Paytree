"use client";
// components/ref-capture.tsx
//
// Remembers who sent this visitor (?ref=<username>) for 60 days, so the
// referrer gets an apple if the visitor later subscribes. First link wins.

import { useEffect } from "react";

export function RefCapture() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (!ref || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,29}$/.test(ref)) return;
      if (/(?:^|;\s*)pt_ref=/.test(document.cookie)) return;
      document.cookie = `pt_ref=${encodeURIComponent(ref.toLowerCase())}; path=/; max-age=5184000; samesite=lax; secure`;
    } catch {
      // ignore
    }
  }, []);
  return null;
}

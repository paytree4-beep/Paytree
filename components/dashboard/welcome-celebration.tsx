"use client";
// components/dashboard/welcome-celebration.tsx
//
// Shown once, right after someone creates their page: apples fall and a short
// "Welcome to PayTree.to" message appears. It then removes ?notice=welcome
// from the address bar and remembers it was shown, so opening tiles, going
// back, or refreshing never repeats it.

import { useEffect, useState } from "react";

import { AppleCelebration } from "@/components/marketing/apple-celebration";

const SEEN_KEY = "pt_welcomed";
const SHOW_MS = 4200;

export function WelcomeCelebration() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Clean the URL first, so Back or Refresh never brings the welcome back.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("notice") === "welcome") {
        url.searchParams.delete("notice");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }
    } catch {
      // ignore
    }

    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      seen = false;
    }
    if (seen) return;

    setShow(true);
    const timer = window.setTimeout(() => setShow(false), SHOW_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <>
      <AppleCelebration />
      <div
        role="status"
        className="pointer-events-none fixed inset-x-0 top-[30%] z-50 flex justify-center px-6"
      >
        <div className="pt-welcome rounded-[28px] border border-white/90 bg-white/90 px-8 py-6 text-center shadow-[0_30px_60px_-30px_rgba(6,78,59,0.55)] backdrop-blur-xl">
          <style>{`
            @keyframes pt-welcome-in {
              0% { opacity: 0; transform: scale(.85) translateY(10px); }
              12% { opacity: 1; transform: scale(1.04) translateY(0); }
              18% { transform: scale(1); }
              85% { opacity: 1; }
              100% { opacity: 0; }
            }
            .pt-welcome { animation: pt-welcome-in ${SHOW_MS}ms ease-out both; }
            @media (prefers-reduced-motion: reduce) { .pt-welcome { animation: none; } }
          `}</style>
          <p className="font-serif text-[34px] leading-[1.1] text-[#064E3B]">Welcome to PayTree.to</p>
          <p className="mt-2 text-[16px] font-medium text-[#2F4A3E]">Your page is ready 🍎</p>
        </div>
      </div>
    </>
  );
}

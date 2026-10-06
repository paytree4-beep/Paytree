"use client";
// components/marketing/apple-celebration.tsx
//
// A short burst of colorful apples that drop and bounce across the screen,
// shown once after a customer sends "I've paid". Decorative only: it never
// blocks taps, cleans itself up after a few seconds, and stays off for people
// who prefer reduced motion.

import { useEffect, useState } from "react";

import { Apple, type AppleColor } from "./apples";

const COLORS: AppleColor[] = ["red", "green", "yellow", "gold"];
const COUNT = 18;
const DURATION_MS = 4200;

type Drop = { left: number; size: number; color: AppleColor; delay: number; spin: number; floor: number };

function makeDrops(): Drop[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    left: 3 + Math.random() * 88,
    size: 30 + Math.round(Math.random() * 26),
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.9,
    spin: (Math.random() < 0.5 ? -1 : 1) * (90 + Math.round(Math.random() * 200)),
    floor: 78 + Math.random() * 12,
  }));
}

export function AppleCelebration() {
  const [drops, setDrops] = useState<Drop[] | null>(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    setDrops(makeDrops());
    const timer = window.setTimeout(() => setDrops(null), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!drops) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style>{`
        @keyframes pt-apple-drop {
          0%   { transform: translateY(-20vh) rotate(0deg); animation-timing-function: cubic-bezier(.55,0,1,.45); }
          45%  { transform: translateY(var(--floor)) rotate(calc(var(--spin) * .6)); animation-timing-function: cubic-bezier(0,.55,.45,1); }
          62%  { transform: translateY(calc(var(--floor) - 16vh)) rotate(calc(var(--spin) * .8)); animation-timing-function: cubic-bezier(.55,0,1,.45); }
          77%  { transform: translateY(var(--floor)) rotate(var(--spin)); animation-timing-function: cubic-bezier(0,.55,.45,1); }
          86%  { transform: translateY(calc(var(--floor) - 5vh)) rotate(var(--spin)); animation-timing-function: cubic-bezier(.55,0,1,.45); }
          94%  { transform: translateY(var(--floor)) rotate(var(--spin)); opacity: 1; }
          100% { transform: translateY(var(--floor)) rotate(var(--spin)); opacity: 0; }
        }
      `}</style>
      {drops.map((d, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${d.left}%`,
            ["--floor" as string]: `${d.floor}vh`,
            ["--spin" as string]: `${d.spin}deg`,
            animation: `pt-apple-drop ${2.6 + d.delay}s ${d.delay}s both`,
          }}
        >
          <Apple color={d.color} size={d.size} />
        </span>
      ))}
    </div>
  );
}

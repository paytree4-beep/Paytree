// components/marketing/apples.tsx
//
// Colorful hand-drawn apples: the "fruit" of the PayTree. Used as a slow,
// floating background on the landing page. Decorative only.

import type { CSSProperties } from "react";

const PALETTE = {
  red: { body: "#E5484D", shade: "#B9333A" },
  green: { body: "#7BC86C", shade: "#4E9A43" },
  yellow: { body: "#F2C94C", shade: "#C9A033" },
  gold: { body: "#D9B873", shade: "#B08D45" },
} as const;

export type AppleColor = keyof typeof PALETTE;

export function Apple({ color, size = 64 }: { color: AppleColor; size?: number }) {
  const c = PALETTE[color];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 19c-4-4-12-5-17 0-6 6-5 18 0 26 4 7 9 11 13 10 2-.4 3-1.4 4-1.4s2 1 4 1.4c4 1 9-3 13-10 5-8 6-20 0-26-5-5-13-4-17 0z"
        fill={c.body}
      />
      <path
        d="M47 21c4 6 3 16-1 23-3 5-6 8-9 9 5-4 9-12 9-20 0-5-1-9 1-12z"
        fill={c.shade}
        opacity="0.55"
      />
      <ellipse cx="22" cy="28" rx="4" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(-20 22 28)" />
      <path d="M32 19c0-5 1-8 3-11" stroke="#6B4A2B" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M34 13c4-6 11-6 14-4-3 5-9 7-14 4z" fill="#3E8E3A" />
    </svg>
  );
}

type Spot = {
  color: AppleColor;
  size: number;
  top: string;
  left: string;
  rot: number;
  delay: number;
  blur?: boolean;
  opacity?: number;
  /** Sits at the screen edge, so it is safe to show on phones. */
  edge?: boolean;
};

const SPOTS: Spot[] = [
  { color: "red", size: 64, top: "13%", left: "-2%", rot: -12, delay: 0, edge: true },
  { color: "green", size: 54, top: "16%", left: "88%", rot: 14, delay: 1.5, edge: true },
  { color: "yellow", size: 46, top: "38%", left: "92%", rot: -8, delay: 3, opacity: 0.85, edge: true },
  { color: "yellow", size: 80, top: "46%", left: "-6%", rot: 10, delay: 2, blur: true, opacity: 0.45, edge: true },
  { color: "red", size: 40, top: "60%", left: "72%", rot: 18, delay: 4, opacity: 0.75 },
  { color: "green", size: 70, top: "74%", left: "-4%", rot: -16, delay: 1, blur: true, opacity: 0.5, edge: true },
  { color: "yellow", size: 52, top: "86%", left: "90%", rot: 6, delay: 2.5, edge: true },
  { color: "red", size: 34, top: "92%", left: "40%", rot: -4, delay: 3.5, opacity: 0.7 },
]

/** Fixed layer of floating apples behind the whole landing page. */
export function AppleBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {SPOTS.map((s, i) => (
        <span
          key={i}
          className={`pt-float absolute ${s.blur ? "blur-[2px]" : ""} ${s.edge ? "" : "hidden lg:block"}`}
          style={
            {
              top: s.top,
              left: s.left,
              opacity: s.opacity ?? 0.9,
              animationDelay: `${s.delay}s`,
              "--pt-rot": `${s.rot}deg`,
            } as CSSProperties
          }
        >
          <Apple color={s.color} size={s.size} />
        </span>
      ))}
    </div>
  );
}

/** A few apples arranged around a profile photo. Decorative only. */
export function AppleHalo({ compact = false }: { compact?: boolean }) {
  // Same size for every apple, placed evenly: three on each side.
  const size = compact ? 16 : 34;
  const items: { color: AppleColor; size: number; style: CSSProperties; delay: number }[] = [
    { color: "red", size, style: { top: "10%", left: "12%", "--pt-rot": "-12deg" } as CSSProperties, delay: 0 },
    { color: "green", size, style: { top: "10%", right: "12%", "--pt-rot": "12deg" } as CSSProperties, delay: 1.2 },
    { color: "yellow", size, style: { top: "42%", left: "6%", "--pt-rot": "8deg" } as CSSProperties, delay: 2.1 },
    { color: "red", size, style: { top: "42%", right: "6%", "--pt-rot": "-8deg" } as CSSProperties, delay: 0.6 },
    { color: "green", size, style: { bottom: "12%", left: "14%", "--pt-rot": "14deg" } as CSSProperties, delay: 1.8 },
    { color: "yellow", size, style: { bottom: "12%", right: "14%", "--pt-rot": "-14deg" } as CSSProperties, delay: 2.6 },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it, i) => (
        <span key={i} className="pt-float absolute opacity-90" style={{ ...it.style, animationDelay: `${it.delay}s` }}>
          <Apple color={it.color} size={it.size} />
        </span>
      ))}
    </div>
  );
}

/** An apple with a short label written on it. Scales to its container. */
export function LabeledApple({ color, label }: { color: "red" | "green" | "yellow"; label: string }) {
  const c = PALETTE[color];
  const text = color === "yellow" ? "#064E3B" : "#FFFFFF";
  return (
    <div className="relative aspect-square w-full">
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full drop-shadow-[0_8px_10px_rgba(6,78,59,0.18)]" aria-hidden="true">
        <path
          d="M32 19c-4-4-12-5-17 0-6 6-5 18 0 26 4 7 9 11 13 10 2-.4 3-1.4 4-1.4s2 1 4 1.4c4 1 9-3 13-10 5-8 6-20 0-26-5-5-13-4-17 0z"
          fill={c.body}
        />
        <path d="M47 21c4 6 3 16-1 23-3 5-6 8-9 9 5-4 9-12 9-20 0-5-1-9 1-12z" fill={c.shade} opacity="0.45" />
        <ellipse cx="21" cy="27" rx="3" ry="5.5" fill="#FFFFFF" opacity="0.3" transform="rotate(-20 21 27)" />
        <path d="M32 19c0-5 1-8 3-11" stroke="#6B4A2B" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M34 13c4-6 11-6 14-4-3 5-9 7-14 4z" fill="#3E8E3A" />
      </svg>
      <span
        className="absolute inset-x-[18%] top-[38%] flex h-[38%] items-center justify-center whitespace-pre-line text-center text-[10.5px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[15px]"
        style={{ color: text }}
      >
        {label}
      </span>
    </div>
  );
}

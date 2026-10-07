// components/budget/money-tree.tsx
//
// The Money tree, drawn like the PayTree logo: a golden dollar-sign trunk,
// golden branches and big green leaves. Apples on the branches are money kept
// this month, apples on the grass were spent. Red = $1,000, green = $100,
// yellow = $10. Apples are scattered at random (the same way each time). Plain SVG, so it renders on the server and can be turned into
// a picture for sharing.

import type { AppleColor } from "@/lib/budget";

const APPLE =
  "M32 19c-4-4-12-5-17 0-6 6-5 18 0 26 4 7 9 11 13 10 2-.4 3-1.4 4-1.4s2 1 4 1.4c4 1 9-3 13-10 5-8 6-20 0-26-5-5-13-4-17 0z";
// Clear, strong colors that stand out from the leaves.
const FILL: Record<AppleColor, string> = { red: "#B3121D", green: "#C6E33A", yellow: "#FFC20E" };

// x0, y0 (on the trunk), x1, y1 (tip), thickness
const BRANCHES: [number, number, number, number, number][] = [
  [200, 262, 58, 168, 11],
  [200, 254, 342, 160, 11],
  [200, 222, 96, 92, 9],
  [200, 214, 306, 84, 9],
  [200, 196, 200, 26, 9],
];

/** Small seeded random numbers, so a tree looks the same every time it is opened. */
function random(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** Up to `count` spots, scattered at random but never touching each other. */
function scatter(
  count: number,
  rand: () => number,
  inside: (x: number, y: number) => boolean,
  box: [number, number, number, number],
  gap: number,
): [number, number][] {
  const spots: [number, number][] = [];
  for (let tries = 0; spots.length < count && tries < 4000; tries++) {
    const x = box[0] + rand() * (box[2] - box[0]);
    const y = box[1] + rand() * (box[3] - box[1]);
    if (!inside(x, y)) continue;
    if (spots.some(([sx, sy]) => (sx - x) ** 2 + (sy - y) ** 2 < gap * gap)) continue;
    spots.push([Math.round(x), Math.round(y)]);
  }
  return spots;
}

// The leafy crown, and the grass.
const inCrown = (x: number, y: number) => ((x - 200) / 165) ** 2 + ((y - 150) / 118) ** 2 <= 1 && y < 258;
const onGrass = (x: number, y: number) => ((x - 200) / 196) ** 2 + ((y - 486) / 20) ** 2 <= 1 && Math.abs(x - 200) > 26;

function Leaf({ x, y, a, s }: { x: number; y: number; a: number; s: number }) {
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${s})`}>
      <path d="M0 0 C 14 -16, 36 -16, 50 0 C 36 16, 14 16, 0 0 Z" fill="#11693A" />
      <path d="M0 0 C 14 -16, 36 -16, 50 0 Z" fill="#43A852" />
      <path d="M2 0 L 46 0" stroke="#17602F" strokeWidth="1.4" />
    </g>
  );
}

function Apple({ x, y, color, i, size = 40, fallen = false }: { x: number; y: number; color: AppleColor; i: number; size?: number; fallen?: boolean }) {
  const s = size / 64;
  const tilt = fallen ? (i % 2 ? 22 : -18) : 0;
  return (
    <g className={fallen ? "pt-tree-fall" : "pt-tree-pop"} style={{ animationDelay: `${(i * 0.05).toFixed(2)}s`, transformOrigin: `${x}px ${y}px` }}>
      <g transform={`translate(${x - size / 2} ${y - size / 2}) rotate(${tilt} ${size / 2} ${size / 2}) scale(${s})`}>
        <path d={APPLE} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="7" strokeLinejoin="round" />
        <path d={APPLE} fill={FILL[color]} stroke="#3A1A08" strokeOpacity=".5" strokeWidth="2" />
        <ellipse cx="22" cy="28" rx="4" ry="7" fill="#fff" opacity=".5" transform="rotate(-20 22 28)" />
        <path d="M32 19c0-5 1-8 3-11" stroke="#6B4A2B" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M34 13c4-6 11-6 14-4-3 5-9 7-14 4z" fill="#3E8E3A" />
      </g>
    </g>
  );
}

export function MoneyTree({
  apples,
  fallen,
  id = "money-tree",
  seed = "paytree",
}: {
  apples: AppleColor[];
  fallen: AppleColor[];
  id?: string;
  /** Same seed, same apple spots (for example the owner and the month). */
  seed?: string;
}) {
  const rand = random(seed);
  const treeSpots = scatter(apples.length, rand, inCrown, [36, 34, 364, 258], 40);
  const grassSpots = scatter(fallen.length, rand, onGrass, [6, 468, 394, 504], 30);
  const gold = `${id}-gold`;
  const leaves: { x: number; y: number; a: number; s: number }[] = [];
  for (const [x0, y0, x1, y1] of BRANCHES) {
    const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    [0.5, 0.82].forEach((t, k) => {
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      leaves.push({ x, y, a: ang - 52, s: 1.25 + k * 0.1 }, { x, y, a: ang + 52, s: 1.25 + k * 0.1 });
    });
    leaves.push({ x: x1, y: y1, a: ang, s: 1.55 });
  }

  return (
    <svg
      id={id}
      viewBox="-30 -24 460 548"
      width="100%"
      role="img"
      aria-label={`Money tree: ${apples.length} apples on the tree, ${fallen.length} on the grass`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes pt-tree-pop { 0% { transform: scale(0); } 70% { transform: scale(1.15); } 100% { transform: scale(1); } }
        @keyframes pt-tree-fall { 0% { transform: translateY(-300px); opacity: 0; } 60% { opacity: 1; } 80% { transform: translateY(6px); } 100% { transform: translateY(0); } }
        .pt-tree-pop { animation: pt-tree-pop .5s ease-out both; }
        .pt-tree-fall { animation: pt-tree-fall .9s cubic-bezier(.55,0,.4,1) both; }
        @media (prefers-reduced-motion: reduce) { .pt-tree-pop, .pt-tree-fall { animation: none; } }
      `}</style>
      <defs>
        <linearGradient id={gold} x1="0" x2="1">
          <stop offset="0" stopColor="#A87A1E" />
          <stop offset=".5" stopColor="#E2BC5E" />
          <stop offset="1" stopColor="#A87A1E" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="486" rx="214" ry="30" fill="#CFE6C8" />
      {BRANCHES.map(([x0, y0, x1, y1, w], i) => (
        <path
          key={i}
          d={`M${x0} ${y0} Q ${(x0 + x1) / 2 + (x1 > x0 ? -10 : 10)} ${(y0 + y1) / 2 + 12} ${x1} ${y1}`}
          stroke={`url(#${gold})`}
          strokeWidth={w}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <path d="M189 478 L 193 196 L 207 196 L 211 478 Z" fill={`url(#${gold})`} />
      <path
        d="M236 330 C 236 296, 164 296, 164 334 C 164 370, 236 362, 236 404 C 236 446, 160 446, 160 410"
        stroke={`url(#${gold})`}
        strokeWidth="24"
        fill="none"
        strokeLinecap="round"
      />
      {leaves.map((l, i) => (
        <Leaf key={i} {...l} />
      ))}
      {treeSpots.map(([x, y], i) => (
        <Apple key={`t${i}`} x={x} y={y} color={apples[i]} i={i} />
      ))}
      {grassSpots.map(([x, y], i) => (
        <Apple key={`g${i}`} x={x} y={y} color={fallen[i]} i={i} size={32} fallen />
      ))}
    </svg>
  );
}

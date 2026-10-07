// lib/og.tsx
//
// Shared pieces for link-preview images (WhatsApp, iMessage, Instagram,
// Facebook, X). Rendered by next/og, which supports a subset of CSS: every
// box with more than one child needs display: flex.

const APPLE =
  "M32 19c-4-4-12-5-17 0-6 6-5 18 0 26 4 7 9 11 13 10 2-.4 3-1.4 4-1.4s2 1 4 1.4c4 1 9-3 13-10 5-8 6-20 0-26-5-5-13-4-17 0z";

export function appleSrc(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 64 64"><path d="${APPLE}" fill="${color}"/><ellipse cx="22" cy="28" rx="4" ry="7" fill="#fff" opacity=".35" transform="rotate(-20 22 28)"/><path d="M32 19c0-5 1-8 3-11" stroke="#6B4A2B" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M34 13c4-6 11-6 14-4-3 5-9 7-14 4z" fill="#3E8E3A"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export const OG_SIZE = { width: 1200, height: 630 };

/** Words with the first letter red and the others green / yellow, like the share card. */
export function ColoredWords({ text, size }: { text: string; size: number }) {
  const others = ["#E5484D", "#E5484D"]; // all red
  let n = 0;
  return (
    <div style={{ display: "flex", gap: size * 0.28 }}>
      {text.split(" ").map((word, w) => (
        <div key={w} style={{ display: "flex" }}>
          {Array.from(word).map((ch, i) => (
            <span key={i} style={{ color: i === 0 ? "#E5484D" : others[n++ % 2], fontSize: size, fontWeight: 800 }}>
              {ch}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AppleRow({ size = 56 }: { size?: number }) {
  const colors = ["#E5484D", "#7BC86C", "#F2C94C", "#E5484D", "#7BC86C", "#F2C94C", "#E5484D"];
  return (
    <div style={{ display: "flex", gap: size * 0.55 }}>
      {colors.map((c, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={appleSrc(c)} width={size} height={size} alt="" />
      ))}
    </div>
  );
}

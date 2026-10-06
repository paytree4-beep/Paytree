// app/opengraph-image.tsx
//
// Link preview for paytree.to itself.

import { ImageResponse } from "next/og";

import { AppleRow, ColoredWords, OG_SIZE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PayTree: all your payment methods, one simple link";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, #E6F2EA 0%, #F4F3E8 55%, #FAF5EA 100%)",
          padding: "54px 60px 44px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${SITE_URL}/logo-mark.png`} width={110} height={110} alt="" />
          <span style={{ fontSize: 84, fontWeight: 800, color: "#064E3B" }}>PayTree</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 50, fontWeight: 800, color: "#064E3B" }}>All your payment methods.</span>
          <ColoredWords text="One simple link" size={64} />
        </div>
        <AppleRow size={58} />
      </div>
    ),
    size,
  );
}

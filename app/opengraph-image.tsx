// app/opengraph-image.tsx
//
// Link preview for paytree.to itself (dark green, centered).

import { ImageResponse } from "next/og";

import { OG_SIZE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PayTree: one link, every way to get paid";

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
          justifyContent: "center",
          background: "linear-gradient(160deg, #2A6150 0%, #1C4A3A 50%, #123528 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 190,
              height: 190,
              borderRadius: 95,
              background: "#FAF5EA",
              border: "8px solid #B9A04A",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${SITE_URL}/logo-mark.png`} width={150} height={150} alt="" />
          </div>
          <span style={{ fontSize: 88, fontWeight: 800, color: "#FFFFFF", marginLeft: 22 }}>PayTree</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 16 }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: "#FFFFFF" }}>One link.</span>
          <span style={{ fontSize: 72, fontWeight: 800, color: "#E3B93C" }}>Every way to get paid.</span>
        </div>
        <span style={{ fontSize: 34, fontWeight: 600, color: "#CFE6DB", marginTop: 20 }}>
          Venmo · Zelle · Cash App · PayPal
        </span>
        <div style={{ display: "flex", alignItems: "center", marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              background: "#E3B93C",
              color: "#17402F",
              fontSize: 36,
              fontWeight: 800,
              borderRadius: 44,
              padding: "14px 38px",
            }}
          >
            paytree.to
          </div>
          <span style={{ fontSize: 30, color: "#FFFFFF", marginLeft: 24 }}>7 days free</span>
        </div>
      </div>
    ),
    size,
  );
}

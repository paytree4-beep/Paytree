////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// app/opengraph-image.tsx
//
// Link preview for paytree.to itself (dark green, centered, logo in a circle).

import { ImageResponse } from "next/og";

import { OG_SIZE } from "@/lib/og";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PayTree: the easiest way to get paid";

// Golden rays (same look as the landing page), drawn as a small SVG picture.
const RAYS = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAwIiBoZWlnaHQ9IjE2MDAiIHZpZXdCb3g9IjAgMCAxNjAwIDE2MDAiPjxkZWZzPjxyYWRpYWxHcmFkaWVudCBpZD0iZyIgY3g9IjgwMCIgY3k9IjgwMCIgcj0iODAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjRTNCOTNDIiBzdG9wLW9wYWNpdHk9IjAuMiIvPjxzdG9wIG9mZnNldD0iMC42IiBzdG9wLWNvbG9yPSIjRTNCOTNDIiBzdG9wLW9wYWNpdHk9IjAiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48ZyBmaWxsPSJ1cmwoI2cpIj48cGF0aCBkPSJNODAwIDgwMEw4MDAuMCAwLjBMODgzLjYgNC40WiIvPjxwYXRoIGQ9Ik04MDAgODAwTDEwNDcuMiAzOS4yTDExMjUuNCA2OS4yWiIvPjxwYXRoIGQ9Ik04MDAgODAwTDEyNzAuMiAxNTIuOEwxMzM1LjMgMjA1LjVaIi8+PHBhdGggZD0iTTgwMCA4MDBMMTQ0Ny4yIDMyOS44TDE0OTIuOCA0MDAuMFoiLz48cGF0aCBkPSJNODAwIDgwMEwxNTYwLjggNTUyLjhMMTU4Mi41IDYzMy43WiIvPjxwYXRoIGQ9Ik04MDAgODAwTDE2MDAuMCA4MDAuMEwxNTk1LjYgODgzLjZaIi8+PHBhdGggZD0iTTgwMCA4MDBMMTU2MC44IDEwNDcuMkwxNTMwLjggMTEyNS40WiIvPjxwYXRoIGQ9Ik04MDAgODAwTDE0NDcuMiAxMjcwLjJMMTM5NC41IDEzMzUuM1oiLz48cGF0aCBkPSJNODAwIDgwMEwxMjcwLjIgMTQ0Ny4yTDEyMDAuMCAxNDkyLjhaIi8+PHBhdGggZD0iTTgwMCA4MDBMMTA0Ny4yIDE1NjAuOEw5NjYuMyAxNTgyLjVaIi8+PHBhdGggZD0iTTgwMCA4MDBMODAwLjAgMTYwMC4wTDcxNi40IDE1OTUuNloiLz48cGF0aCBkPSJNODAwIDgwMEw1NTIuOCAxNTYwLjhMNDc0LjYgMTUzMC44WiIvPjxwYXRoIGQ9Ik04MDAgODAwTDMyOS44IDE0NDcuMkwyNjQuNyAxMzk0LjVaIi8+PHBhdGggZD0iTTgwMCA4MDBMMTUyLjggMTI3MC4yTDEwNy4yIDEyMDAuMFoiLz48cGF0aCBkPSJNODAwIDgwMEwzOS4yIDEwNDcuMkwxNy41IDk2Ni4zWiIvPjxwYXRoIGQ9Ik04MDAgODAwTDAuMCA4MDAuMEw0LjQgNzE2LjRaIi8+PHBhdGggZD0iTTgwMCA4MDBMMzkuMiA1NTIuOEw2OS4yIDQ3NC42WiIvPjxwYXRoIGQ9Ik04MDAgODAwTDE1Mi44IDMyOS44TDIwNS41IDI2NC43WiIvPjxwYXRoIGQ9Ik04MDAgODAwTDMyOS44IDE1Mi44TDQwMC4wIDEwNy4yWiIvPjxwYXRoIGQ9Ik04MDAgODAwTDU1Mi44IDM5LjJMNjMzLjcgMTcuNVoiLz48L2c+PC9zdmc+";

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
          paddingBottom: 70,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={RAYS} width={1600} height={1600} alt="" style={{ position: "absolute", left: -200, top: -430 }} />
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
          <span style={{ fontSize: 108, fontWeight: 800, color: "#FFFFFF", marginLeft: 24 }}>PayTree</span>
        </div>
        <span style={{ fontSize: 74, fontWeight: 800, color: "#FFFFFF", marginTop: 36 }}>
          The Easiest Way to Get Paid.
        </span>
        <span style={{ fontSize: 64, fontWeight: 800, color: "#E3B93C", marginTop: 12 }}>
          One Link. Every Payment Method.
        </span>
      </div>
    ),
    size,
  );
}

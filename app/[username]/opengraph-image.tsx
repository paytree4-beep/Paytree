// app/[username]/opengraph-image.tsx
//
// The picture shown when someone shares paytree.to/<name> in WhatsApp,
// iMessage, Instagram and friends: photo, name, "Pay me here" in apple
// colors, the link and the PayTree logo.

import { ImageResponse } from "next/og";

import { AppleRow, ColoredWords, OG_SIZE } from "@/lib/og";
import { getProfileByUsername } from "@/lib/profiles";
import { SITE_HOST, SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "PayTree payment page";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(username).catch(() => null);
  const name = profile?.displayName ?? "PayTree";
  const handle = profile?.username ?? username;
  const headline = profile?.pageMode === "tip" ? "Tip me" : "Pay me here";
  const initial = (name.trim().charAt(0) || "P").toUpperCase();
  const nameSize = name.length > 22 ? 58 : name.length > 14 ? 70 : 84;

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
          padding: "46px 60px 40px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${SITE_URL}/logo-mark.png`} width={64} height={64} alt="" />
          <span style={{ fontSize: 40, fontWeight: 800, color: "#064E3B" }}>PayTree</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              width={220}
              height={220}
              alt=""
              style={{ borderRadius: 220, border: "10px solid #FFFFFF", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: 220,
                height: 220,
                borderRadius: 220,
                border: "10px solid #FFFFFF",
                background: "#064E3B",
                color: "#FBFBFB",
                fontSize: 120,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {initial}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 700 }}>
            <span style={{ fontSize: nameSize, fontWeight: 700, color: "#064E3B", lineHeight: 1.05 }}>{name}</span>
            <ColoredWords text={headline} size={66} />
            <span style={{ fontSize: 34, fontWeight: 700, color: "#2F4A3E" }}>
              {SITE_HOST}/{handle}
            </span>
          </div>
        </div>

        <AppleRow size={58} />
      </div>
    ),
    size,
  );
}

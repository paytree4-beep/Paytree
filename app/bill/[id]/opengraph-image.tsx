// app/bill/[id]/opengraph-image.tsx
//
// The picture shown when a split bill link is shared in WhatsApp, iMessage
// and friends: "SPLIT THE BILL", what it is for, the date and the share each.

import { ImageResponse } from "next/og";

import { AppleRow, OG_SIZE } from "@/lib/og";
import { formatMoney } from "@/lib/payment-log";
import { getProfileByUsername } from "@/lib/profiles";
import { SITE_URL } from "@/lib/site";
import { formatEventDate, isSplitId, shareCents } from "@/lib/splits";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Split the bill on PayTree";

type SplitRow = { title: string; total_cents: number; people: number; event_date: string | null; owner_id: string };

async function load(id: string): Promise<{ split: SplitRow; name: string } | null> {
  if (!isSplitId(id)) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("bill_splits")
    .select("title, total_cents, people, event_date, owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const split = data as SplitRow;
  const { data: owner } = await admin.from("profiles").select("username").eq("id", split.owner_id).maybeSingle();
  const username = (owner as { username?: string } | null)?.username;
  const profile = username ? await getProfileByUsername(username).catch(() => null) : null;
  return { split, name: profile?.displayName ?? "" };
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await load(id).catch(() => null);
  const title = data?.split.title ?? "Split the bill";
  const each = data ? formatMoney(shareCents(data.split.total_cents, data.split.people)) : "";
  const when = data?.split.event_date ? formatEventDate(data.split.event_date) : "";
  const titleSize = title.length > 26 ? 60 : title.length > 16 ? 72 : 84;

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
          padding: "40px 60px 36px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${SITE_URL}/logo-mark.png`} width={60} height={60} alt="" />
          <span style={{ fontSize: 38, fontWeight: 800, color: "#064E3B" }}>PayTree</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: 6, color: "#E5484D" }}>SPLIT THE BILL</span>
          <span style={{ fontSize: titleSize, fontWeight: 800, color: "#064E3B", lineHeight: 1.05, textAlign: "center" }}>{title}</span>
          {when ? <span style={{ fontSize: 32, fontWeight: 700, color: "#7A5A12" }}>{when}</span> : null}
          {each ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 8 }}>
              <span style={{ fontSize: 96, fontWeight: 800, color: "#064E3B" }}>{each}</span>
              <span style={{ fontSize: 40, fontWeight: 700, color: "#3F574C" }}>each</span>
            </div>
          ) : null}
          {data?.name ? <span style={{ fontSize: 30, fontWeight: 600, color: "#2F4A3E" }}>Pay {data.name}</span> : null}
        </div>

        <AppleRow size={50} />
      </div>
    ),
    size,
  );
}

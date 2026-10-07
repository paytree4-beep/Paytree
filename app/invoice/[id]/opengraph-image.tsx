// app/invoice/[id]/opengraph-image.tsx
//
// The picture shown when an invoice link is shared in WhatsApp, iMessage and
// friends: "INVOICE", who it is from, what for, the amount and due date.

import { ImageResponse } from "next/og";

import { AppleRow, OG_SIZE } from "@/lib/og";
import { formatMoney } from "@/lib/payment-log";
import { SITE_URL } from "@/lib/site";
import { formatEventDate } from "@/lib/splits";
import { loadInvoice } from "./data";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Invoice on PayTree";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadInvoice(id).catch(() => null);
  const from = data?.profile.displayName ?? "";
  const title = data?.invoice.title ?? "Invoice";
  const amount = data ? formatMoney(data.invoice.amount_cents) : "";
  const due = data?.invoice.due_date ? `Due ${formatEventDate(data.invoice.due_date)}` : "";
  const paid = !!data?.invoice.confirmed_at;
  const titleSize = title.length > 28 ? 52 : title.length > 18 ? 62 : 72;

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
          <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: 6, color: "#E5484D" }}>INVOICE</span>
          {from ? <span style={{ fontSize: 34, fontWeight: 700, color: "#2F4A3E" }}>From {from}</span> : null}
          <span style={{ fontSize: titleSize, fontWeight: 800, color: "#064E3B", lineHeight: 1.05, textAlign: "center" }}>{title}</span>
          {amount ? <span style={{ fontSize: 100, fontWeight: 800, color: "#064E3B", marginTop: 6 }}>{amount}</span> : null}
          {paid ? (
            <span style={{ fontSize: 34, fontWeight: 800, color: "#FFFFFF", background: "#16A34A", padding: "6px 22px", borderRadius: 999 }}>PAID</span>
          ) : due ? (
            <span style={{ fontSize: 32, fontWeight: 700, color: "#7A5A12" }}>{due}</span>
          ) : null}
        </div>

        <AppleRow size={50} />
      </div>
    ),
    size,
  );
}

// app/[username]/qr-card.tsx
//
// "Scan to pay" card. Draws a QR code that opens this page, and lets the owner
// or a visitor save it as a PNG for print or social media.
// Requires:  npm install qrcode.react

"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download } from "lucide-react";

type QrCardProps = {
  /** Full public address, for example https://paytree.me/hartwell */
  url: string;
  /** Shown under the code, for example paytree.me/hartwell */
  label: string;
};

export function QrCard({ url, label }: QrCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  // Turns the on-screen SVG into a 1024 px PNG with a white margin.
  function downloadPng() {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;

    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const size = 1024;
      const pad = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = `paytree-${label.split("/").pop() ?? "qr"}.png`;
        a.click();
        URL.revokeObjectURL(href);
      }, "image/png");
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  }

  return (
    <section
      aria-labelledby="h-qr"
      className="mt-8 flex items-center gap-[18px] rounded-[18px] border border-[#DCE5DF] bg-white p-[18px]"
    >
      <div ref={wrapRef} className="shrink-0 rounded-lg bg-white">
        <QRCodeSVG
          value={url}
          size={112}
          level="M"
          marginSize={2}
          fgColor="#064E3B"
          bgColor="#FFFFFF"
          title={`QR code that opens ${label}`}
        />
      </div>

      <div className="min-w-0">
        <h2 id="h-qr" className="text-[13px] font-bold tracking-[0.12em] text-[#064E3B]">
          SCAN TO PAY
        </h2>
        <p className="mt-1 text-sm text-[#4B6358]">
          Point your phone camera at the code to open this page, or share it in person and in
          print.
        </p>
        <p className="mt-1.5 text-[13px] font-semibold">{label}</p>
        <button
          type="button"
          onClick={downloadPng}
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#E3F0EA] px-4 text-sm font-semibold text-[#064E3B] hover:bg-[#D3E7DD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B873]"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download PNG
        </button>
      </div>
    </section>
  );
}

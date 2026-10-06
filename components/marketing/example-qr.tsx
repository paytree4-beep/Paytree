"use client";
// components/marketing/example-qr.tsx
//
// A real, scannable QR code for the example page on the homepage.

import { QRCodeSVG } from "qrcode.react";

export function ExampleQr({ url, size = 56 }: { url: string; size?: number }) {
  return (
    <span className="block flex-none rounded-md bg-white p-0.5">
      <QRCodeSVG value={url} size={size} level="M" marginSize={0} fgColor="#064E3B" bgColor="#FFFFFF" />
    </span>
  );
}

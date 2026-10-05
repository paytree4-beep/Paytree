"use client";
// components/marketing/example-qr.tsx
//
// A real, scannable QR code for the example page on the homepage.

import { QRCodeSVG } from "qrcode.react";

export function ExampleQr({ url }: { url: string }) {
  return (
    <span className="flex-none rounded-md bg-white p-1">
      <QRCodeSVG value={url} size={56} level="M" marginSize={0} fgColor="#064E3B" bgColor="#FFFFFF" />
    </span>
  );
}

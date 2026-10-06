// app/[username]/qr-card.tsx
//
// "Scan to pay" card. Draws a QR code that opens this page, and lets the owner
// or a visitor save it as a PNG for print or social media.
// Requires:  npm install qrcode.react

"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Download } from "lucide-react";

type QrCardProps = {
  /** Full public address, for example https://paytree.to/hartwell */
  url: string;
  /** Shown under the code, for example paytree.to/hartwell */
  label: string;
};

/** Renders the on-screen QR SVG into a 1024 px PNG with a white margin. */
function svgToPng(svg: SVGSVGElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const size = 1024;
      const pad = 64;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2);
      canvas.toBlob((blob) => resolve(blob), "image/png");
    };
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  });
}

export function QrCard({ url, label }: QrCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [hint, setHint] = useState("");
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  function flashSaved(message: string) {
    setSaved(true);
    setHint(message);
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 3000);
  }
  const fileName = `paytree-${label.split("/").pop() ?? "qr"}.png`;

  // Prepare the PNG ahead of time, so the tap can open the share sheet
  // straight away (iPhones only allow it right after a tap).
  useEffect(() => {
    const svg = wrapRef.current?.querySelector("svg");
    if (!svg) return;
    let cancelled = false;
    svgToPng(svg).then((blob) => {
      if (!cancelled && blob) setFile(new File([blob], fileName, { type: "image/png" }));
    });
    return () => {
      cancelled = true;
    };
  }, [url, fileName]);

  async function downloadPng() {
    if (!file) {
      setHint("One moment, preparing your QR code. Tap again.");
      return;
    }

    // Phones: the share sheet has "Save Image", which puts it in Photos.
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: "My PayTree QR code" });
        flashSaved("Done! If you chose Save Image, it is in your Photos.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    // Computers: a normal download.
    const href = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    flashSaved("Downloaded. If nothing appeared, press and hold the QR code and choose Save Image.");
    window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
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
          className={`mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B873] ${
            saved ? "bg-[#16A34A] text-white" : "bg-[#E3F0EA] text-[#064E3B] hover:bg-[#D3E7DD]"
          }`}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Saved
            </>
          ) : (
            <>
              <Download className="h-4 w-4" aria-hidden="true" />
              Save QR code
            </>
          )}
        </button>
        {hint ? (
          <p role="status" aria-live="polite" className="mt-1.5 text-[13px] font-semibold text-[#064E3B]">
            {hint}
          </p>
        ) : null}
      </div>
    </section>
  );
}

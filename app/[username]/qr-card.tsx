// app/[username]/qr-card.tsx
//
// "Scan to pay" card. Draws a QR code that opens this page, and lets the owner
// or a visitor save or share it as a branded picture (with the link and
// paytree.to on it) for print or social media.
// Requires:  npm install qrcode.react

"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Download, Share2 } from "lucide-react";

import { markStep } from "@/lib/onboarding-steps";

type QrCardProps = {
  /** Full public address, for example https://paytree.to/hartwell */
  url: string;
  /** Shown under the code, for example paytree.to/hartwell */
  label: string;
  /** The page owner's name, printed on the shared picture. */
  name?: string;
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Turns the on-screen QR into a shareable picture that also advertises
 * PayTree: logo, "Scan to pay", the person's name, the QR, their link and
 * "Get your own free page at paytree.to". 1080 x 1350 (Instagram portrait).
 */
async function svgToPng(svg: SVGSVGElement, label: string, name?: string): Promise<Blob | null> {
  const xml = new XMLSerializer().serializeToString(svg);
  const [qr, logo] = await Promise.all([
    loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`),
    loadImage("/logo-mark.png"),
  ]);
  if (!qr) return null;
  if (document.fonts?.ready) await document.fonts.ready.catch(() => undefined);

  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#E6F2EA");
  bg.addColorStop(0.55, "#F4F3E8");
  bg.addColorStop(1, "#FAF5EA");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Logo + PayTree
  ctx.font = `800 56px ${font}`;
  const brandW = ctx.measureText("PayTree").width;
  const logoSize = 84;
  const startX = (W - (logoSize + 16 + brandW)) / 2;
  if (logo) ctx.drawImage(logo, startX, 58, logoSize, logoSize);
  ctx.fillStyle = "#064E3B";
  ctx.textAlign = "left";
  ctx.fillText("PayTree", startX + logoSize + 16, 120);
  ctx.textAlign = "center";

  // Scan to pay + name
  ctx.fillStyle = "#E5484D";
  ctx.font = `800 40px ${font}`;
  ctx.fillText("SCAN TO PAY", W / 2, 228);
  if (name) {
    let size = 64;
    ctx.font = `800 ${size}px ${font}`;
    while (ctx.measureText(name).width > W - 140 && size > 34) {
      size -= 4;
      ctx.font = `800 ${size}px ${font}`;
    }
    ctx.fillStyle = "#0B1F18";
    ctx.fillText(name, W / 2, 304);
  }

  // QR on a white card
  const card = 700;
  const cx = (W - card) / 2;
  const cy = 350;
  ctx.save();
  ctx.shadowColor = "rgba(6,78,59,0.25)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#FFFFFF";
  roundRect(ctx, cx, cy, card, card, 48);
  ctx.fill();
  ctx.restore();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qr, cx + 40, cy + 40, card - 80, card - 80);

  // Their link
  ctx.fillStyle = "#064E3B";
  let linkSize = 50;
  ctx.font = `800 ${linkSize}px ${font}`;
  while (ctx.measureText(label).width > W - 120 && linkSize > 30) {
    linkSize -= 2;
    ctx.font = `800 ${linkSize}px ${font}`;
  }
  ctx.fillText(label, W / 2, 1150);
  ctx.fillStyle = "#3F574C";
  ctx.font = `600 30px ${font}`;
  ctx.fillText("Cash App · Venmo · Zelle · and more", W / 2, 1200);

  // Footer ad
  ctx.fillStyle = "#064E3B";
  roundRect(ctx, 0, H - 92, W, 92, 0);
  ctx.fill();
  ctx.fillStyle = "#FBFBFB";
  ctx.font = `700 32px ${font}`;
  ctx.fillText("Get your own free payment page at paytree.to", W / 2, H - 34);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

export function QrCard({ url, label, name }: QrCardProps) {
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
    svgToPng(svg, label, name).then((blob) => {
      if (!cancelled && blob) setFile(new File([blob], fileName, { type: "image/png" }));
    });
    return () => {
      cancelled = true;
    };
  }, [url, fileName, label, name]);

  async function sharePng() {
    if (!file) {
      setHint("One moment, preparing your QR code. Tap again.");
      return;
    }
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    const text = `Scan to pay${name ? ` ${name}` : ""} · ${url}`;
    try {
      if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: name ? `Pay ${name}` : "PayTree", text });
        markStep("qr");
        return;
      }
      if (typeof nav.share === "function") {
        await nav.share({ title: name ? `Pay ${name}` : "PayTree", text, url });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    // No share sheet (most computers): save the picture instead.
    await downloadPng();
  }

  async function downloadPng() {
    if (!file) {
      setHint("One moment, preparing your QR code. Tap again.");
      return;
    }

    // Phones: the share sheet has "Save Image", which puts it in Photos.
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: name ? `Pay ${name}` : "PayTree" });
        markStep("qr");
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
    markStep("qr");
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
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={sharePng}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[#064E3B] px-4 text-sm font-semibold text-[#FBFBFB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B873]"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share QR
          </button>
          <button
            type="button"
            onClick={downloadPng}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B873] ${
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
                Save
              </>
            )}
          </button>
        </div>
        {hint ? (
          <p role="status" aria-live="polite" className="mt-1.5 text-[13px] font-semibold text-[#064E3B]">
            {hint}
          </p>
        ) : null}
      </div>
    </section>
  );
}

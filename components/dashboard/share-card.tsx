"use client";
// components/dashboard/share-card.tsx
//
// "Pay me here" / "Tip me" card maker for Instagram Stories, Reels and TikTok.
// Draws a 1080x1920 card on a canvas (name, photo, QR code, apples) and saves
// it as an image, or records a 5-second video of apples falling into place.

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const W = 1080;
const H = 1920;
const DURATION = 5; // seconds of video

const APPLE_PATH =
  "M32 19c-4-4-12-5-17 0-6 6-5 18 0 26 4 7 9 11 13 10 2-.4 3-1.4 4-1.4s2 1 4 1.4c4 1 9-3 13-10 5-8 6-20 0-26-5-5-13-4-17 0z";
const LEAF_PATH = "M34 13c4-6 11-6 14-4-3 5-9 7-14 4z";
const COLORS = ["#E5484D", "#7BC86C", "#F2C94C", "#D9B873"];

function appleSvg(color: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="${APPLE_PATH}" fill="${color}"/><ellipse cx="22" cy="28" rx="4" ry="7" fill="#fff" opacity=".35" transform="rotate(-20 22 28)"/><path d="M32 19c0-5 1-8 3-11" stroke="#6B4A2B" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="${LEAF_PATH}" fill="#3E8E3A"/></svg>`;
}

function loadImage(src: string, cors = false): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

type Drop = { x: number; size: number; color: number; delay: number; floor: number; spin: number };

function makeDrops(): Drop[] {
  // Fixed layout so the image always looks the same.
  const xs = [60, 190, 320, 450, 590, 720, 850, 980, 120, 260, 400, 660, 800, 940];
  return xs.map((x, i) => ({
    x,
    size: 110 + ((i * 37) % 60),
    color: i % COLORS.length,
    delay: (i % 7) * 0.18,
    floor: 1785 - ((i * 53) % 90),
    spin: ((i % 2 ? 1 : -1) * (20 + ((i * 29) % 40)) * Math.PI) / 180,
  }));
}

/** Falls, bounces twice, settles. 0..1 progress -> y offset factor. */
function bounce(p: number): number {
  if (p < 0.55) return (p / 0.55) ** 2;
  if (p < 0.78) {
    const q = (p - 0.55) / 0.23;
    return 1 - 0.12 * Math.sin(q * Math.PI);
  }
  const q = (p - 0.78) / 0.22;
  return 1 - 0.04 * Math.sin(Math.min(1, q) * Math.PI);
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

export function ShareCardMaker({
  name,
  username,
  avatar,
  tip,
  pageUrl,
}: {
  name: string;
  username: string;
  avatar: string | null;
  tip: boolean;
  pageUrl?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const assets = useRef<{
    apples: (HTMLImageElement | null)[];
    logo: HTMLImageElement | null;
    avatar: HTMLImageElement | null;
    qr: HTMLImageElement | null;
  } | null>(null);
  const drops = useRef<Drop[]>(makeDrops());
  const [mode, setMode] = useState<"pay" | "tip">(tip ? "tip" : "pay");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<"" | "image" | "video">("");
  const [status, setStatus] = useState("");
  const [canVideo, setCanVideo] = useState(false);
  const link = pageUrl ?? `https://paytree.to/${username}`;
  const shortLink = link.replace(/^https?:\/\//, "");

  const draw = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      const a = assets.current;
      if (!canvas || !a) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#E6F2EA");
      bg.addColorStop(0.45, "#F4F3E8");
      bg.addColorStop(1, "#FAF5EA");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Card fades and rises in
      const cardIn = Math.min(1, Math.max(0, (t - 0.6) / 0.9));
      ctx.save();
      ctx.globalAlpha = cardIn;
      ctx.translate(0, (1 - cardIn) * 60);

      ctx.shadowColor = "rgba(6,78,59,0.25)";
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 24;
      ctx.fillStyle = "#FFFFFF";
      roundRect(ctx, 110, 230, 860, 1400, 64);
      ctx.fill();
      ctx.shadowColor = "transparent";

      // Logo
      if (a.logo) ctx.drawImage(a.logo, 405, 270, 84, 84);
      ctx.fillStyle = "#064E3B";
      ctx.font = "800 46px -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("PayTree", 500, 314);

      // Photo or initial
      const cx = W / 2;
      const cy = 545;
      const r = 130;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
      ctx.fillStyle = "#E6F2EA";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      if (a.avatar) {
        ctx.drawImage(a.avatar, cx - r, cy - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = "#064E3B";
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.fillStyle = "#FBFBFB";
        ctx.font = "160px Georgia, 'Times New Roman', serif";
        ctx.textAlign = "center";
        ctx.fillText((name.trim().charAt(0) || "P").toUpperCase(), cx, cy + 8);
      }
      ctx.restore();

      // Name and headline
      ctx.textAlign = "center";
      ctx.fillStyle = "#064E3B";
      let size = 92;
      ctx.font = `${size}px Georgia, 'Times New Roman', serif`;
      while (ctx.measureText(name).width > 780 && size > 48) {
        size -= 4;
        ctx.font = `${size}px Georgia, 'Times New Roman', serif`;
      }
      ctx.fillText(name, cx, 770);

      ctx.font = "800 72px -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";
      ctx.fillStyle = "#B8893A";
      ctx.fillText(mode === "tip" ? "Tip me 💸" : "Pay me here 🌳", cx, 875);

      // QR code
      if (a.qr) {
        ctx.fillStyle = "#F4F8F6";
        roundRect(ctx, cx - 250, 945, 500, 500, 40);
        ctx.fill();
        ctx.drawImage(a.qr, cx - 210, 985, 420, 420);
      }

      ctx.fillStyle = "#064E3B";
      ctx.font = "700 50px -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";
      ctx.fillText(shortLink, cx, 1510);
      ctx.fillStyle = "#4B6358";
      ctx.font = "500 36px -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";
      ctx.fillText("Scan the code or tap the link in bio", cx, 1575);
      ctx.restore();

      // Apples falling into a pile at the bottom
      drops.current.forEach((d) => {
        const img = a.apples[d.color];
        if (!img) return;
        const p = Math.min(1, Math.max(0, (t - d.delay) / 1.6));
        const y = -200 + (d.floor + 200) * bounce(p);
        ctx.save();
        ctx.translate(d.x, y);
        ctx.rotate(d.spin * p);
        ctx.drawImage(img, -d.size / 2, -d.size / 2, d.size, d.size);
        ctx.restore();
      });
    },
    [mode, name, shortLink],
  );

  // Load images once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const svg = qrRef.current?.querySelector("svg");
      const qrSrc = svg
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`
        : null;
      const [apples, logo, av, qr] = await Promise.all([
        Promise.all(COLORS.map((c) => loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(appleSvg(c))}`))),
        loadImage("/logo-mark.png"),
        avatar ? loadImage(avatar, true) : Promise.resolve(null),
        qrSrc ? loadImage(qrSrc) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      assets.current = { apples, logo, avatar: av, qr };
      setReady(true);
    })();
    const rec = typeof window !== "undefined" && "MediaRecorder" in window;
    const stream = typeof HTMLCanvasElement !== "undefined" && "captureStream" in HTMLCanvasElement.prototype;
    setCanVideo(Boolean(rec && stream));
    return () => {
      cancelled = true;
    };
  }, [avatar]);

  // Show the finished card
  useEffect(() => {
    if (ready) draw(DURATION);
  }, [ready, draw]);

  const deliver = async (blob: Blob, fileName: string) => {
    const file = new File([blob], fileName, { type: blob.type });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file] });
        setStatus("Done! Choose Save to keep it, or share it straight to Instagram or TikTok.");
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          setStatus("");
          return;
        }
      }
    }
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
    setStatus("Downloaded.");
  };

  const saveImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    setBusy("image");
    draw(DURATION);
    canvas.toBlob(async (blob) => {
      if (blob) await deliver(blob, `paytree-${username}.png`);
      else setStatus("Could not create the image. Please try again.");
      setBusy("");
    }, "image/png");
  };

  const saveVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
    const type = types.find((t) => (window.MediaRecorder as typeof MediaRecorder).isTypeSupported?.(t));
    if (!type) {
      setStatus("Your browser cannot record video. Save the image instead.");
      return;
    }
    setBusy("video");
    setStatus("Recording your 5-second video…");
    const stream = (canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    const finished = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.start(250);
    const start = performance.now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = (performance.now() - start) / 1000;
        draw(Math.min(t, DURATION));
        if (t < DURATION + 0.4) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    recorder.stop();
    await finished;
    const blob = new Blob(chunks, { type: type.split(";")[0] });
    await deliver(blob, `paytree-${username}.${type.startsWith("video/mp4") ? "mp4" : "webm"}`);
    setBusy("");
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-[34px] leading-[1.05] text-[#064E3B]">
          {mode === "tip" ? "Tip me card 💸" : "Pay me here card 📸"}
        </h1>
        <p className="mt-1 text-[15px] text-[#3F574C]">
          Made for Instagram Stories, Reels and TikTok. Post it, and put your link in your bio.
        </p>
      </div>

      <div className="flex gap-2" role="radiogroup" aria-label="Card text">
        {(["pay", "tip"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={`inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-bold ${
              mode === m ? "bg-[#064E3B] text-[#FBFBFB]" : "border border-[#DCE5DF] bg-white text-[#064E3B]"
            }`}
          >
            {m === "pay" ? "Pay me here 🌳" : "Tip me 💸"}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="mx-auto w-full max-w-[280px] rounded-[24px] border border-white shadow-[0_24px_50px_-24px_rgba(6,78,59,0.6)]"
        aria-label={`Preview of your ${mode === "tip" ? "Tip me" : "Pay me here"} card`}
      />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={saveImage}
          disabled={!ready || busy !== ""}
          className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#064E3B] px-4 font-bold text-[#FBFBFB] disabled:opacity-60"
        >
          {busy === "image" ? "Saving…" : "Save image"}
        </button>
        {canVideo ? (
          <button
            type="button"
            onClick={saveVideo}
            disabled={!ready || busy !== ""}
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border-2 border-[#064E3B] bg-white px-4 font-bold text-[#064E3B] disabled:opacity-60"
          >
            {busy === "video" ? "Recording…" : "Save video 🎬"}
          </button>
        ) : null}
      </div>
      <p role="status" aria-live="polite" className="min-h-5 text-center text-[13px] font-semibold text-[#064E3B]">
        {status}
      </p>

      {/* Source for the QR image drawn on the canvas */}
      <div ref={qrRef} className="hidden" aria-hidden="true">
        <QRCodeSVG value={link} size={420} level="M" marginSize={1} fgColor="#064E3B" bgColor="#FFFFFF" />
      </div>
    </section>
  );
}

"use client";
// components/dashboard/share-card.tsx
//
// "Pay me here" / "Tip me" card maker for Instagram Stories, Reels and TikTok.
// Draws a 1080x1920 card on a canvas (name, photo, QR code, apples) and saves
// it as a sharp image, or records a 6-second video with music.

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { scheduleTune } from "./card-music";

const W = 1080;
const H = 1920;
const DURATION = 6; // seconds of video

const APPLE_PATH =
  "M32 19c-4-4-12-5-17 0-6 6-5 18 0 26 4 7 9 11 13 10 2-.4 3-1.4 4-1.4s2 1 4 1.4c4 1 9-3 13-10 5-8 6-20 0-26-5-5-13-4-17 0z";
const LEAF_PATH = "M34 13c4-6 11-6 14-4-3 5-9 7-14 4z";
const COLORS = ["#E5484D", "#7BC86C", "#F2C94C"];

function appleSvg(color: string): string {
  // Explicit width/height so phones rasterize it large and sharp.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 64 64"><path d="${APPLE_PATH}" fill="${color}"/><ellipse cx="22" cy="28" rx="4" ry="7" fill="#fff" opacity=".35" transform="rotate(-20 22 28)"/><path d="M32 19c0-5 1-8 3-11" stroke="#6B4A2B" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="${LEAF_PATH}" fill="#3E8E3A"/></svg>`;
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
  // One neat row of apples across the bottom, with space between them.
  const count = 7;
  const gap = W / count;
  return Array.from({ length: count }, (_, i) => ({
    x: gap / 2 + i * gap,
    size: 126,
    color: i % COLORS.length,
    delay: 0.15 + i * 0.18,
    floor: 1790 - (i % 2) * 26,
    spin: ((i % 2 ? 1 : -1) * 14 * Math.PI) / 180,
  }));
}

const FALL = 1.6;
/** Seconds after start when each apple first touches the ground. */
export function landingTimes(drops: Drop[]): number[] {
  return drops.map((d) => d.delay + FALL * 0.55);
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
  const [busy, setBusy] = useState<"" | "image" | "video" | "preview">("");
  const [status, setStatus] = useState("");
  const [canVideo, setCanVideo] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const link = pageUrl ?? `https://paytree.to/${username}`;
  const shortLink = link.replace(/^https?:\/\//, "");

  const draw = useCallback(
    (t: number, still = false) => {
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

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Card fades and rises in
      const cardIn = still ? 1 : Math.min(1, Math.max(0, (t - 1.0) / 1.0));
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

      // Headline, with a gentle heartbeat in the video
      const pulse = still || t < 3 ? 1 : 1 + 0.035 * Math.max(0, Math.sin((t - 3) * 2.4));
      ctx.save();
      ctx.translate(cx, 875);
      ctx.scale(pulse, pulse);
      ctx.font = "800 80px -apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";
      {
        // Each letter in the colors of the falling apples (a touch deeper, for contrast on white).
        const headline = mode === "tip" ? "Tip me 💸" : "Pay me here";
        // First letter of every word is red; the others take the other apple colors.
        const letterColors = ["#E5484D"]; // all red
        const chars = Array.from(headline);
        const widths = chars.map((ch) => ctx.measureText(ch).width);
        let x = -widths.reduce((a, w) => a + w, 0) / 2;
        let colorIndex = 0;
        let wordStart = true;
        ctx.textAlign = "left";
        ctx.shadowColor = "rgba(6,78,59,0.18)";
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        chars.forEach((ch, i) => {
          if (!ch.trim()) {
            wordStart = true;
          } else if (wordStart) {
            ctx.fillStyle = "#E5484D";
            wordStart = false;
          } else {
            ctx.fillStyle = letterColors[colorIndex % letterColors.length];
            colorIndex += 1;
          }
          ctx.fillText(ch, x, 0);
          x += widths[i];
        });
        ctx.shadowColor = "transparent";
        ctx.textAlign = "center";
      }
      ctx.restore();

      // QR code
      if (a.qr) {
        ctx.fillStyle = "#F4F8F6";
        roundRect(ctx, cx - 250, 945, 500, 500, 40);
        ctx.fill();
        // Pixel-sharp QR code
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(a.qr, cx - 210, 985, 420, 420);
        ctx.imageSmoothingEnabled = true;
        // A soft shine sweeps across every few seconds
        if (!still && t > 2.5) {
          const phase = ((t - 2.5) % 3.2) / 1.1;
          if (phase < 1) {
            ctx.save();
            roundRect(ctx, cx - 250, 945, 500, 500, 40);
            ctx.clip();
            const sx = cx - 500 + phase * 1000;
            const g = ctx.createLinearGradient(sx - 120, 945, sx + 120, 1445);
            g.addColorStop(0, "rgba(255,255,255,0)");
            g.addColorStop(0.5, "rgba(255,255,255,0.55)");
            g.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = g;
            ctx.fillRect(cx - 250, 945, 500, 500);
            ctx.restore();
          }
        }
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
        const p = still ? 1 : Math.min(1, Math.max(0, (t - d.delay) / FALL));
        const settled = !still && p >= 1 ? Math.sin((t - d.delay - FALL) * 1.8 + d.x) * 5 : 0;
        const y = -200 + (d.floor + 200) * bounce(p) + settled;
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
    if (ready) draw(DURATION, true);
  }, [ready, draw]);

  /** Opens the phone's share sheet (Instagram, TikTok, Save Video…). Must run right after a tap. */
  const shareFile = async (file: File) => {
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file] });
        setStatus("Shared! 🎉");
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    const href = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = href;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
    setStatus("Downloaded. Open Instagram or TikTok and pick it from your files.");
  };

  const saveImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    draw(DURATION, true);
    if (imageFile) {
      await shareFile(imageFile);
      return;
    }
    setBusy("image");
    canvas.toBlob((blob) => {
      setBusy("");
      if (!blob) {
        setStatus("Could not create the image. Please try again.");
        return;
      }
      setImageFile(new File([blob], `paytree-${username}.png`, { type: "image/png" }));
      setStatus("Your image is ready. Tap Share image.");
    }, "image/png");
  };

  /** Plays the animation with music; records it when `record` is true. */
  const play = async (record: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    let type: string | undefined;
    if (record) {
      const types = [
        "video/mp4;codecs=avc1,mp4a.40.2",
        "video/mp4",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];
      type = types.find((t) => (window.MediaRecorder as typeof MediaRecorder).isTypeSupported?.(t));
      if (!type) {
        setStatus("Your browser cannot record video. Save the image instead.");
        return;
      }
    }
    setBusy(record ? "video" : "preview");
    setStatus(record ? "Recording your video with music… keep this screen open." : "");

    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audio = new AudioCtx();
    await audio.resume();
    const mix = audio.createGain();
    mix.connect(audio.destination);
    const dest = record ? audio.createMediaStreamDestination() : null;
    if (dest) mix.connect(dest);
    const startAt = audio.currentTime + 0.15;
    scheduleTune(audio, mix, startAt, DURATION, landingTimes(drops.current));

    let recorder: MediaRecorder | null = null;
    const chunks: Blob[] = [];
    let finished: Promise<void> = Promise.resolve();
    if (record && type && dest) {
      const video = (canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(30);
      const stream = new MediaStream([...video.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 10_000_000, audioBitsPerSecond: 160_000 });
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      finished = new Promise<void>((resolve) => {
        rec.onstop = () => resolve();
      });
      draw(0);
      rec.start(250);
      recorder = rec;
    }

    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = audio.currentTime - startAt;
        draw(Math.max(0, Math.min(t, DURATION)));
        if (t < DURATION + 0.3) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });

    if (recorder && type) {
      recorder.stop();
      await finished;
      const blob = new Blob(chunks, { type: type.split(";")[0] });
      setVideoFile(new File([blob], `paytree-${username}.${type.startsWith("video/mp4") ? "mp4" : "webm"}`, { type: blob.type }));
      setStatus("Your video is ready! Tap Share video and choose Instagram, TikTok or Save Video.");
    }
    await audio.close().catch(() => null);
    draw(DURATION, true);
    setBusy("");
  };

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-[34px] leading-[1.05] text-[#064E3B]">
          {mode === "tip" ? "Tip me card 💸" : "Pay me here card 📸"}
        </h1>
        <p className="mt-1 text-[15px] text-[#3F574C]">
          Made for Instagram Stories, Reels and TikTok. The video is 6 seconds with our own music. Tip: on TikTok you
          can also add a trending sound.
        </p>
      </div>

      <div className="flex gap-2" role="radiogroup" aria-label="Card text">
        {(["pay", "tip"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => {
              setMode(m);
              setImageFile(null);
              setVideoFile(null);
              setStatus("");
            }}
            className={`inline-flex min-h-10 items-center rounded-full px-4 text-[14px] font-bold ${
              mode === m ? "bg-[#064E3B] text-[#FBFBFB]" : "border border-[#DCE5DF] bg-white text-[#064E3B]"
            }`}
          >
            {m === "pay" ? "Pay me here" : "Tip me 💸"}
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
          {busy === "image" ? "Preparing…" : imageFile ? "Share image 📤" : "Make image"}
        </button>
        {canVideo ? (
          videoFile ? (
            <button
              type="button"
              onClick={() => shareFile(videoFile)}
              disabled={busy !== ""}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#E5484D] px-4 font-bold text-white disabled:opacity-60"
            >
              Share video 📤
            </button>
          ) : (
            <button
              type="button"
              onClick={() => play(true)}
              disabled={!ready || busy !== ""}
              className="inline-flex min-h-[52px] items-center justify-center rounded-full border-2 border-[#064E3B] bg-white px-4 font-bold text-[#064E3B] disabled:opacity-60"
            >
              {busy === "video" ? "Recording…" : "Make video 🎬"}
            </button>
          )
        ) : null}
      </div>
      {imageFile || videoFile ? (
        <p className="rounded-xl bg-[#ECF7F0] px-4 py-3 text-[14px] leading-snug text-[#064E3B]">
          In the share menu, tap <strong>Instagram</strong> or <strong>TikTok</strong> to post it, or{" "}
          <strong>Save</strong> to keep it in your Photos. Don&rsquo;t see them? Tap <strong>More</strong> at the end of the
          app row.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => play(false)}
        disabled={!ready || busy !== ""}
        className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[15px] font-bold text-[#064E3B] underline underline-offset-4 disabled:opacity-60"
      >
        {busy === "preview" ? "Playing…" : "▶ Watch with music 🎵"}
      </button>
      <p role="status" aria-live="polite" className="min-h-5 text-center text-[13px] font-semibold text-[#064E3B]">
        {status}
      </p>

      {/* Source for the QR image drawn on the canvas */}
      <div ref={qrRef} className="hidden" aria-hidden="true">
        <QRCodeSVG value={link} size={840} level="M" marginSize={1} fgColor="#064E3B" bgColor="#FFFFFF" />
      </div>
    </section>
  );
}

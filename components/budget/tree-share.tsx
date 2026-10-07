"use client";
// components/budget/tree-share.tsx
//
// Turns the Money tree into a picture to share on Stories, WhatsApp or TikTok.
// No amounts: only the tree, how it is doing, and paytree.to.

import { useEffect, useRef, useState } from "react";

type Props = {
  /** id of the <svg> drawn by MoneyTree on this page. */
  svgId: string;
  month: string;
  label: string;
  onTree: number;
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function makePicture(svg: SVGSVGElement, month: string, label: string, onTree: number): Promise<Blob | null> {
  // Copy the tree without its animation, so every apple is in place.
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.querySelectorAll("style").forEach((s) => s.remove());
  copy.setAttribute("width", "700");
  copy.setAttribute("height", "846");
  const xml = new XMLSerializer().serializeToString(copy);
  const [tree, logo] = await Promise.all([
    loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`),
    loadImage("/logo-mark.png"),
  ]);
  if (!tree) return null;
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
  bg.addColorStop(0.6, "#F4F3E8");
  bg.addColorStop(1, "#FAF5EA");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";

  ctx.fillStyle = "#9A6E1A";
  ctx.font = `800 34px ${font}`;
  ctx.fillText(`MY MONEY TREE · ${month.toUpperCase()}`, W / 2, 96);
  ctx.fillStyle = "#064E3B";
  ctx.font = `800 76px ${font}`;
  ctx.fillText(label, W / 2, 186);

  ctx.drawImage(tree, (W - 700) / 2, 212, 700, 846);

  ctx.fillStyle = "#1A3326";
  ctx.font = `700 40px ${font}`;
  ctx.fillText(onTree === 1 ? "1 apple on my tree 🍎" : `${onTree} apples on my tree 🍎`, W / 2, 1130);

  // Footer: logo + paytree.to
  ctx.fillStyle = "#064E3B";
  ctx.fillRect(0, H - 120, W, 120);
  ctx.fillStyle = "#FBFBFB";
  ctx.font = `700 36px ${font}`;
  const text = "Grow yours at paytree.to";
  const textW = ctx.measureText(text).width;
  const logoSize = 64;
  const startX = (W - (logoSize + 18 + textW)) / 2;
  if (logo) {
    ctx.fillStyle = "#FAF5EA";
    ctx.beginPath();
    ctx.arc(startX + logoSize / 2, H - 60, logoSize / 2 + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(logo, startX, H - 60 - logoSize / 2, logoSize, logoSize);
  }
  ctx.fillStyle = "#FBFBFB";
  ctx.textAlign = "left";
  ctx.fillText(text, startX + logoSize + 18, H - 47);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export function TreeShare({ svgId, month, label, onTree }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [hint, setHint] = useState("");
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Prepared ahead, because iPhones only open the share sheet right after a tap.
  useEffect(() => {
    const svg = document.getElementById(svgId) as SVGSVGElement | null;
    if (!svg) return;
    let cancelled = false;
    makePicture(svg, month, label, onTree).then((blob) => {
      if (!cancelled && blob) setFile(new File([blob], `my-money-tree-${month.toLowerCase()}.png`, { type: "image/png" }));
    });
    return () => {
      cancelled = true;
    };
  }, [svgId, month, label, onTree]);

  const say = (text: string) => {
    setHint(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setHint(""), 4000);
  };

  async function share() {
    if (!file) return say("One moment, preparing your picture. Tap again.");
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    try {
      if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: "My money tree", text: "My money tree 🌳🍎 Grow yours at https://paytree.to" });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    save();
  }

  function save() {
    if (!file) return say("One moment, preparing your picture. Tap again.");
    const href = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = href;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
    say("Saved. On iPhone, use Share and then Save Image to put it in Photos.");
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={share} className="inline-flex min-h-12 items-center rounded-full bg-[#064E3B] px-6 font-bold text-white">
          Share my tree 📤
        </button>
        <button type="button" onClick={save} className="inline-flex min-h-12 items-center rounded-full bg-[#E3F0EA] px-6 font-bold text-[#064E3B]">
          Save
        </button>
      </div>
      <p className="text-[13px] text-[#4B6358]">The picture shows your tree only, never your amounts.</p>
      {hint ? (
        <p role="status" className="text-[13px] font-semibold text-[#064E3B]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

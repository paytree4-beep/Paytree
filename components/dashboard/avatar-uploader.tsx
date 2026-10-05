"use client";
// components/dashboard/avatar-uploader.tsx
//
// Lets the owner pick a profile photo. The photo is cropped to a square and
// shrunk to 512 x 512 in the browser, then sent as a small JPEG.

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { removeAvatar, uploadAvatar } from "@/app/dashboard/avatar-actions";

const SIZE = 512;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });
}

async function toSquareJpeg(file: File): Promise<Blob> {
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", 0.86),
  );
}

export function AvatarUploader({
  currentUrl,
  initial,
}: {
  currentUrl?: string;
  initial: string;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const shown = preview ?? currentUrl;

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage(null);

    let blob: Blob;
    try {
      blob = await toSquareJpeg(file);
    } catch {
      setMessage({ tone: "error", text: "We could not read that photo. Please choose a JPG or PNG." });
      return;
    }
    const localUrl = URL.createObjectURL(blob);
    setPreview(localUrl);

    startTransition(async () => {
      const data = new FormData();
      data.set("avatar", blob, "avatar.jpg");
      const result = await uploadAvatar(data);
      if (result.ok) {
        setMessage({ tone: "success", text: "Your photo is saved and live on your page." });
        router.refresh();
      } else {
        setPreview(undefined);
        setMessage({ tone: "error", text: result.error });
      }
    });
  };

  const onRemove = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.ok) {
        setPreview(undefined);
        setMessage({ tone: "success", text: "Your photo was removed." });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shown}
            alt="Your profile photo"
            width={80}
            height={80}
            className="h-20 w-20 flex-none rounded-full object-cover ring-4 ring-[#D9B873]/55"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-20 w-20 flex-none items-center justify-center rounded-full bg-[#064E3B] font-serif text-4xl text-[#FBFBFB] ring-4 ring-[#D9B873]/55"
          >
            {initial}
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => input.current?.click()}
            className="inline-flex min-h-11 items-center rounded-full bg-[#064E3B] px-5 font-bold text-[#FBFBFB] disabled:opacity-70"
          >
            {pending ? "Saving…" : currentUrl ? "Change photo" : "Upload photo"}
          </button>
          {currentUrl && !pending ? (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex min-h-11 items-center rounded-full border border-[#064E3B]/40 px-5 font-bold text-[#064E3B]"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        className="sr-only"
        aria-label="Choose a profile photo"
        tabIndex={-1}
      />
      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`text-[15px] ${message.tone === "error" ? "text-[#B42318]" : "text-[#064E3B]"}`}
        >
          {message.text}
        </p>
      ) : (
        <p className="text-[13px] text-[#4B6358]">A square photo or logo works best. It is cropped to a circle.</p>
      )}
    </div>
  );
}

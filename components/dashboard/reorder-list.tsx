"use client";
// components/dashboard/reorder-list.tsx
//
// Drag-to-reorder list of the owner's payment methods. Works with a finger
// or a mouse (hold the handle and drag), and with the up/down buttons for
// anyone who prefers tapping or uses a keyboard. Saves automatically.

import { useRef, useState, useTransition } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { savePaymentOrder } from "@/app/dashboard/payments/actions";

export interface ReorderItem {
  id: string;
  title: string;
  color: string;
}

export function ReorderList({ initial }: { initial: ReorderItem[] }) {
  const [items, setItems] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLOListElement>(null);
  const latest = useRef(items);
  latest.current = items;

  const save = (next: ReorderItem[]) => {
    setStatus("Saving…");
    startTransition(async () => {
      const result = await savePaymentOrder(next.map((i) => i.id));
      setStatus(result.ok ? "Order saved" : "Could not save. Please try again.");
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    save(next);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault();
    const start = latest.current;
    setDragId(id);
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);

    const onMove = (e: PointerEvent) => {
      const list = listRef.current;
      if (!list) return;
      const rows = Array.from(list.querySelectorAll<HTMLLIElement>("li[data-id]"));
      const current = latest.current;
      const from = current.findIndex((i) => i.id === id);
      let to = rows.findIndex((row) => {
        const box = row.getBoundingClientRect();
        return e.clientY < box.top + box.height / 2;
      });
      if (to === -1) to = rows.length - 1;
      else if (to > from) to -= 1;
      if (to !== from && to >= 0) {
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        latest.current = next;
        setItems(next);
      }
    };

    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      handle.removeEventListener("pointercancel", onUp);
      setDragId(null);
      const final = latest.current;
      if (final.map((i) => i.id).join() !== start.map((i) => i.id).join()) save(final);
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  };

  if (items.length < 2) {
    return (
      <p className="text-[15px] text-[#4B6358]">Add at least two payment methods to change their order.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ol ref={listRef} className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li
            key={item.id}
            data-id={item.id}
            className={`flex min-h-[56px] items-center gap-3 rounded-xl border bg-white px-2 transition-shadow ${
              dragId === item.id ? "border-[#064E3B] shadow-[0_10px_24px_-12px_rgba(6,78,59,0.6)]" : "border-[#DCE5DF]"
            }`}
          >
            <button
              type="button"
              aria-label={`Drag to move ${item.title}`}
              onPointerDown={(e) => onPointerDown(e, item.id)}
              className="flex h-11 w-11 flex-none cursor-grab touch-none items-center justify-center rounded-lg text-[#4B6358] active:cursor-grabbing"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="9" cy="6" r="1.6" />
                <circle cx="15" cy="6" r="1.6" />
                <circle cx="9" cy="12" r="1.6" />
                <circle cx="15" cy="12" r="1.6" />
                <circle cx="9" cy="18" r="1.6" />
                <circle cx="15" cy="18" r="1.6" />
              </svg>
            </button>
            <span aria-hidden="true" className="h-3.5 w-3.5 flex-none rounded-full" style={{ backgroundColor: item.color }} />
            <span className="min-w-0 flex-1 truncate font-semibold">{item.title}</span>
            <button
              type="button"
              disabled={index === 0 || pending}
              onClick={() => move(index, index - 1)}
              aria-label={`Move ${item.title} up`}
              className="flex h-11 w-11 flex-none items-center justify-center rounded-lg text-[#064E3B] disabled:opacity-30"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              disabled={index === items.length - 1 || pending}
              onClick={() => move(index, index + 1)}
              aria-label={`Move ${item.title} down`}
              className="flex h-11 w-11 flex-none items-center justify-center rounded-lg text-[#064E3B] disabled:opacity-30"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </li>
        ))}
      </ol>
      <p role="status" aria-live="polite" className="min-h-5 text-[13px] font-semibold text-[#064E3B]">
        {status}
      </p>
    </div>
  );
}

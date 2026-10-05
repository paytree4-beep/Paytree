// lib/stats.ts
//
// Turns the owner's analytics_events rows into simple numbers for the
// dashboard. Runs on the server as the signed-in owner (RLS: own rows only).

import { METHOD_IDS, type MethodId } from "./profiles";

export interface EventRow {
  action: "view" | "open" | "copy";
  method_id: string | null;
  referrer_host: string | null;
  device: string;
  occurred_at: string;
}

export interface Stats {
  days: number;
  views: number;
  taps: number;
  byMethod: { id: MethodId; taps: number }[];
  bySource: { name: string; views: number }[];
  byDevice: { name: string; views: number }[];
  daily: { date: string; views: number; taps: number }[];
}

export function summarize(rows: EventRow[], days: number, now = new Date()): Stats {
  const methodTaps = new Map<MethodId, number>();
  const sources = new Map<string, number>();
  const devices = new Map<string, number>();
  const daily = new Map<string, { views: number; taps: number }>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    daily.set(d, { views: 0, taps: 0 });
  }

  let views = 0;
  let taps = 0;
  for (const row of rows) {
    const day = daily.get(row.occurred_at.slice(0, 10));
    if (row.action === "view") {
      views++;
      if (day) day.views++;
      const source = row.referrer_host ?? "Direct or QR code";
      sources.set(source, (sources.get(source) ?? 0) + 1);
      const device = row.device.charAt(0).toUpperCase() + row.device.slice(1);
      devices.set(device, (devices.get(device) ?? 0) + 1);
    } else {
      taps++;
      if (day) day.taps++;
      const id = METHOD_IDS.find((m) => m === row.method_id);
      if (id) methodTaps.set(id, (methodTaps.get(id) ?? 0) + 1);
    }
  }

  const sorted = <T,>(m: Map<T, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]);
  return {
    days,
    views,
    taps,
    byMethod: sorted(methodTaps).map(([id, n]) => ({ id, taps: n })),
    bySource: sorted(sources).slice(0, 6).map(([name, n]) => ({ name, views: n })),
    byDevice: sorted(devices).map(([name, n]) => ({ name, views: n })),
    daily: [...daily.entries()].map(([date, v]) => ({ date, ...v })),
  };
}

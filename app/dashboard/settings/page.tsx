// app/dashboard/settings/page.tsx
//
// Its own address for the "settings" part of the dashboard, so tapping its tile opens
// at once with the loading screen (like Invoices) instead of waiting silently.

import { type SearchParams } from "@/lib/auth";
import DashboardPage from "../page";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return DashboardPage({ searchParams: Promise.resolve({ ...params, view: "settings" }) });
}

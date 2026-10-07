// app/dashboard/log/page.tsx
//
// The payment log was retired. Money now lives on one page (/dashboard/budget),
// and invoices and split bills are confirmed where they are made. This keeps
// old links and bookmarks working.

import { redirect } from "next/navigation";

export default function PaymentLogMoved() {
  redirect("/dashboard/budget");
}

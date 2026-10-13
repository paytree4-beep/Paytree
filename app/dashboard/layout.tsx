export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-dash">
      <style>{`
.pt-dash:has(main a[class*="min-h-[140px]"]) [class*="min-h-screen"][class*="bg-[#FAF5EA]"]{background:radial-gradient(circle at 50% 6%,#2F6B58 0,#1C4A3A 40%,#123528 100%)!important;color:#fff!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) header{background:#2B6350!important;border:0!important;backdrop-filter:none!important;padding:12px 14px 10px!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) header > div{background:rgba(250,245,234,.1);border:1.5px solid rgba(227,185,60,.5);border-radius:40px;padding:6px 8px 6px 14px}
.pt-dash:has(main a[class*="min-h-[140px]"]) header a[aria-label="PayTree home"]{color:#fff!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) header button{background:transparent!important;border-color:#E3B93C!important;color:#E3B93C!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) main > div > h1{color:#fff!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) main > div > p{color:#CFE6DB!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) main > div > a[class*="bg-[#064E3B]"]{background:#E3B93C!important;color:#17402F!important;box-shadow:0 5px 0 #A98821!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) main h2[class*="text-[#6B7F75]"]{color:#E3B93C!important;letter-spacing:.2em!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) main a[class*="border-[#BFE3CF]"],
.pt-dash:has(main a[class*="min-h-[140px]"]) main a[class*="min-h-[140px]"]{background:#FAF5EA!important;border:2.5px solid #E3B93C!important;box-shadow:0 10px 24px rgba(0,0,0,.3)!important;backdrop-filter:none!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) main div[class*="border-[#D9B873]"]{border-color:#E3B93C!important;color:#17402F!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) header img{background:#FAF5EA;border:3px solid #B9A04A;border-radius:9999px;padding:3px}
.pt-dash:has(main a[class*="min-h-[140px]"]) main div[class*="border-[#D9B873]"] p{color:#5C4513!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) main div[class*="border-[#D9B873]"] strong{color:#064E3B!important}
.pt-dash:has(main a[class*="min-h-[140px]"]) main div[class*="border-[#D9B873]"]:has(> a[href="/dashboard?view=billing"]){display:none!important}
      `}</style>
      {children}
    </div>
  );
}

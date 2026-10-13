////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// app/[username]/layout.tsx
//
// Landing-page look (dark green, gold frames) for public profile pages.
// The rules only apply when the full page with the PayTree footer is shown
// (the :has() check), so the "page paused" screen is not changed.

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-prof">
      <style>{`
.pt-prof:has(footer a[href="/"]) [class*="min-h-screen"][class*="bg-[#FAF5EA]"]{background:radial-gradient(circle at 50% 10%,#2F6B58 0,#1C4A3A 40%,#123528 100%)!important;color:#fff!important}
.pt-prof:has(footer a[href="/"]) header{background:none!important;padding-top:58px!important;color:#fff!important}
.pt-prof:has(footer a[href="/"]) header::before{content:"";position:absolute;left:50%;top:-260px;width:1000px;height:1000px;margin-left:-500px;pointer-events:none;background:repeating-conic-gradient(rgba(227,185,60,.10) 0 6deg,rgba(227,185,60,0) 6deg 18deg);-webkit-mask:radial-gradient(circle,#000 0,transparent 60%);mask:radial-gradient(circle,#000 0,transparent 60%)}
.pt-prof:has(footer a[href="/"]) header img[class*="rounded-full"],
.pt-prof:has(footer a[href="/"]) header span[aria-hidden="true"][class*="rounded-full"]{width:150px!important;height:150px!important;border:7px solid #E3B93C!important;box-shadow:0 0 60px rgba(227,185,60,.4)!important;--tw-ring-shadow:0 0 #0000!important;margin-bottom:10px!important}
.pt-prof:has(footer a[href="/"]) header span[aria-hidden="true"][class*="rounded-full"]{background:#064E3B!important;color:#FAF5EA!important;font-size:5.4rem!important}
.pt-prof:has(footer a[href="/"]) header h1{color:#fff!important}
.pt-prof:has(footer a[href="/"]) header p:first-of-type{color:#F2C94C!important}
.pt-prof:has(footer a[href="/"]) header p + p{color:#EAF3EE!important}
.pt-prof:has(footer a[href="/"]) main section[aria-labelledby^="heading-"] h2{color:#E3B93C!important}
.pt-prof:has(footer a[href="/"]) main section[aria-labelledby^="heading-"] > div p{color:#CFE6DB!important}
.pt-prof:has(footer a[href="/"]) main [class*="min-h-[72px]"]{background:#FAF5EA!important;border:2.5px solid #E3B93C!important;box-shadow:0 8px 20px rgba(0,0,0,.28)!important}
.pt-prof:has(footer a[href="/"]) main [class*="rounded-[18px]"][class*="p-[18px]"]{background:#FAF5EA!important;border:2.5px solid #E3B93C!important;box-shadow:0 8px 20px rgba(0,0,0,.28)!important}
.pt-prof:has(footer a[href="/"]) main div[class*="border-dashed"]{background:#FAF5EA!important;border-color:#E3B93C!important;color:#0B3B2C!important}
.pt-prof:has(footer a[href="/"]) main > p{color:#CFE6DB!important}
.pt-prof:has(footer a[href="/"]) footer{background:rgba(18,53,40,.92)!important;border-color:rgba(227,185,60,.5)!important;color:#F2C94C!important}
.pt-prof:has(footer a[href="/"]) footer a{color:#F2C94C!important}
.pt-prof:has(footer a[href="/"]) button[class*="rounded-full"],
.pt-prof:has(footer a[href="/"]) header a[class*="rounded-full"],
.pt-prof:has(footer a[href="/"]) main a[class*="rounded-full"]{border:3px solid #E3B93C!important;box-shadow:0 0 22px rgba(227,185,60,.35)!important}
      `}</style>
      {children}
    </div>
  );
}

// A light skeleton shown at once while a dashboard page loads: it looks like
// the page is already there, instead of a full-screen spinner.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAF5EA]" role="status" aria-live="polite" aria-label="Loading">
      <div className="border-b border-white/80 px-4 py-3">
        <div className="mx-auto flex max-w-[880px] items-center justify-between">
          <div className="h-8 w-28 animate-pulse rounded-full bg-[#E3EAE5]" />
          <div className="h-11 w-28 animate-pulse rounded-full bg-[#E3EAE5]" />
        </div>
      </div>
      <div className="mx-auto max-w-[560px] space-y-3 px-5 pt-6">
        <div className="h-9 w-2/3 animate-pulse rounded-xl bg-[#E3EAE5]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#EAEFEB]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#EAEFEB]" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#EAEFEB]" />
      </div>
    </div>
  );
}

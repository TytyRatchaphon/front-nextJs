export function CalendarSkeleton() {
  return (
    <div className="mt-4 flex gap-2 overflow-hidden pb-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="h-16 min-w-16 animate-pulse rounded-xl bg-rose-50" />
      ))}
    </div>
  );
}

export function BookListSkeleton() {
  return (
    <div className="flex gap-8 overflow-hidden bg-[#fff1f2] px-6 py-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="w-[260px] shrink-0 animate-pulse">
          <div className="mx-auto mb-6 h-2 w-2 rounded-full bg-rose-200" />
          <div className="aspect-[4/5] rounded-lg bg-rose-100" />
          <div className="mt-4 space-y-2">
            <div className="h-4 w-3/4 rounded-full bg-rose-100" />
            <div className="h-3 w-1/2 rounded-full bg-rose-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

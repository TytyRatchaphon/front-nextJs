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
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#fff1f2] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1180px] gap-5 overflow-hidden">
        {Array.from({ length: 3 }).map((_, columnIndex) => (
          <div key={columnIndex} className="min-w-[286px] flex-1 animate-pulse rounded-[26px] border border-rose-100 bg-white/80 p-4 sm:min-w-[320px]">
            <div className="mb-4 h-8 w-36 rounded bg-rose-200" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-[48px_minmax(0,1fr)] gap-3">
                  <div className="h-16 w-12 rounded-md bg-rose-100" />
                  <div className="space-y-2 pt-1">
                    <div className="h-4 w-11/12 rounded-full bg-rose-100" />
                    <div className="h-3 w-1/2 rounded-full bg-rose-100" />
                    <div className="h-3 w-3/4 rounded-full bg-rose-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const StoryCardSkeleton = () => (
  <div className="relative h-44 w-28 flex-shrink-0 animate-pulse overflow-hidden rounded-lg border border-zinc-800/50 bg-[#1A1A1A] shadow-sm">
    <div className="absolute left-3 top-3 h-10 w-10 rounded-full bg-[#333333]" />
    <div className="absolute bottom-4 left-3 h-3 w-1/2 rounded bg-[#444444]" />
  </div>
);

export default StoryCardSkeleton;

import React from 'react';

const StoryCardSkeleton = () => {
  return (
    <div className="flex-shrink-0 w-28 h-44 rounded-xl bg-[#1A1A1A] animate-pulse relative overflow-hidden border border-zinc-800/50 shadow-sm">
      <div className="absolute top-3 left-3 w-10 h-10 rounded-full bg-[#333333]" />
      <div className="absolute bottom-4 left-3 right-3 h-3 rounded bg-[#333333]" />
      <div className="absolute bottom-4 left-3 w-1/2 h-3 rounded bg-[#444444] animate-pulse" />
    </div>
  );
};

export default StoryCardSkeleton;

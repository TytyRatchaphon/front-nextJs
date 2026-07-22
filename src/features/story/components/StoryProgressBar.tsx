import React from 'react';

interface StoryProgressBarProps {
  totalItems: number;
  currentIndex: number;
  progress: number; // 0 to 100
}

const StoryProgressBar: React.FC<StoryProgressBarProps> = ({ totalItems, currentIndex, progress }) => {
  if (totalItems <= 0) return null;

  return (
    <div className="flex gap-1 w-full px-2 pt-2 pb-4 absolute top-0 z-20">
      {Array.from({ length: totalItems }).map((_, index) => {
        let segmentProgress = 0;
        if (index < currentIndex) {
          segmentProgress = 100;
        } else if (index === currentIndex) {
          segmentProgress = progress;
        }

        return (
          <div key={index} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm shadow-sm">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${segmentProgress}%` }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default StoryProgressBar;

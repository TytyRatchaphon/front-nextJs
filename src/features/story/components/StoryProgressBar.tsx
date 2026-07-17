interface StoryProgressBarProps {
  totalItems: number;
  currentIndex: number;
  progress: number;
}

const StoryProgressBar = ({ totalItems, currentIndex, progress }: StoryProgressBarProps) => {
  if (totalItems <= 0) return null;

  return (
    <div className="absolute top-0 z-20 flex w-full gap-1 px-2 pb-4 pt-2">
      {Array.from({ length: totalItems }, (_, index) => {
        const width = index < currentIndex ? 100 : index === currentIndex ? progress : 0;
        return (
          <div key={index} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full bg-white transition-[width] duration-100 ease-linear" style={{ width: `${width}%` }} />
          </div>
        );
      })}
    </div>
  );
};

export default StoryProgressBar;

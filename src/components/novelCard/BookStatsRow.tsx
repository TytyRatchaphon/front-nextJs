import { formatNumber } from './bookCardUtils';

interface BookStatsRowProps {
  shelveCount?: number;
  viewCount?: number;
  chapterCount?: number;
  /** 'grid-3' for vertical cards, 'flex' for horizontal cards */
  layout?: 'grid-3' | 'flex';
  /** Optional size variant */
  size?: 'sm' | 'md';
}

/* ── Icon paths (inline SVG to avoid extra imports) ── */
const HeartIcon = ({ className = '' }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeIcon = ({ className = '' }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ListIcon = ({ className = '' }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * Shared stats row (heart/shelve, views, chapters) for book cards.
 * Replaces the duplicated SVG icon + formatNumber pattern across 5+ card components.
 */
export function BookStatsRow({
  shelveCount = 0,
  viewCount = 0,
  chapterCount = 0,
  layout = 'grid-3',
  size = 'md',
}: BookStatsRowProps) {
  const textClass = size === 'sm' ? 'text-[10px] md:text-xs' : 'text-xs';
  const iconClass = size === 'sm' ? 'text-gray-500 md:w-4 md:h-4' : 'text-gray-500';

  if (layout === 'grid-3') {
    return (
      <div className={`mt-auto grid grid-cols-3 items-center ${textClass} text-gray-500 w-full`}>
        {/* Left: heart (left aligned) */}
        <div className="flex items-center gap-1 justify-start">
          <HeartIcon className={iconClass} />
          <span className="leading-none">{formatNumber(shelveCount)}</span>
        </div>

        {/* Center: view (centered) */}
        <div className="flex items-center gap-1 justify-center">
          <EyeIcon className={iconClass} />
          <span className="leading-none">{formatNumber(viewCount)}</span>
        </div>

        {/* Right: chapters (right aligned) */}
        <div className="flex items-center gap-1 justify-end">
          <ListIcon className={iconClass} />
          <span className="leading-none">{(chapterCount).toLocaleString()}</span>
        </div>
      </div>
    );
  }

  // flex layout for horizontal cards
  return (
    <div className={`flex items-center gap-3 ${textClass} text-gray-500`}>
      <div className="flex items-center gap-1">
        <EyeIcon className={iconClass} />
        <span>{formatNumber(viewCount)}</span>
      </div>
      <div className="flex items-center gap-1">
        <ListIcon className={iconClass} />
        <span>{(chapterCount).toLocaleString()}</span>
      </div>
    </div>
  );
}

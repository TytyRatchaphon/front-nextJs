import Image from 'next/image';
import SaleGroupSVG from './SaleGroupSvg';

interface BookStatusBadgesProps {
  isBestSeller?: boolean;
  isNew?: boolean;
  discount?: number | string | null;
  ended?: boolean;
  /** Optional size variant for smaller cards */
  size?: 'sm' | 'md';
}

/**
 * Combined status badge renderer for book cards.
 * Handles the bestseller / new / discount / ended badge system
 * that was copy-pasted identically across CardBook, PackCardBook,
 * and PackCardBookHorizontal.
 *
 * Badge placement logic:
 * - BestSeller + Discount → BestSeller left, Discount right
 * - BestSeller only → right (+ ended left if applicable)
 * - New (not ended) → right
 * - Discount only → right (+ ended left if applicable)
 * - Ended only → right
 */
export function BookStatusBadges({
  isBestSeller,
  isNew,
  discount,
  ended,
  size = 'md',
}: BookStatusBadgesProps) {
  let leftBadge: any = null;
  let rightBadge: any = null;

  const pxClass = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textClass = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const saleClass =
    size === 'sm'
      ? 'w-[2.4rem] h-[3.4rem] md:w-[2.8rem] md:h-[3.9rem]'
      : 'w-[2.8rem] h-[3.9rem]';
  const salePos =
    size === 'sm'
      ? 'absolute top-0 right-1 md:top-0 md:right-2 z-20'
      : 'absolute top-0 right-2 z-20';

  // Badge definitions
  const badges = {
    bestSeller: {
      src: '/images/bestseller.png',
      width: 46,
      height: 54,
      className: 'absolute -top-2 -right-0',
    },
    new: {
      src: '/images/new.png',
      width: 50,
      height: 50,
      className: 'absolute top-2 right-1',
    },
    discount: (percent: number | string) => ({
      component: (
        <SaleGroupSVG
          className={`${salePos} drop-shadow-md ${saleClass}`}
          percent={percent}
        />
      ),
    }),
    ended: (pos: 'left' | 'right') => ({
      component: (
        <div
          className={`absolute top-2 ${
            pos === 'left' ? 'left-2' : 'right-2'
          } bg-gradient-to-r from-emerald-400 to-teal-500 text-white ${pxClass} rounded-full ${textClass} font-medium shadow-md z-20`}
        >
          จบแล้ว
        </div>
      ),
    }),
  };

  // Logic Determination (same as original CardBook)
  if (isBestSeller && discount) {
    leftBadge = { ...badges.bestSeller, className: 'absolute -top-[10px] left-2' };
    rightBadge = badges.discount(discount);
  } else if (isBestSeller) {
    rightBadge = badges.bestSeller;
    if (ended) leftBadge = badges.ended('left');
  } else if (isNew && !ended) {
    rightBadge = badges.new;
  } else if (discount) {
    rightBadge = badges.discount(discount);
    if (ended) leftBadge = badges.ended('left');
  } else if (ended) {
    rightBadge = badges.ended('right');
  }

  if (!leftBadge && !rightBadge) return null;

  return (
    <>
      {leftBadge &&
        (leftBadge.component ? (
          leftBadge.component
        ) : (
          <div className={`${leftBadge.className} z-20`}>
            <Image
              src={leftBadge.src}
              alt="badge"
              width={leftBadge.width}
              height={leftBadge.height}
              className="object-contain drop-shadow-md"
            />
          </div>
        ))}
      {rightBadge &&
        (rightBadge.component ? (
          rightBadge.component
        ) : (
          <div className={`${rightBadge.className} z-20`}>
            <Image
              src={rightBadge.src}
              alt="badge"
              width={rightBadge.width}
              height={rightBadge.height}
              className="object-contain drop-shadow-md"
            />
          </div>
        ))}
    </>
  );
}

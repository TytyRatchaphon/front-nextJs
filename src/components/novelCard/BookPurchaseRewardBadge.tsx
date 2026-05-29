import { getBookPurchaseRewardImage } from "@/utils/bookPurchaseReward";

const STATIC_REWARD_BADGE_FALLBACK = "/images/gift_box.png";

type BookPurchaseRewardBadgeProps = {
  book?: Record<string, any> | null;
  avoidBottomOverlay?: boolean;
  className?: string;
};

export function BookPurchaseRewardBadge({
  book,
  avoidBottomOverlay = false,
  className = "",
}: BookPurchaseRewardBadgeProps) {
  const rewardImage = getBookPurchaseRewardImage(book);
  if (!rewardImage) return null;

  const isAnimatedRewardImage = /\.gif(?:[?#].*)?$/i.test(rewardImage);
  const imageSrc = isAnimatedRewardImage ? STATIC_REWARD_BADGE_FALLBACK : rewardImage;

  return (
    <span
      className={[
        "absolute -right-2 z-30 block aspect-square w-[38%] min-w-[40px] max-w-[72px]",
        avoidBottomOverlay ? "bottom-10 md:bottom-11" : "bottom-1",
        className,
      ].filter(Boolean).join(" ")}
      aria-label="EP purchase reward"
    >
      <img
        src={imageSrc}
        alt="EP purchase reward"
        className="h-full w-full object-contain drop-shadow-md"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

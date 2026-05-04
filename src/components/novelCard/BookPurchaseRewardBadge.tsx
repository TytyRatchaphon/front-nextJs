import { getBookPurchaseRewardImage } from "@/utils/bookPurchaseReward";

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

  return (
    <span
      className={[
        "absolute left-1 z-30 block aspect-square w-[22%] min-w-[24px] max-w-[44px]",
        avoidBottomOverlay ? "bottom-10 md:bottom-11" : "bottom-1",
        className,
      ].filter(Boolean).join(" ")}
      aria-label="EP purchase reward"
    >
      <img
        src={rewardImage}
        alt="EP purchase reward"
        className="h-full w-full object-contain drop-shadow-md"
        loading="lazy"
      />
    </span>
  );
}

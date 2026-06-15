import { getBookPurchaseRewardImage } from "@/utils/bookPurchaseReward";
import Image from "next/image";

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
        "absolute -right-2 z-30 block aspect-square w-[38%] min-w-[40px] max-w-[72px]",
        avoidBottomOverlay ? "bottom-10 md:bottom-11" : "bottom-1",
        className,
      ].filter(Boolean).join(" ")}
      aria-label="EP purchase reward"
    >
      <div className="relative w-full h-full">
        <Image
          src={rewardImage}
          alt="EP purchase reward"
          fill
          className="object-contain drop-shadow-md"
          sizes="72px"
          unoptimized
        />
      </div>
    </span>
  );
}

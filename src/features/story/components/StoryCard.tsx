import clsx from "clsx";
import Image from "next/image";
import { useEffect } from "react";

import { useInView } from "@/hooks/useInView";
import { useStoryImpressions } from "../hooks/useStoryImpressions";
import type { StoryGroup } from "../types/storyTypes";
import StoryAvatar from "./StoryAvatar";

interface StoryCardProps {
  group: StoryGroup;
  isOwn?: boolean;
  onClick: () => void;
}

const StoryCard = ({ group, isOwn, onClick }: StoryCardProps) => {
  const { ref, inView } = useInView({ threshold: 0.5 });
  const { registerImpression } = useStoryImpressions();

  useEffect(() => {
    if (inView && group.groupType === "trailer") {
      registerImpression(group.groupType, group.user_id);
    }
  }, [group.groupType, group.user_id, inView, registerImpression]);

  return (
    <div ref={ref} className="h-44 w-28 flex-shrink-0 overflow-hidden rounded-[24px]">
      <button
        type="button"
        onClick={onClick}
        className="group relative isolate block h-full w-full appearance-none overflow-hidden rounded-[24px] border-0 bg-zinc-900 p-0 text-left shadow-sm"
        aria-label={isOwn ? "เปิดสตอรี่ของคุณ" : `เปิดสตอรี่ของ ${group.user?.display_name || "Enjoybook"}`}
      >
      {group.preview?.thumbnail_url ? (
        <Image
          src={group.preview.thumbnail_url}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="112px"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
      <div className="absolute left-3 top-3">
        <div
          className={clsx(
            "relative h-10 w-10 overflow-hidden rounded-full bg-white ring-2 ring-offset-1 ring-offset-black/50",
            group.hasUnseen ? "ring-red-500" : "ring-gray-300",
          )}
        >
          <StoryAvatar src={group.user?.profile_image} alt={group.user?.display_name || ""} />
        </div>
      </div>
      <span className="pointer-events-none absolute bottom-3 left-3 right-3 truncate text-xs font-medium text-white drop-shadow-md">
        {isOwn ? "สตอรี่ของคุณ" : group.user?.display_name || "Enjoybook"}
      </span>
      </button>
    </div>
  );
};

export default StoryCard;

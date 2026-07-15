import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { storyApi } from '../services/storyApi';
import { useStoryStore } from '../stores/storyStore';
import { StoryItemType } from '../types/storyTypes';

interface StoryLikeButtonProps {
  itemType: StoryItemType;
  refId: number;
  isLiked: boolean;
  likeCount?: number | null;
  isOwn?: boolean;
}

const StoryLikeButton: React.FC<StoryLikeButtonProps> = ({ itemType, refId, isLiked, likeCount, isOwn }) => {
  const [isLiking, setIsLiking] = useState(false);
  const toggleItemLike = useStoryStore((state) => state.toggleItemLike);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwn || isLiking) return;

    setIsLiking(true);
    // Optimistic update
    toggleItemLike(refId, itemType, !isLiked);

    try {
      const response = await storyApi.toggleLike(itemType, refId);
      // Update with actual response
      toggleItemLike(refId, itemType, response.is_liked, response.like_count);
    } catch (error) {
      // Revert optimistic update
      toggleItemLike(refId, itemType, isLiked);
      console.error("Failed to toggle like", error);
    } finally {
      setIsLiking(false);
    }
  };

  if (isOwn) return null;

  return (
    <button
      onClick={handleLike}
      className="flex flex-col items-center justify-center text-white drop-shadow-md transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
      disabled={isLiking}
      aria-label={isLiked ? "Unlike story" : "Like story"}
    >
      {isLiked ? (
        <Heart className="w-8 h-8 text-red-500" fill="#ef4444" color="#ef4444" />
      ) : (
        <Heart className="w-8 h-8 text-white" color="white" strokeWidth={2.5} />
      )}
    </button>
  );
};

export default StoryLikeButton;

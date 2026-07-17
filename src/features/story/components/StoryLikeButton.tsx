import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { storyApi } from '../services/storyApi';
import { StoryItemType } from '../types/storyTypes';

interface StoryLikeButtonProps {
  itemType: StoryItemType;
  refId: number;
  isLiked: boolean;
  likeCount?: number | null;
  isOwn?: boolean;
  onLikeChange: (
    refId: number,
    type: StoryItemType,
    isLiked: boolean,
    likeCount?: number | null,
  ) => void;
}

const StoryLikeButton: React.FC<StoryLikeButtonProps> = ({
  itemType,
  refId,
  isLiked,
  isOwn,
  onLikeChange,
}) => {
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOwn || isLiking) return;

    setIsLiking(true);
    // Optimistic update
    onLikeChange(refId, itemType, !isLiked);

    try {
      const response = await storyApi.toggleLike(itemType, refId);
      // Update with actual response
      onLikeChange(refId, itemType, response.is_liked, response.like_count);
    } catch (error) {
      // Revert optimistic update
      onLikeChange(refId, itemType, isLiked);
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

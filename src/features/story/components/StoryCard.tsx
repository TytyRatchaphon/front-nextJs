import React, { useEffect } from 'react';
import Image from 'next/image';
import { StoryGroup } from '../types/storyTypes';
import { useInView } from '@/hooks/useInView';
import { useStoryImpressions } from '../hooks/useStoryImpressions';
import clsx from 'clsx';
import { UserOutlined } from '@ant-design/icons';

interface StoryCardProps {
  group: StoryGroup;
  onClick: () => void;
  isOwn?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({ group, onClick, isOwn }) => {
  const { ref, inView } = useInView({ threshold: 0.5 });
  const { registerImpression } = useStoryImpressions();

  useEffect(() => {
    if (inView && group.groupType === 'trailer') {
      registerImpression(group.groupType, group.user_id);
    }
  }, [inView, group, registerImpression]);

  // Determine avatar ring color based on unseen status
  const ringColor = group.hasUnseen ? 'ring-primary-500' : 'ring-gray-300 dark:ring-gray-600';

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="flex-shrink-0 w-28 h-44 rounded-xl relative overflow-hidden cursor-pointer group bg-zinc-900 shadow-sm"
    >
      {/* Background thumbnail */}
      {group.preview?.thumbnail_url && (
        <Image
          src={group.preview.thumbnail_url}
          alt="story thumbnail"
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="112px"
        />
      )}
      
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

      {/* Avatar */}
      <div className="absolute top-3 left-3">
        <div className={clsx("w-10 h-10 rounded-full overflow-hidden ring-2 ring-offset-1 ring-offset-black/50 bg-white", ringColor)}>
          {group.user?.profile_image ? (
            <Image
              src={group.user.profile_image}
              alt={group.user.display_name || 'User'}
              width={40}
              height={40}
              className="object-cover w-full h-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.srcset = '';
                target.src = '/images/default-avatar.png';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
              <UserOutlined />
            </div>
          )}
        </div>
      </div>



      {/* Display Name */}
      <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
        <p className="text-white text-xs font-medium truncate drop-shadow-md">
          {isOwn ? 'สตอรี่ของคุณ' : group.user?.display_name || 'Enjoybook'}
        </p>
      </div>
    </div>
  );
};

export default StoryCard;

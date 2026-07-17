import Image from 'next/image';
import { X } from 'lucide-react';

import type { StoryGroup } from '../types/storyTypes';

interface StorySidebarProps {
  groups: StoryGroup[];
  currentGroupIndex: number;
  onClose: () => void;
  onSelectGroup: (groupIndex: number) => void;
}

const StorySidebar = ({
  groups,
  currentGroupIndex,
  onClose,
  onSelectGroup,
}: StorySidebarProps) => (
  <div className="w-full h-full bg-[#121212] flex flex-col border-r border-zinc-800">
    <div className="flex items-center p-4 pb-0">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close stories"
        className="w-10 h-10 rounded-full bg-[#3A3B3C] flex items-center justify-center hover:bg-[#4E4F50] active:scale-95 transition-all text-[#E4E6EB] shadow-md -ml-2"
      >
        <X className="w-6 h-6" />
      </button>
    </div>

    <div className="px-4 pb-4 pt-2">
      <h2 className="text-white text-2xl font-bold">Stories</h2>
    </div>

    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
      {groups.map((group, index) => {
        const isActive = index === currentGroupIndex;
        return (
          <button
            type="button"
            key={`${group.groupType}-${group.groupId}`}
            onClick={() => onSelectGroup(index)}
            className={`w-[calc(100%-1rem)] flex items-center gap-3 p-2 mx-2 my-1 rounded-lg text-left transition-colors ${
              isActive ? 'bg-[#3A3B3C]' : 'hover:bg-white/5'
            }`}
          >
            <span className={`w-14 h-14 rounded-full p-[2px] shrink-0 border-2 ${
              group.hasUnseen ? 'border-[#1877F2]' : 'border-gray-500/50'
            }`}>
              <span className="block w-full h-full rounded-full overflow-hidden bg-zinc-800">
                {group.user?.profile_image && (
                  <Image
                    src={group.user.profile_image}
                    alt={group.user.display_name}
                    width={52}
                    height={52}
                    className="w-full h-full object-cover border border-black/10"
                  />
                )}
              </span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-white font-semibold text-sm truncate">
                {group.user?.display_name || 'Enjoybook'}
              </span>
              <span className="block text-gray-400 text-xs mt-0.5">
                {group.totalItems} stories
              </span>
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default StorySidebar;

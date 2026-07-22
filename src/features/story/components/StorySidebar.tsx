import React from 'react';
import { useStoryStore } from '../stores/storyStore';
import { X } from 'lucide-react';
import Image from 'next/image';

const StorySidebar = () => {
  const { groups, currentGroupIndex, openViewer, closeViewer } = useStoryStore();

  return (
    <div className="w-full h-full bg-[#121212] flex flex-col border-r border-zinc-800">
      <div className="flex items-center p-4 pb-0">
        <button 
          onClick={closeViewer} 
          className="w-10 h-10 rounded-full bg-[#3A3B3C] flex items-center justify-center hover:bg-[#4E4F50] active:scale-95 transition-all text-[#E4E6EB] shadow-md -ml-2"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="px-4 pb-4 pt-2">
        <h2 className="text-white text-2xl font-bold">สตอรี่</h2>
        <p className="text-gray-400 text-xs mt-1">รายการที่โหลดใน story bar</p>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
        {groups.map((group, index) => {
          const isActive = index === currentGroupIndex;
          return (
            <div 
              key={`${group.groupType}-${group.groupId}`}
              onClick={() => openViewer(index, [group.preview], 0)}
              className={`flex items-center gap-3 p-2 mx-2 my-1 rounded-lg cursor-pointer transition-colors ${
                isActive ? 'bg-[#3A3B3C]' : 'hover:bg-white/5'
              }`}
            >
              <div className={`w-14 h-14 rounded-full p-[2px] shrink-0 border-2 ${
                group.hasUnseen ? 'border-[#1877F2]' : 'border-gray-500/50'
              }`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800">
                  {group.user?.profile_image && (
                    <Image 
                      src={group.user.profile_image} 
                      alt={group.user.display_name} 
                      width={52} 
                      height={52} 
                      className="w-full h-full object-cover border border-black/10"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.srcset = '';
                        target.src = '/images/default-avatar.png';
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold text-sm truncate">
                  {group.user?.display_name || 'Enjoybook'}
                </h3>
                <p className="text-gray-400 text-xs mt-0.5">
                  {group.totalItems} สตอรี่
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StorySidebar;

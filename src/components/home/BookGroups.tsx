import React from 'react';
import BookSwiper from "@/components/home/BookSwiper";
import ExclusiveSwiper from "@/components/ExclusiveSwiper";
import RecommendSwiper from "@/components/RecommendSwiper";

interface BookGroupsProps {
  groupBookHome: any[];
}

export default function BookGroups({ groupBookHome }: BookGroupsProps) {
  return (
    <div className="w-full mb-12">
      {groupBookHome
        .filter((group: any) => group.type !== 'ranking')
        .sort((a: any, b: any) => {
          const priority: {[key: string]: number} = { 'exclusive': 1, 'recommend': 2 };
          const pA = priority[a.type] || 99;
          const pB = priority[b.type] || 99;
          return pA - pB;
        })
        .map((group: any, index: number) => {
          if (group.type === 'exclusive') {
            return (
              <div key={index} className="mb-12">
                <ExclusiveSwiper 
                  title={group.name_web || group.name} 
                  items={group.list || []} 
                  icon={group.img}
                />
              </div>
            );
          }
          if (group.type === 'recommend') {
            return (
              <div key={index} className="mb-12">
                <RecommendSwiper 
                  title={group.name_web || group.name} 
                  items={group.list || []} 
                  icon={group.img}
                />
              </div>
            );
          }
          return (
            <div key={index} className="mb-12">
              <BookSwiper 
                title={group.name_web || group.name} 
                books={group.list || []} 
                icon={group.img}
              />
            </div>
          );
        })}
    </div>
  );
}

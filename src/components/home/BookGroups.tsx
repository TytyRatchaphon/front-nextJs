import React from 'react';
import BookSwiper from "@/components/home/BookSwiper";
import ExclusiveSwiper from "@/components/swiper/ExclusiveSwiper";
import RecommendSwiper from "@/components/swiper/RecommendSwiper";
import ArticleSwiper from "@/components/swiper/ArticleSwiper";

interface BookGroupsProps {
  groupBookHome: any[];
}

export default function BookGroups({ groupBookHome }: BookGroupsProps) {
  return (
    <div className="w-full mb-8">
      {groupBookHome
        .filter((group: any) => group.type !== 'ranking' && group.type !== 'spotlight' && group.type !== 'new')
        .sort((a: any, b: any) => {
          const priority: { [key: string]: number } = { 'exclusive': 2, 'recommend': 1, 'article': 100 };
          const pA = priority[a.type] || 99;
          const pB = priority[b.type] || 99;
          return pA - pB;
        })
        .map((group: any, index: number) => {
          if (group.type === 'exclusive') {
            return (
              <div key={index} className="-mb-8">
                <ExclusiveSwiper
                  title={group.name_web || group.name}
                  items={group.list || []}
                  icon={group.img}
                  link={group.link || undefined}
                />
              </div>
            );
          }
          if (group.type === 'recommend') {
            return (
              <div key={index} className="-mb-1">
                <RecommendSwiper
                  title={group.name_web || group.name}
                  items={group.list || []}
                  icon={group.img}
                  link={group.link || undefined}
                />
              </div>
            );
          }
          if (group.type === 'article') {
            return (
              <div key={index} className="-mb-1">
                <ArticleSwiper
                  title={group.name_web || group.name}
                  items={group.list || []}
                  icon={group.img}
                  link={group.link || undefined}
                />
              </div>
            );
          }
          return (
            <div key={index} className="-mb-1">
              <BookSwiper
                title={group.name_web || group.name}
                books={group.list || []}
                icon={group.img}
                link={group.link || undefined}
              />
            </div>
          );
        })}
    </div>
  );
}

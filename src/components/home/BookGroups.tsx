import BookSwiper from "@/components/home/BookSwiper";
import TopRanking from "@/components/home/TopRanking";
import ExclusiveSwiper from "@/components/swiper/ExclusiveSwiper";
import RecommendSwiper from "@/components/swiper/RecommendSwiper";
import ArticleSwiper from "@/components/swiper/ArticleSwiper";
import RewardSwiper from "@/components/swiper/RewardSwiper";
import Image from "next/image";
import Link from "next/link";

interface BookGroupsProps {
  groupBookHome: any[];
}

export default function BookGroups({ groupBookHome }: BookGroupsProps) {
  const rewardInitialNow = Date.now();

  return (
    <div className="w-full mb-8">
      {groupBookHome
        .filter((group: any) => group.type !== 'spotlight' && group.type !== 'recommend_admin')
        .sort((a: any, b: any) => {
          const orderA = Number(a?.order_by);
          const orderB = Number(b?.order_by);
          const hasOrderA = Number.isFinite(orderA);
          const hasOrderB = Number.isFinite(orderB);

          if (hasOrderA && hasOrderB && orderA !== orderB) return orderA - orderB;
          if (hasOrderA && !hasOrderB) return -1;
          if (!hasOrderA && hasOrderB) return 1;

          const priority: { [key: string]: number } = { 'exclusive': 2, 'recommend': 1, 'article': 100 };
          const pA = priority[a.type] || 99;
          const pB = priority[b.type] || 99;
          return pA - pB;
        })
        .map((group: any, index: number) => {
          if (group.type === 'ranking') {
            return (
              <div key={index} className="w-full -mt-4">
                <TopRanking rankingGroup={group} />
              </div>
            );
          }
          if (group.type === 'image' && group.img) {
            const imageContent = (
              <div className="w-full mb-6">
                <div className="relative w-full overflow-hidden rounded-xl">
                  <Image
                    src={group.img}
                    alt={group.name_web || group.name || 'home banner'}
                    width={1200}
                    height={300}
                    className="h-auto w-full object-cover"
                  />
                </div>
              </div>
            );

            return group.link ? (
              <Link key={index} href={group.link} target={group.link.startsWith('http') ? '_blank' : undefined} rel={group.link.startsWith('http') ? 'noreferrer' : undefined} className="block">
                {imageContent}
              </Link>
            ) : (
              <div key={index}>{imageContent}</div>
            );
          }
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
          if (group.type === 'reward') {
            return (
              <div key={index} className="-mb-1">
                <RewardSwiper
                  title={group.name_web || group.name}
                  items={group.list || []}
                  icon={group.img}
                  link={group.link || undefined}
                  startDate={group.start_date}
                  endDate={group.end_date}
                  groupId={group.home_group_id}
                  canFollow={group.can_follow}
                  isInitiallyFollowed={group.is_followed}
                  initialNow={rewardInitialNow}
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

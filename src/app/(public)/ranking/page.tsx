import Rank from '@/features/book/Rank';

export const revalidate = 120;

export default function RankPage() {
  return (
    <div className="bg-white min-h-screen pb-10">
      <Rank />
    </div>
  );
}
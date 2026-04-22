// เช็ค Path ให้ถูกว่าไฟล์ NewEpisode อยู่ไหน
import NewChapter from '@/features/mybook/NewEpisode';
import AuthGuard from '@/components/auth/AuthGuard';

interface PageProps {
  params: Promise<{
    groupID: string; // ชื่อต้องตรงกับชื่อโฟลเดอร์ [groupID]
  }>;
}

export default async function Page({ params }: PageProps) {
  // 1. รอรับค่า params ก่อน (Next.js 15)
  const { groupID } = await params;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        {/* 2. ส่ง groupID ไปให้ Component */}
        <NewChapter groupID={groupID} />
      </div>
    </AuthGuard>
  );
}
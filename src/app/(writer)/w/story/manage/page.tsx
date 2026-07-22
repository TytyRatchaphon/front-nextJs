import AuthGuard from '@/features/auth/components/AuthGuard';
import StoryManage from '@/features/story/components/StoryManage';

export default function StoryManagePage() {
  return (
    <AuthGuard>
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <StoryManage />
      </div>
    </AuthGuard>
  );
}

import AuthGuard from '@/components/auth/AuthGuard';
import StoryManage from '@/features/story/components/StoryManage';

export default function StoryManagePage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <StoryManage />
      </div>
    </AuthGuard>
  );
}

import UserProfile from '@/features/user/UserProfile';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <UserProfile userId={id} />;
}

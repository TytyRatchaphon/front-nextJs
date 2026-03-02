import UserProfile from '@/features/user/UserProfile';

export default function Page({ params }: { params: { id: string } }) {
    return <UserProfile userId={params.id} />;
}

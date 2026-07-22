import EditChapter from '@/features/mybook/EditEpisode'
import AuthGuard from '@/features/auth/components/AuthGuard'


interface PageProps {
  params: Promise<{
    epID: string;
  }>
}

async function page({ params }: PageProps) {
  const { epID } = await params;

  return (
    <AuthGuard>
      <EditChapter
        epID={epID}
        groupID=""
      />
    </AuthGuard>
  )
}

export default page
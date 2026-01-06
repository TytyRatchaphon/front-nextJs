import React from 'react'
import EditChapter from '@/features/mybook/EditEpisode'


interface PageProps {
  params: Promise<{
    epID: string; 
  }>
}

async function page({ params }: PageProps) {
  const { epID } = await params;
  
  return (
    <EditChapter 
        epID={epID} 
        groupID="" 
    />
  )
}

export default page
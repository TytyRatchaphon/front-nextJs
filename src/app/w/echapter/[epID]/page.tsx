import React from 'react'
import EditChapter from '@/features/mybook/EditEpisode'


interface PageProps {
  params: {
    epID: string; 
  }
}

// 2. รับ params เข้ามา
function page({ params }: PageProps) {

  return (
    <EditChapter 
        epID={params.epID} 
        groupID="" 
    />
  )
}

export default page
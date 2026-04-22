"use client";
import SevenDaysLogin from '@/components/event/SevenDaysLogin';
import { useWebsiteStore } from '@/stores/websiteStore';

const SevenDaysLoginWrapper = () => {
  const { settings } = useWebsiteStore();

  if (settings?.['7D_Checkin'] !== 'active') {
    return null;
  }

  return (
    <div>
      <SevenDaysLogin />
    </div>
  );
};

export default SevenDaysLoginWrapper;

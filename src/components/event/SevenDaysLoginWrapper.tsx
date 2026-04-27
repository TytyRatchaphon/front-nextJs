"use client";
import SevenDaysLogin from '@/components/event/SevenDaysLogin';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';

const SevenDaysLoginWrapper = () => {
  const { settings } = useWebsiteSettings();

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

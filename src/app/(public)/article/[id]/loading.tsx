import GifLoader from '@/components/utility/GifLoader';

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <GifLoader width={150} height={150} />
      <p className="mt-4 text-sm text-gray-400">กำลังโหลด...</p>
    </div>
  );
}

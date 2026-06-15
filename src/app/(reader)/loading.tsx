export default function ReaderLoading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />
      <p className="mt-4 text-sm text-gray-400">กำลังโหลด...</p>
    </div>
  );
}

import * as React from "react";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Empty, Modal, Spin } from 'antd';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';
import { fetchUserMyBookReportCases } from '@/services/apiServices';

interface Book {
  book_id?: number;
  bookID?: any; // strict string in some contexts
  img?: string;
  name?: string;
  view?: number;
  chapter?: number;
  total_income?: number; // Assumption: API provides this or I default to 0
  status?: string | number; // For "close story" check
  [key: string]: any;
}

interface MyBookCardNewProps {
  book: Partial<Book>;
}

const normalizeBooleanFlag = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'y';
  }
  return false;
};

const extractReportCases = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.reports)) return payload.data.reports;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.cases)) return payload.data.cases;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.cases)) return payload.cases;
  if (Array.isArray(payload?.reports)) return payload.reports;
  return [];
};

const getReportText = (reportCase: any, keys: string[]): string => {
  for (const key of keys) {
    const value = reportCase?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '-';
};

const formatReportDate = (value: unknown): string => {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const MyBookCardNew: React.FC<MyBookCardNewProps> = ({ book }) => {
  const router = useRouter();
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [reportCases, setReportCases] = React.useState<any[]>([]);
  const [reportLoading, setReportLoading] = React.useState(false);
  const [reportLoaded, setReportLoaded] = React.useState(false);

  const imageUrl = resolveBookCoverImageSrc(book, '/images/ejb.png');

  // 2. Format Numbers
  const formatNumber = (num: number) => {
    if (num >= 1000 && num <= 999999) return `${(num / 1000).toFixed(0)}k`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    return num;
  };

  // 3. ID Logic
  const bookParam = book.book_id ? String(book.book_id) : (book.bookID && String(book.bookID).trim() !== "" ? String(book.bookID) : "");
  const hasPendingReportIssue = normalizeBooleanFlag(
    book.status_has_pending_report_issue
      ?? book.has_pending_report_issue
      ?? book.pending_report_issue
      ?? book.hasPendingReportIssue
  );
  const displayStatus = hasPendingReportIssue && book.status === 'publish' ? 'wait' : book.status;

  // 4. Handlers
  const handleCloseStory = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Logic to close/unpublish story - likely just a placeholder or needs API integration
    // User asked to "Design" it, functionality might be separate. 
    // I'll make it a button that looks right.
  };

  const handleOpenStats = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookParam) {
      router.push(`/w/report/${bookParam}`);
    }
  };

  const handleOpenReportCases = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReportModalOpen(true);

    if (!bookParam || reportLoaded || reportLoading) return;

    setReportLoading(true);
    const payload = await fetchUserMyBookReportCases(bookParam, 'pending');
    setReportCases(extractReportCases(payload));
    setReportLoaded(true);
    setReportLoading(false);
  };

  /* handleEdit removed, logic moved to Link onClick */
  const destination = bookParam ? `/w/b/${encodeURIComponent(bookParam)}` : '/w/b';

  const onLinkClick = () => {
    if (bookParam) {
      try {
        sessionStorage.setItem(`editBook_${bookParam}`, JSON.stringify(book));
      } catch { }
    }
  }

  return (
    <div
      className="w-[168px] flex-shrink-0 relative group"
    >
      <Link
        href={destination}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onLinkClick}
        className="absolute inset-0 z-[1]"
      />
      {/* Cover Image */}
      <div className="relative w-full h-[237px] mb-2 overflow-hidden rounded-lg shadow-sm">
        <Image
          src={imageUrl}
          alt={book.name || 'Book Cover'}
          fill
          className="object-cover"
        />
        {hasPendingReportIssue && (
          <button
            type="button"
            onClick={handleOpenReportCases}
            className="absolute left-2 top-2 z-10 inline-flex max-w-[calc(100%-16px)] items-center gap-1 rounded-full border border-red-400 bg-red-50/95 px-2.5 py-1 text-[11px] font-semibold text-red-800 shadow-sm backdrop-blur transition hover:bg-red-100"
          >
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
            <span className="truncate">ถูกรายงาน</span>
          </button>
        )}
      </div>

      {/* Info Section */}
      <div className="flex flex-col gap-1">
        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 line-clamp-2 min-h-[3rem] hover:!text-red-600 transition-colors duration-300" title={book.name}>
          {book.name || 'No Title'}
        </h3>

        {/* Stats Row: Views & Chapters */}
        <div className="flex items-center justify-between text-gray-500 text-base">
          {/* Views */}
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{formatNumber(book.view || 0)}</span>
          </div>

          {/* Chapters */}
          <div className="flex items-center gap-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-base">{book.chapter || 0}</span>
          </div>
        </div>

        {/* Income Row */}
        <div className="flex items-center justify-between text-[13px] text-gray-700 mt-1 whitespace-nowrap">
          <span className="flex-shrink-0">รายได้ทั้งหมด</span>
          <span className="font-bold truncate ml-2" title={(book.total_income || 0).toLocaleString()}>
            {(book.total_income || 0).toLocaleString()}
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-1 relative z-10">
          <button
            onClick={handleCloseStory}
            className={`px-3 py-0.5 !text-white text-base rounded ${
              displayStatus === 'publish'
                ? 'bg-green-500 hover:bg-green-600'
                : displayStatus === 'wait'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            {displayStatus === 'publish'
              ? 'เปิดเรื่อง'
              : displayStatus === 'wait'
                ? 'รอตรวจสอบ'
                : 'ปิดเรื่อง'}
          </button>

          <div
            onClick={handleOpenStats}
            className="text-base text-black hover:text-red-500 font-medium flex items-center"
          >
            สถิติ {'>'}{'>'}{'>'}
          </div>
        </div>
      </div>

      <Modal
        open={reportModalOpen}
        onCancel={() => setReportModalOpen(false)}
        footer={null}
        title={null}
        centered
        width={560}
      >
        <div className="space-y-5 pt-2">
          <div className="border-b border-red-100 pb-4">
            <div className="mb-2 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">
              ถูกรายงาน
            </div>
            <h3 className="text-xl font-bold text-gray-900">รายการรายงานของเรื่องนี้</h3>
            <p className="mt-1 text-sm text-gray-500">
              ทีมงานกำลังตรวจสอบรายการรายงานที่เกี่ยวข้องกับเรื่องนี้ นักเขียนสามารถดูรายละเอียดก่อนแก้ไขหรือส่งตรวจซ้ำได้
            </p>
          </div>

          {reportLoading ? (
            <div className="flex justify-center py-10">
              <Spin />
            </div>
          ) : reportCases.length > 0 ? (
            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {reportCases.map((reportCase, index) => (
                <div key={reportCase.id ?? reportCase.report_id ?? index} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {getReportText(reportCase.type, ['title'])}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        รายงาน #{getReportText(reportCase, ['report_id', 'id'])}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                      ถูกรายงาน
                    </span>
                  </div>
                  <div className="space-y-2 text-sm leading-6 text-gray-600">
                    <p>
                      <span className="font-medium text-gray-800">เหตุผล: </span>
                      {getReportText(reportCase.reason, ['title'])}
                    </p>
                    <p>
                      <span className="font-medium text-gray-800">รายละเอียด: </span>
                      {getReportText(reportCase.reason, ['description'])}
                    </p>
                    {reportCase.admin_note ? (
                      <p className="rounded-md bg-white px-2 py-1 text-amber-800">
                        <span className="font-medium">หมายเหตุจากแอดมิน: </span>
                        {reportCase.admin_note}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-500 sm:grid-cols-2">
                    <span>วันที่รายงาน: {formatReportDate(reportCase.created_at)}</span>
                    <span>อัปเดตล่าสุด: {formatReportDate(reportCase.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="ยังไม่มีรายละเอียดรายงานที่แสดงได้" />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default MyBookCardNew;

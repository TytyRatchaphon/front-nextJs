import CurrencyIcon, {
  getCurrencyIconSrc,
  type CurrencyIconSettings,
} from '@/components/common/CurrencyIcon';

export const HISTORY_TABS = [
  'ประวัติการเติมเหรียญ',
  'ประวัติการใช้เหรียญ',
  'ประวัติ REDEEM',
  'กิจกรรมกล่องสุ่มปริศนา',
  'ประวัติการได้รับเหรียญเพิ่มเติม',
  'ประวัติการแลกของขวัญ',
  'ประวัติการซื้อสินค้า',
];

export const defaultHistoryColumns = [
  { title: 'วัน/เดือน/ปี', dataIndex: 'date', key: 'date', width: 180 },
  { title: 'รายละเอียดสินค้า', dataIndex: 'detail', key: 'detail' },
  { title: 'ราคา', dataIndex: 'price', key: 'price', width: 120, align: 'right' as const },
  { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 140, align: 'center' as const },
];

interface CreateHistoryColumnsOptions {
  activeKey: string;
  settings?: CurrencyIconSettings | null;
}

export const createHistoryColumns = ({
  activeKey,
  settings,
}: CreateHistoryColumnsOptions) => {
  if (activeKey === '1') {
    return [
      { title: 'เลขที่รายการ', dataIndex: 'paymentID', key: 'paymentID', width: 220 },
      { title: 'วัน-เวลา', dataIndex: 'date', key: 'date', width: 200 },
      { title: 'Status', dataIndex: 'status', key: 'status', width: 140, align: 'center' as const },
      { title: 'Total', dataIndex: 'price', key: 'price', width: 120, align: 'right' as const },
      { title: 'Detail', dataIndex: 'detail', key: 'detail', width: 120, align: 'center' as const },
    ];
  }

  if (activeKey === '2') {
    return [
      { title: 'วัน-เวลา', dataIndex: 'date', key: 'date', width: 220 },
      {
        title: 'ชื่อเรื่อง',
        dataIndex: 'bookTitle',
        key: 'bookTitle',
        render: (text: any, record: any) => (
          <div style={{ whiteSpace: 'nowrap' }}>{text ?? record?.raw?.BookTran?.name ?? ''}</div>
        ),
      },
      {
        title: 'ชื่อตอน',
        dataIndex: 'epTitle',
        key: 'epTitle',
        width: 240,
        render: (text: any, record: any) => (
          <div style={{ whiteSpace: 'nowrap' }}>{text ?? record?.raw?.BookTranEp?.name ?? ''}</div>
        ),
      },
      {
        title: 'Total',
        dataIndex: 'total',
        key: 'total',
        width: 140,
        align: 'right' as const,
        render: (text: any, record: any) => (
          <div className="flex items-center justify-end gap-2">
            <span>{text}</span>
            <CurrencyIcon type={record.type} settings={settings} size={18} />
          </div>
        ),
      },
    ];
  }

  if (activeKey === '3') {
    return [
      { title: 'วัน-เวลา', dataIndex: 'date', key: 'date', width: 220 },
      { title: 'Redeem Code', dataIndex: 'code', key: 'code', width: 200 },
      { title: 'รางวัล', dataIndex: 'name', key: 'name', render: (text: any) => <span>{text}</span> },
      {
        title: 'จำนวน',
        dataIndex: 'unit',
        key: 'unit',
        width: 140,
        align: 'right' as const,
        render: (unit: any, record: any) => {
          const type = record?.type ?? '';

          return (
            <div className="flex items-center justify-end gap-2">
              <span>{unit}</span>
              <CurrencyIcon type={type} settings={settings} size={18} />
            </div>
          );
        },
      },
    ];
  }

  if (activeKey === '4') {
    return [
      { title: 'วันที่ได้รับ', dataIndex: 'date', key: 'date', width: 220 },
      {
        title: 'รางวัล',
        dataIndex: 'gift_value',
        key: 'gift_value',
        align: 'center' as const,
        render: (val: any, record: any) => {
          const type = record?.gift_type ?? '';
          const value = val ?? record?.gift_value ?? '';

          return (
            <div className="flex items-center justify-center gap-2">
              <span className="text-center">{value}</span>
              <CurrencyIcon type={type} settings={settings} size={18} fallback="stamp" />
            </div>
          );
        },
      },
    ];
  }

  if (activeKey === '5') {
    return [
      { title: 'วันที่ได้รับ', dataIndex: 'date', key: 'date', width: 220 },
      { title: 'เงื่อนไข', dataIndex: 'condition', key: 'condition', width: 160 },
      {
        title: 'ประเภท',
        dataIndex: 'currency',
        key: 'currency',
        align: 'center' as const,
        render: (val: any, record: any) => {
          const cur = (val ?? record?.currency ?? '').toLowerCase();

          return (
            <div className="flex items-center justify-center gap-2">
              <CurrencyIcon type={cur} settings={settings} size={18} />
            </div>
          );
        },
      },
      { title: 'จำนวน', dataIndex: 'unit', key: 'unit', width: 120, align: 'right' as const },
      { title: 'หมายเหตุ', dataIndex: 'note', key: 'note' },
    ];
  }

  if (activeKey === '6') {
    return [
      { title: 'วัน-เวลา', dataIndex: 'date', key: 'date', width: 220 },
      { title: 'รายละเอียด', dataIndex: 'detail', key: 'detail' },
      { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 140, align: 'center' as const },
      { title: 'เพิ่มเติม / Tracking Number', dataIndex: 'extra', key: 'extra', width: 200 },
    ];
  }

  if (activeKey === '7') {
    return [
      { title: 'วัน-เวลา', dataIndex: 'date', key: 'date', width: 140 },
      { title: 'สินค้า', dataIndex: 'name', key: 'name', width: 180 },
      {
        title: 'ราคา',
        dataIndex: 'price',
        key: 'price',
        width: 120,
        align: 'right' as const,
        render: (val: any, record: any) => {
          if (typeof val === 'string') {
            const parts = val.split(',').map((part) => part.trim());

            return (
              <div className="flex flex-col items-end gap-1">
                {parts.map((part, idx) => {
                  const [amount, currency] = part.split(' ');
                  const curLower = (currency || '').toLowerCase();
                  const src = getCurrencyIconSrc(curLower, settings, false);

                  if (src) {
                    return (
                      <div key={idx} className="flex items-center justify-end gap-1">
                        <span className="text-gray-700 font-medium">{Number(amount).toLocaleString()}</span>
                        <CurrencyIcon type={curLower} settings={settings} size={16} fallback={false} />
                      </div>
                    );
                  }

                  return <span key={idx} className="text-gray-700 font-medium">{part}</span>;
                })}
              </div>
            );
          }

          return (
            <div className="flex items-center justify-end gap-2">
              <span>{Number(val).toLocaleString()}</span>
              {getCurrencyIconSrc(record.des, settings, false) ? (
                <CurrencyIcon type={record.des} settings={settings} size={18} fallback={false} />
              ) : (
                <span className="text-gray-500 text-xs">THB</span>
              )}
            </div>
          );
        },
      },
    ];
  }

  return defaultHistoryColumns;
};

export const createStoreHistoryExpandable = (settings?: CurrencyIconSettings | null) => ({
  expandRowByClick: true,
  expandedRowRender: (record: any) => {
    if (!record.items || record.items.length === 0) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">
          รายละเอียดสินค้าในรายการนี้
        </h4>
        <div className="flex flex-col gap-2">
          {record.items.map((item: any, i: number) => {
            const currency = (item.currency_cached || '').toLowerCase();

            return (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-gray-700 font-medium">{item.pack_name_cached}</span>
                  <span className="text-gray-400 text-xs">x {item.quantity}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-gray-800">
                    {Number(item.final_price || item.total_price).toLocaleString()}
                  </span>
                  <CurrencyIcon type={currency} settings={settings} size={16} fallback={false} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
  rowExpandable: (record: any) => record.items && record.items.length > 0,
});

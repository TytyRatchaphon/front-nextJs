import * as React from "react";
import { useState, useMemo } from 'react';
import { Select, Button, DatePicker } from 'antd';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import GifLoader from '@/components/utility/GifLoader';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface MyBookStatsTabProps {
  myBooks: any[];
  token: string | null;
}

const MyBookStatsTab: React.FC<MyBookStatsTabProps> = ({ myBooks, token }) => {
  const [statsSelectedBooks, setStatsSelectedBooks] = useState<any[]>([]);
  const [statsCategory, setStatsCategory] = useState('จำนวนครั้งที่อ่าน');
  const [statsSearched, setStatsSearched] = useState(false);
  // Independent date range state for stats
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs().startOf('month'), dayjs()]);

  // Metric param
  const metricParam = useMemo(() => (statsCategory === 'รายได้' ? 'income' : 'read'), [statsCategory]);

  // Formatted range
  const formattedStatsRange = useMemo(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      const s = (dateRange[0] as any).startOf ? (dateRange[0] as any).startOf('day').format('YYYY-MM-DD') : dayjs(dateRange[0]).startOf('day').format('YYYY-MM-DD');
      const e = (dateRange[1] as any).endOf ? (dateRange[1] as any).endOf('day').format('YYYY-MM-DD') : dayjs(dateRange[1]).endOf('day').format('YYYY-MM-DD');
      return [s, e];
    }
    const end = dayjs();
    const start = end.startOf('day').subtract(13, 'day');
    return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
  }, [dateRange]);

  const bookIdsParam = useMemo(() => {
    if (!Array.isArray(statsSelectedBooks) || statsSelectedBooks.length === 0) return '';
    return statsSelectedBooks.join(',');
  }, [statsSelectedBooks]);

  // Reset searched flag when filters change
  React.useEffect(() => {
    setStatsSearched(false);
  }, [statsSelectedBooks, statsCategory, dateRange]);

  const { data: bookStatsResponse = null, isLoading: isLoadingBookStats, isFetching: isFetchingBookStats, refetch: refetchBookStats } = useQuery({
    queryKey: ['bookStats', bookIdsParam, metricParam, formattedStatsRange[0], formattedStatsRange[1]],
    queryFn: async () => {
      if (!bookIdsParam) return null;
      try {
        const params: Record<string, string> = {
          book_id: bookIdsParam,
          metric: metricParam,
          start: formattedStatsRange[0],
          end: formattedStatsRange[1],
          groupBy: 'day',
        };
        const res = await apiClient.get('/bookstats', { params });
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!token && !!bookIdsParam,
  });

  // Transform data
  const { statsChartData, statsSeriesKeys } = useMemo(() => {
    const dataRows: Record<string, any> = {};
    const seriesKeys: string[] = [];
    try {
      const d = bookStatsResponse?.data ?? bookStatsResponse;
      if (!d || !Array.isArray(d.books)) return { statsChartData: [], statsSeriesKeys: [] };
      for (const book of d.books) {
        const bookName = String(book.name ?? book.title ?? `#${book.book_id ?? book.bookID ?? book.id}`);
        seriesKeys.push(bookName);
        if (Array.isArray(book.series)) {
          for (const point of book.series) {
            const date = point.date || point.x || point[0];
            const value = Number(point.value ?? point.y ?? 0) || 0;
            if (!date) continue;
            if (!dataRows[date]) dataRows[date] = { date };
            dataRows[date][bookName] = value;
          }
        }
      }
      const rows = Object.keys(dataRows).sort().map(dk => dataRows[dk]);
      return { statsChartData: rows, statsSeriesKeys: seriesKeys };
    } catch {
      return { statsChartData: [], statsSeriesKeys: [] };
    }
  }, [bookStatsResponse]);

  return (
    <div className='py-6'>
      {/* Search Bar for Statistics */}
      <div className='flex gap-4 mb-6 flex-wrap'>
        <Select
          mode="multiple"
          placeholder={'เลือกนิยายที่ต้องการวิเคราะห์'}
          value={statsSelectedBooks}
          onChange={(vals) => setStatsSelectedBooks(vals)}
          className='flex-1'
          style={{ minWidth: '200px' }}
          options={Array.isArray(myBooks) ? myBooks.map((b: any) => ({
            label: b.name ?? b.title ?? b.book_name ?? '-',
            value: b.book_id ?? b.id ?? b._id,
          })) : []}
          optionFilterProp="label"
          allowClear
        />
        <Select
          value={statsCategory}
          onChange={setStatsCategory}
          style={{ width: 150 }}
        >
          <Option value="จำนวนครั้งที่อ่าน">จำนวนครั้งที่อ่าน</Option>
          <Option value="รายได้">รายได้</Option>
        </Select>
        <RangePicker
          placeholder={['วันที่สั่งซื้อ', 'วันที่สิ้นสุด']}
          value={dateRange}
          onChange={setDateRange}
          style={{ width: 300 }}
        />
        <Button
          type="primary"
          danger
          loading={isLoadingBookStats || isFetchingBookStats}
          style={{
            backgroundColor: '#E31C3D',
            borderColor: '#E31C3D',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FF4D6D';
            e.currentTarget.style.borderColor = '#FF4D6D';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#E31C3D';
            e.currentTarget.style.borderColor = '#E31C3D';
          }}
            onClick={() => {
            try {
              setStatsSearched(true);
              if (typeof refetchBookStats === 'function') refetchBookStats();
            } catch {
            }
          }}
          disabled={isLoadingBookStats || isFetchingBookStats}
        >
          ค้นหา
        </Button>
      </div>

      {/* Statistics Content Area */}
      <div className='py-6'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>{statsCategory}</h3>
          <div style={{ width: '100%', height: 400 }}>
            {!statsSearched ? (
              <div className='text-center text-gray-500 py-16'>กรุณากดค้นหาเพื่อแสดงกราฟ</div>
            ) : isLoadingBookStats ? (
              <GifLoader className="h-96" width={100} height={100} />
            ) : statsChartData && statsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={statsChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                  {statsSeriesKeys.map((k: string, i: number) => (
                    <Line key={k} type="monotone" dataKey={k} stroke={["#4ade80", "#818cf8", "#60a5fa", "#f59e0b", "#ef4444"][i % 5]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className='text-center text-gray-500 py-16'>ไม่มีข้อมูลสำหรับการเลือกนี้</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookStatsTab;

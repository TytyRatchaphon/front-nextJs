import React, { useState, useMemo } from 'react';
import { Button, Table, Pagination, DatePicker, notification } from 'antd';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

interface MyBookSalesTabProps {
  token: string | null;
}

const MyBookSalesTab: React.FC<MyBookSalesTabProps> = ({ token }) => {
  const [salesDateRange, setSalesDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([dayjs().startOf('month'), dayjs()]);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const formattedSalesRange = useMemo(() => {
    if (salesDateRange && salesDateRange[0] && salesDateRange[1]) {
      const s = (salesDateRange[0] as any).startOf ? (salesDateRange[0] as any).startOf('day').format('YYYY-MM-DD HH:mm:ss') : dayjs(salesDateRange[0]).startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const e = (salesDateRange[1] as any).endOf ? (salesDateRange[1] as any).endOf('day').format('YYYY-MM-DD HH:mm:ss') : dayjs(salesDateRange[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss');
      return [s, e];
    }
    const end = dayjs();
    const start = end.startOf('day').subtract(13, 'day');
    return [start.format('YYYY-MM-DD HH:mm:ss'), end.format('YYYY-MM-DD HH:mm:ss')];
  }, [salesDateRange]);

  const { data: salesResponse = null, isLoading: isLoadingSales, refetch: refetchSales } = useQuery({
    queryKey: ['salesReport', formattedSalesRange[0], formattedSalesRange[1], currentPage],
    queryFn: async () => {
      try {
        const params = {
          start: formattedSalesRange[0],
          end: formattedSalesRange[1],
          page: currentPage,
        } as Record<string, any>;

        const res = await apiClient.get('/sales-report', { params });
        return res.data;
      } catch {
        return [];
      }
    },
    enabled: !!token,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        start: formattedSalesRange[0],
        end: formattedSalesRange[1],
      } as Record<string, string>;

      const res = await apiClient.get('/sales-report/export', { params, responseType: 'blob' as const });

      const contentType = res.headers?.['content-type'] || res.headers?.['Content-Type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });

      let filename = `sales-report-${formattedSalesRange[0]}_to_${formattedSalesRange[1]}.xlsx`;
      const cd = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'];
      if (cd) {
        try {
          const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^;\"\n]+)"?/);
          if (m && m[1]) filename = decodeURIComponent(m[1]);
        } catch {
          // ignore
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      api.success({ message: 'เริ่มดาวน์โหลดไฟล์ Excel' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'ไม่สามารถดาวน์โหลดไฟล์ได้';
      api.error({ message: msg });
    } finally {
    }
  };

  const paginationData = useMemo(() => {
    // API structure check: data.data.total, data.data.limit, etc.
    const d = salesResponse?.data;
    if (d) {
        return {
            total: d.total ?? d.pagination?.total ?? 0,
            limit: d.limit ?? d.pagination?.limit ?? 20,
            page: d.page ?? d.pagination?.page ?? 1
        };
    }
    return { total: 0, limit: 20, page: 1 };
  }, [salesResponse]);

  const salesColumns: ColumnsType<{ key: any; name: any; coin_sales_total: any; freecoin_sales_total: any; revenue: any; }> = useMemo(() => [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => {
        const pageSize = paginationData.limit || 20;
        return (currentPage - 1) * pageSize + index + 1;
      },
    },
    {
      title: 'เรื่อง',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'ยอดเหรียญ',
      dataIndex: 'coin_sales_total',
      key: 'coin_sales_total',
      align: 'right',
      render: (v: any) => {
        const n = Number(v) || 0;
        return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },
    {
      title: 'ยอดถุงเงิน',
      dataIndex: 'freecoin_sales_total',
      key: 'freecoin_sales_total',
      align: 'right',
      render: (v: any) => {
        const n = Number(v) || 0;
        return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },
    {
      title: 'รายได้ (บาท)',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right',
      render: (v: any, record: any) => {
        const raw = v ?? record.total ?? record.income ?? record.revenue ?? record.amount ?? record.total_money ?? record.money ?? 0;
        const n = Number(raw) || 0;
        return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },
  ], [currentPage, paginationData]);

  const salesRows: any[] = useMemo(() => {
    if (!salesResponse) return [];
    const d = salesResponse;
    if (Array.isArray(d)) return d as any[];
    if (Array.isArray(d.data)) return d.data as any[];
    if (Array.isArray(d.items)) return d.items as any[];
    if (d.data && Array.isArray((d.data as any).books)) return (d.data as any).books;
    if (Array.isArray((d as any).books)) return (d as any).books;
    if (d.data && Array.isArray((d.data as any).rows)) return (d.data as any).rows;
    if (d.data && Array.isArray((d.data as any).items)) return (d.data as any).items;
    return [];
  }, [salesResponse]);

  const salesTotals = useMemo(() => {
    if (!salesResponse) return null;
    const d = salesResponse;
    return d?.data?.totals ?? null;
  }, [salesResponse]);



  const salesData = useMemo(() => {
    console.log('Calculating salesData. Rows count:', salesRows.length, 'Page:', currentPage);
    if (!Array.isArray(salesRows)) return [];
    
    return salesRows.map((r: any, idx: number) => ({
      key: r.book_id || r.id || r._id || `sales-${currentPage}-${idx}`, 
      name: r.name ?? r.title ?? r.book_name ?? '-',
      coin_sales_total: r.coin_sales_total ?? r.coin_sales ?? r.coin_sales_total_amount ?? 0,
      freecoin_sales_total: r.freecoin_sales_total ?? r.freecoin_sales ?? r.freecoin_sales_total_amount ?? 0,
      revenue: r.income_baht ?? r.total ?? r.income ?? r.revenue ?? r.amount ?? r.total_money ?? r.money ?? 0,
    }));
  }, [salesRows, currentPage]);

  return (
    <div className='py-6'>
      {contextHolder}
      {/* Date Range Filter */}
      <div className='flex items-center justify-between gap-4 mb-6 flex-wrap'>
        <div className='flex items-center gap-4'>
          <span className='text-sm'>วันที่เริ่มต้น - วันที่สิ้นสุด</span>
          <RangePicker showTime 
            value={salesDateRange}
            onChange={setSalesDateRange}
            style={{ width: 400 }}
            format="YYYY-MM-DD HH:mm:ss"
          />
        </div>

        <div className='flex items-center gap-3'>
          <Button
            type="primary"
            danger
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
                if (typeof refetchSales === 'function') refetchSales();
              } catch {
              }
            }}
            disabled={isLoadingSales}
          >
            ค้นหา
          </Button>

          <Button
            loading={exporting}
            onClick={handleExport}
            style={{
              backgroundColor: '#28a745',
              borderColor: '#28a745',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#218838';
              e.currentTarget.style.borderColor = '#1e7e34';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#28a745';
              e.currentTarget.style.borderColor = '#28a745';
            }}
          >
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Section Title */}
      <h3 className='text-lg font-semibold mb-4'>รวมทุกเรื่อง</h3>

      {/* Sales Table */}
      <Table
        columns={salesColumns}
        dataSource={salesData}
        pagination={false}
        className='mb-6'
      />

      {/* Summary Row */}
      <div className='border-t border-gray-200 pt-3 pb-3 mb-6'>
        <div className='flex items-center justify-between gap-4 flex-col md:flex-row'>
          <div className='flex items-center gap-4'>
            <div className='text-sm text-gray-600 whitespace-nowrap'>รวมยอดขาย</div>

            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 border border-yellow-200'>
                <Image src="/images/e-coin.png" alt="Coins" width={20} height={20} />
                <span className='text-sm font-medium'>{salesTotals ? (Number(salesTotals.coin_sales_total || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
              </div>

              <div className='flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200'>
                <Image src="/images/money-bag.png" alt="Freecoin" width={20} height={20} />
                <span className='text-sm font-medium'>{salesTotals ? (Number(salesTotals.freecoin_sales_total || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
              </div>
            </div>
          </div>

          <div className='text-right mt-3 md:mt-0'>
            <div className='text-sm text-gray-600'>รวมรายได้</div>
            <div className='text-lg font-semibold'>
              {salesTotals ? (Number(salesTotals.overall_income_baht ?? salesTotals.total_income_baht ?? salesTotals.overall_income ?? salesTotals.income_baht ?? 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} บาท
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className='flex justify-center'>
        <Pagination
          current={currentPage}
          onChange={setCurrentPage}
          total={paginationData.total}
          pageSize={paginationData.limit || 20}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default MyBookSalesTab;

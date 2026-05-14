import * as React from "react";
import { useState, useMemo } from 'react';
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

type SalesMetricDefinition = {
  key: 'coin_sales_total' | 'freecoin_sales_total' | 'fast_ticket_total' | 'fast_coin_total';
  title: string;
  rowAliases: string[];
  totalAliases: string[];
  icon: string;
  iconAlt: string;
  badgeClassName: string;
  summaryLabel?: string;
};

const salesMetricDefinitions: SalesMetricDefinition[] = [
  {
    key: 'coin_sales_total',
    title: 'ยอดเหรียญ',
    rowAliases: ['coin_sales_total', 'coin_sales', 'coin_sales_total_amount'],
    totalAliases: ['coin_sales_total', 'coin_sales', 'total_coin_sales', 'total_coin_sales_total'],
    icon: '/images/e-coin.png',
    iconAlt: 'Coins',
    badgeClassName: 'bg-yellow-50 border-yellow-200',
  },
  {
    key: 'freecoin_sales_total',
    title: 'ยอดถุงเงิน',
    rowAliases: ['freecoin_sales_total', 'freecoin_sales', 'freecoin_sales_total_amount'],
    totalAliases: ['freecoin_sales_total', 'freecoin_sales', 'total_freecoin_sales', 'total_freecoin_sales_total'],
    icon: '/images/money-bag.png',
    iconAlt: 'Freecoin',
    badgeClassName: 'bg-red-50 border-red-200',
  },
  {
    key: 'fast_ticket_total',
    title: 'ยอดใช้ Fast Ticket',
    rowAliases: ['fast_ticket_total', 'fast_ticket'],
    totalAliases: ['fast_ticket_total', 'fast_ticket', 'total_fast_ticket', 'total_fast_ticket_total'],
    icon: '/images/fast_ticket.png',
    iconAlt: 'Fast Ticket',
    badgeClassName: 'bg-blue-50 border-blue-200',
    summaryLabel: 'ยอดใช้ Fast Ticket',
  },
  {
    key: 'fast_coin_total',
    title: 'ยอดใช้ Fast Coin',
    rowAliases: ['fast_coin_total', 'fast_coin'],
    totalAliases: ['fast_coin_total', 'fast_coin', 'total_fast_coin', 'total_fast_coin_total'],
    icon: '/images/e-coin.png',
    iconAlt: 'Fast Coin',
    badgeClassName: 'bg-purple-50 border-purple-200',
    summaryLabel: 'ยอดใช้ Fast Coin',
  },
];

const revenueAliases = ['income_baht', 'total', 'income', 'revenue', 'amount', 'total_money', 'money'];
const totalRevenueAliases = ['overall_income_baht', 'total_income_baht', 'overall_income', ...revenueAliases];

const hasOwnValue = (source: unknown, key: string) => {
  return Boolean(source && typeof source === 'object' && Object.prototype.hasOwnProperty.call(source, key));
};

const getFirstPresentValue = (source: unknown, aliases: string[]) => {
  if (!source || typeof source !== 'object') {
    return { found: false, value: undefined as unknown };
  }

  const record = source as Record<string, unknown>;
  const alias = aliases.find((key) => hasOwnValue(record, key));
  return alias ? { found: true, value: record[alias] } : { found: false, value: undefined as unknown };
};

const formatMoney = (value: unknown) => {
  const n = Number(value) || 0;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const MyBookSalesTab: React.FC<MyBookSalesTabProps> = ({ token }) => {
  const [salesDateRange, setSalesDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const formattedSalesRange = useMemo(() => {
    if (salesDateRange && salesDateRange[0] && salesDateRange[1]) {
      // Keep exact datetime selected by user.
      const s = dayjs(salesDateRange[0]).format('YYYY-MM-DD HH:mm:ss');
      const e = dayjs(salesDateRange[1]).format('YYYY-MM-DD HH:mm:ss');
      return [s, e];
    }
    const end = dayjs().endOf('day');
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
      setExporting(false);
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

  const visibleSalesMetrics = useMemo(() => {
    return salesMetricDefinitions.filter((metric) => {
      const totalValue = getFirstPresentValue(salesTotals, metric.totalAliases);
      if (totalValue.found) return true;

      return salesRows.some((row) => getFirstPresentValue(row, metric.rowAliases).found);
    });
  }, [salesRows, salesTotals]);

  const showRevenueColumn = useMemo(() => {
    if (getFirstPresentValue(salesTotals, totalRevenueAliases).found) return true;
    return salesRows.some((row) => getFirstPresentValue(row, revenueAliases).found);
  }, [salesRows, salesTotals]);

  const summaryTotals = useMemo(() => {
    const totals = salesTotals ?? {};
    const sumFromRows = (aliases: string[]) =>
      salesRows.reduce((acc: number, row: any) => {
        const rowValue = getFirstPresentValue(row, aliases);
        return acc + (Number(rowValue.value) || 0);
      }, 0);

    const metricTotals = visibleSalesMetrics.reduce<Record<string, number>>((acc, metric) => {
      const totalValue = getFirstPresentValue(totals, metric.totalAliases);
      acc[metric.key] = Number(totalValue.found ? totalValue.value : sumFromRows(metric.rowAliases)) || 0;
      return acc;
    }, {});

    const revenueTotalValue = getFirstPresentValue(totals, totalRevenueAliases);
    const overallIncomeBaht = Number(revenueTotalValue.found ? revenueTotalValue.value : sumFromRows(revenueAliases)) || 0;

    return {
      metricTotals,
      overallIncomeBaht,
    };
  }, [salesTotals, salesRows, visibleSalesMetrics]);



  const salesData = useMemo(() => {
    if (!Array.isArray(salesRows)) return [];
    
    return salesRows.map((r: any, idx: number) => {
      const row: Record<string, unknown> = {
        key: r.book_id || r.id || r._id || `sales-${currentPage}-${idx}`,
        name: r.name ?? r.title ?? r.book_name ?? '-',
      };

      visibleSalesMetrics.forEach((metric) => {
        row[metric.key] = getFirstPresentValue(r, metric.rowAliases).value;
      });

      if (showRevenueColumn) {
        row.revenue = getFirstPresentValue(r, revenueAliases).value;
      }

      return row;
    });
  }, [salesRows, currentPage, visibleSalesMetrics, showRevenueColumn]);

  const salesColumns: ColumnsType<any> = useMemo(() => {
    const columns: ColumnsType<any> = [
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
      ...visibleSalesMetrics.map((metric) => ({
        title: metric.title,
        dataIndex: metric.key,
        key: metric.key,
        align: 'right' as const,
        render: (value: unknown) => formatMoney(value),
      })),
    ];

    if (showRevenueColumn) {
      columns.push({
        title: 'รายได้ (บาท)',
        dataIndex: 'revenue',
        key: 'revenue',
        align: 'right',
        render: (value: unknown) => formatMoney(value),
      });
    }

    return columns;
  }, [currentPage, paginationData, showRevenueColumn, visibleSalesMetrics]);

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
            disabled={exporting}
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
              {visibleSalesMetrics.map((metric) => (
                <div key={metric.key} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${metric.badgeClassName}`}>
                  <Image src={metric.icon} alt={metric.iconAlt} width={20} height={20} />
                  <span className='text-sm font-medium'>
                    {metric.summaryLabel ? `${metric.summaryLabel}: ` : ''}
                    {formatMoney(summaryTotals.metricTotals[metric.key])}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {showRevenueColumn && (
            <div className='text-right mt-3 md:mt-0'>
              <div className='text-sm text-gray-600'>รวมรายได้</div>
              <div className='text-lg font-semibold'>
                {formatMoney(summaryTotals.overallIncomeBaht)} บาท
              </div>
            </div>
          )}
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

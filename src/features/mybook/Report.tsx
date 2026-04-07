"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Image as AntdImage, DatePicker, Table, Button, Segmented, Empty } from 'antd';
import { EyeOutlined, UnorderedListOutlined, BookOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { fetchBookStats, fetchBookAnalytics, fetchBookEpisodesStats, EpisodeStats, PurchaseItem } from '@/services/apiServices';
import { useWebsiteStore } from '@/stores/websiteStore';
import { useShallow } from 'zustand/react/shallow';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';

const { RangePicker } = DatePicker;

// Mock Data Interfaces
interface BookInfo {
    title: string;
    author: string;
    description: string;
    cover: string;
    views: number;
    chapters: number;
    bookmarks: number;
}

interface StatsData {
    totalRevenue: number;
    hearts: number;
    flowers: number;
    readCount: number;
    comments: number;
    reviews: number;
    bookshelf: number;
}

interface ChartDataPoint {
    date: string;
    sales: number;
    reads: number;
}

// Mock Data
const initialStats: StatsData = {
    totalRevenue: 0,
    hearts: 0,
    flowers: 0,
    readCount: 0,
    comments: 0,
    reviews: 0,
    bookshelf: 0
};



// Components
const StatCard = ({ title, value }: { title: string; value: number }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center shadow-sm">
        <span className="text-gray-700 font-medium">{title}</span>
        <span className="text-red-500 font-bold text-lg">{value.toLocaleString()}</span>
    </div>
);

export default function Report({ bookId }: { bookId: string }) {
    const [activeTab, setActiveTab] = useState('list');
    const [bookInfo, setBookInfo] = useState<BookInfo | null>(null);
    const [stats, setStats] = useState<StatsData>(initialStats);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [episodesStats, setEpisodesStats] = useState<EpisodeStats[]>([]);
    const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(7, 'd'), dayjs()]);
    const [, setLoading] = useState(true);

    const { settings } = useWebsiteStore(useShallow((state) => ({ settings: state.settings })));

    const loadAnalytics = React.useCallback(async (start: string, end: string) => {
        const analyticsData = await fetchBookAnalytics(bookId, start, end);
        if (analyticsData) {
            setChartData(analyticsData.map(item => ({
                date: item.date,
                sales: item.sales_count,
                reads: item.reads_count
            })));
        }

        const episodesData = await fetchBookEpisodesStats(bookId, start, end);
        if (episodesData) {
            setEpisodesStats(episodesData.total_data);
            setPurchaseList(episodesData.total_purchase_list);
        }
    }, [bookId]);

    const handleDateSearch = () => {
        if (dateRange && dateRange[0] && dateRange[1]) {
            loadAnalytics(dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'));
        }
    };

    React.useEffect(() => {
        const loadData = async () => {
            if (!bookId) return;
            setLoading(true);
            const data = await fetchBookStats(bookId);
            if (data) {
                setBookInfo({
                    title: data.name,
                    author: data.writer_name,
                    description: data.title, // Using title as description based on screenshot mapping
                    cover: resolveBookCoverImageSrc(
                        {
                            img: data.img,
                            img_full: data.img_full,
                            img_gif: (data as any).img_gif,
                            img_gif_full: (data as any).img_gif_full,
                        },
                        '/images/book.png',
                        'book',
                    ),
                    views: data.total_views,
                    chapters: data.total_episodes,
                    bookmarks: data.shelve_count
                });
                setStats({
                    totalRevenue: data.sales.total,
                    hearts: data.reactions.hearts,
                    flowers: data.reactions.flowers,
                    readCount: data.total_views, // Using views as readCount
                    comments: data.comments,
                    reviews: data.reviews,
                    bookshelf: data.shelve_count
                });
            }
            setLoading(false);
        };
        loadData();
        // Initial load for analytics
        loadAnalytics(dayjs().subtract(7, 'd').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD'));
    }, [bookId, loadAnalytics]);

    // Calucalate Totals for Header
    const totalCoin = React.useMemo(() => episodesStats.reduce((acc, curr) => acc + (curr.sales_coin || 0), 0), [episodesStats]);
    const totalFreeCoin = React.useMemo(() => episodesStats.reduce((acc, curr) => acc + (curr.sales_freecoin || 0), 0), [episodesStats]);
    const totalIncome = React.useMemo(() => episodesStats.reduce((acc, curr) => acc + (curr.total_income || 0), 0), [episodesStats]);

    const totalColumns: ColumnsType<EpisodeStats> = [
        {
            title: 'ชื่อตอน',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'ยอดอ่าน (ครั้ง)',
            dataIndex: 'read_count',
            key: 'read_count',
            sorter: (a, b) => a.read_count - b.read_count,
            render: (val) => val?.toLocaleString(),
        },
        {
            title: (
                <div className="flex items-center gap-1">
                    {settings?.coin ? <Image src={settings.coin} alt="coin" width={20} height={20} unoptimized /> : 'Coins'}
                </div>
            ),
            dataIndex: 'sales_coin',
            key: 'sales_coin',
            sorter: (a, b) => a.sales_coin - b.sales_coin,
            render: (val) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        },
        {
            title: (
                <div className="flex items-center gap-1">
                    {settings?.freecoin ? <Image src={settings.freecoin} alt="free_coin" width={20} height={20} unoptimized /> : 'Free Coins'}
                </div>
            ),
            dataIndex: 'sales_freecoin',
            key: 'sales_freecoin',
            sorter: (a, b) => a.sales_freecoin - b.sales_freecoin,
            render: (val) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        },
        {
            title: 'ยอดรวม (บาท)',
            dataIndex: 'total_income',
            key: 'total_income',
            sorter: (a, b) => a.total_income - b.total_income,
            render: (val) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        },
    ];

    const purchaseColumns: ColumnsType<PurchaseItem> = [
        {
            title: 'วัน-เวลา',
            dataIndex: 'date',
            key: 'date',
            sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            render: (val) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-',
        },
        {
            title: 'ชื่อตอน',
            dataIndex: 'ep_name',
            key: 'ep_name',
        },
        {
            title: 'ชื่อผู้ใช้',
            dataIndex: 'user_name',
            key: 'user_name',
        },
        {
            title: 'ราคา (Coins)',
            dataIndex: 'price',
            key: 'price',
            sorter: (a, b) => a.price - b.price,
            render: (val, record) => (
                <div className="flex items-center gap-1">
                    <span>{(val || 0).toLocaleString()}</span>
                    {record.type === 'coin' && settings?.coin && (
                        <Image src={settings.coin} alt="coin" width={16} height={16} unoptimized />
                    )}
                    {record.type === 'freecoin' && settings?.freecoin && (
                        <Image src={settings.freecoin} alt="freecoin" width={16} height={16} unoptimized />
                    )}
                </div>
            ),
        },
        {
            title: 'รายได้ (บาท)',
            dataIndex: 'income',
            key: 'income',
            sorter: (a, b) => a.income - b.income,
            render: (val) => (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        },
    ];

    return (
        <div className="min-h-screen bg-white p-6 md:p-12 font-primary">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-6 items-start border-b pb-8">
                    {bookInfo ? (
                        <>
                            <div className="w-32 h-44 relative shrink-0 rounded-lg overflow-hidden shadow-md">
                                <AntdImage
                                    src={bookInfo.cover || '/images/book.png'}
                                    alt={bookInfo.title}
                                    className="rounded-lg shadow-md object-cover border border-gray-100"
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <h1 className="text-2xl font-bold text-gray-900">{bookInfo.title}</h1>
                                    <Button href={`/w/b/${bookId}`} target="_blank" rel="noopener noreferrer">ดูข้อมูล</Button>
                                </div>
                                <p className="text-gray-600">โดย : <span className="text-black font-semibold">{bookInfo.author}</span></p>
                                <p className="text-gray-500">{bookInfo.description}</p>
                                <div className="flex gap-4 text-gray-500 text-sm mt-4">
                                    <span className="flex items-center gap-1"><EyeOutlined /> {bookInfo.views}</span>
                                    <span className="flex items-center gap-1"><UnorderedListOutlined /> {bookInfo.chapters}</span>
                                    <span className="flex items-center gap-1"><BookOutlined /> {bookInfo.bookmarks}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-44 flex items-center justify-center bg-gray-50 rounded-lg">
                            Loading...
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                {/* Stats Grid */}
                <div className="space-y-4">
                    {/* Row 1: 3 Items */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard title="รายได้ทั้งหมด" value={stats.totalRevenue} />
                        <StatCard title="หัวใจ" value={stats.hearts} />
                        <StatCard title="ดอกไม้" value={stats.flowers} />
                    </div>

                    {/* Row 2: 4 Items */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="ยอดอ่าน" value={stats.readCount} />
                        <StatCard title="คอมเม้น" value={stats.comments} />
                        <StatCard title="รีวิว" value={stats.reviews} />
                        <StatCard title="เก็บเข้าชั้น" value={stats.bookshelf} />
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white rounded-xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-gray-800">สถิติและแนวโน้ม (Analytics)</h2>
                        <div className="flex gap-2">
                            <RangePicker
                                value={dateRange}
                                onChange={(dates) => {
                                    if (dates && dates[0] && dates[1]) {
                                        setDateRange([dates[0], dates[1]]);
                                    }
                                }}
                            />
                            <Button type="primary" danger onClick={handleDateSearch}>ค้นหา</Button>
                        </div>
                    </div>

                    <div className="flex justify-center gap-6 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-red-400 inline-block"></span> ยอดซื้อ (ครั้ง)
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 inline-block"></span> ยอดอ่าน (ครั้ง)
                        </div>
                    </div>

                    <div className="h-[400px] w-full border border-gray-100 rounded-lg p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#eee" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="sales" stroke="#ff7875" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="ยอดซื้อ" />
                                <Line type="monotone" dataKey="reads" stroke="#52c41a" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="ยอดอ่าน" />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="text-right text-xs text-gray-400 mt-2">ข้อมูลล่าสุดเมื่อ {dayjs().format('DD/MM/YYYY HH:mm')}</div>
                    </div>
                </div>

                {/* Table Section */}
                <div>
                    <div className="flex flex-col md:flex-row justify-between items-end mb-4 border-b pb-4">
                        <div>
                            <h3 className="text-lg font-bold mb-2">ทั้งหมด {activeTab === 'list' ? purchaseList.length : episodesStats.length} รายการ</h3>
                            <div className="flex gap-2">
                                <Segmented
                                    options={[
                                        { label: 'ยอดรวม', value: 'total' },
                                        { label: 'รายการซื้อ', value: 'list' },
                                    ]}
                                    value={activeTab}
                                    onChange={(value) => setActiveTab(value as string)}
                                />
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                            <div className="flex items-center justify-end gap-4 text-xl font-bold mb-1">
                                <span className="flex items-center gap-1">ยอดรวม</span>
                                <span className="flex items-center gap-1 text-yellow-500">
                                    {totalCoin.toLocaleString()}
                                    {settings?.coin && <Image src={settings.coin} alt="C" width={20} height={20} unoptimized />}
                                </span>
                                <span className="flex items-center gap-1 text-red-500">
                                    {totalFreeCoin.toLocaleString()}
                                    {settings?.freecoin && <Image src={settings.freecoin} alt="F" width={20} height={20} unoptimized />}
                                </span>
                            </div>
                            <div className="text-xl font-bold">ยอดรวมรายได้ {totalIncome.toLocaleString()} บาท</div>
                        </div>
                    </div>

                    {activeTab === 'total' ? (
                        episodesStats.length > 0 ? (
                            <Table
                                columns={totalColumns}
                                dataSource={episodesStats}
                                rowKey="ep_id"
                                pagination={{ pageSize: 10 }}
                            />
                        ) : (
                            <Empty />
                        )
                    ) : (
                        purchaseList.length > 0 ? (
                            <Table
                                columns={purchaseColumns}
                                dataSource={purchaseList}
                                rowKey="id"
                                pagination={{ pageSize: 10 }}
                            />
                        ) : (
                            <Empty />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

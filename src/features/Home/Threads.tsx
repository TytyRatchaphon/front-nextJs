"use client";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchThreads, createThread, deleteThread } from '@/services/apiServices';
import { App, Pagination, Select, Tabs, Modal, Input, Button, Form } from 'antd';
import GifLoader from '@/components/utility/GifLoader';
import Link from 'next/link';
import 'next/image';
import { ClockCircleOutlined, EyeOutlined, MessageOutlined, FireOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import TextEditor from '@/components/utility/TextEditor';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useEffect } from 'react';
import { queryKeys } from '@/constants/query';

dayjs.locale('th');

const ThreadTypes = [
  { id: 0, name: 'ทั้งหมด', color: 'gray', icon: <FireOutlined /> },
  { id: 1, name: 'สารทุกข์-สุขดิบ', color: 'blue', borderColor: 'border-blue-400', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { id: 2, name: 'เมาท์เรื่องนิยาย', color: 'yellow', borderColor: 'border-yellow-400', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
  { id: 3, name: 'การ์ตูนดีบอกต่อ', color: 'green', borderColor: 'border-green-400', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  { id: 4, name: 'เรื่องหลอนๆสายมืด', color: 'red', borderColor: 'border-red-800', bgColor: 'bg-red-50', textColor: 'text-red-800' }, 
];

// Helper to get type info
const getTypeInfo = (typeId: number) => {
  return ThreadTypes.find(t => t.id === typeId) || ThreadTypes[1];
};

type InitialThreadResponse = Awaited<ReturnType<typeof fetchThreads>>;

interface ThreadsProps {
  initialThreadResponse?: InitialThreadResponse;
}

export default function Threads({ initialThreadResponse }: ThreadsProps) {
  const [activeType, setActiveType] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { notification } = App.useApp();
  const messageApi = {
    success: (content: unknown) => notification.success({ message: String(content ?? '') }),
    error: (content: unknown) => notification.error({ message: String(content ?? '') }),
    warning: (content: unknown) => notification.warning({ message: String(content ?? '') }),
    info: (content: unknown) => notification.info({ message: String(content ?? '') }),
  };
  const { token } = useAuthStore() as any;
  const { openLoginModal } = useUIStore();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        const uid = decoded.user_id || decoded.id || decoded.sub || decoded.userId;
        setCurrentUserId(Number(uid));
      } catch {
      }
    }
  }, [token]);

  const { data: threadResponse, isLoading } = useQuery({
    queryKey: queryKeys.threads.list(activeType, page, sort),
    queryFn: () => fetchThreads({ 
      page, 
      limit: 9, 
      type: activeType === 0 ? undefined : activeType, 
      sort 
    }),
    initialData: activeType === 0 && page === 1 && sort === 'newest' ? (initialThreadResponse ?? undefined) : undefined,
    initialDataUpdatedAt: activeType === 0 && page === 1 && sort === 'newest' && initialThreadResponse ? Date.now() : undefined,
    staleTime: 60 * 1000,
  });

  const createThreadMutation = useMutation({
    mutationFn: createThread,
    onSuccess: () => {
      messageApi.success('ตั้งกระทู้สำเร็จ');
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.listRoot() });
    },
    onError: () => {
      messageApi.error('เกิดข้อผิดพลาดในการตั้งกระทู้');
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: deleteThread,
    onSuccess: () => {
      messageApi.success('ลบกระทู้สำเร็จ');
      queryClient.invalidateQueries({ queryKey: queryKeys.threads.listRoot() });
    },
    onError: () => {
        messageApi.error('เกิดข้อผิดพลาดในการลบกระทู้');
    }
  });

  void deleteThreadMutation;


  const threads = threadResponse?.data?.list || [];
  const pagination = threadResponse?.data?.paginate;

  const handleTypeChange = (key: string) => {
    setActiveType(Number(key));
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleCreateThread = (values: any) => {
    const payload = {
      title: values.title,
      rate: values.rating,
      author: values.penname,
      type: String(values.category),
      tag: Array.isArray(values.tags) ? values.tags.join(',') : values.tags,
      detail: values.content
    };
    createThreadMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
       <style jsx>{`
        :global(.ant-tabs-tab:hover) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover svg) {
          fill: #dc2626 !important;
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active svg) {
          fill: #dc2626 !important;
          color: #dc2626 !important;
        }
        :global(.ant-tabs-ink-bar) {
          background: #dc2626 !important;
        }
      `}</style>
      
       {/* Modal Create Thread */}
       <Modal
          title={<span className="text-xl font-bold">ตั้งกระทู้</span>}
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          width={800}
          destroyOnHidden
          footer={[
            <div key="footer" className="flex justify-center gap-4">
               <Button key="cancel" onClick={() => setIsModalOpen(false)} style={{ borderRadius: '20px', padding: '0 30px' }}>
                 ยกเลิก
               </Button>
               <Button key="submit" type="primary" onClick={form.submit} className="bg-[#E53935] hover:bg-[#d32f2f]" style={{ borderRadius: '20px', padding: '0 30px', border: 'none' }}>
                 บันทึก
               </Button>
            </div>
          ]}
       >
         <Form 
           form={form} 
           layout="vertical"
           className="mt-4"
           onFinish={handleCreateThread}
           initialValues={{ rating: 'all' }}
         >
            <Form.Item label="ชื่อกระทู้" name="title" rules={[{ required: true, message: 'กรุณากรอกชื่อกระทู้' }]}>
               <Input placeholder="ชื่อกระทู้" />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Form.Item label="นามปากกา" name="penname" rules={[{ required: true, message: 'กรุณากรอกนามปากกา' }]}>
                 <Input placeholder="นามปากกา" />
               </Form.Item>
               <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="ระดับเนื้อหา" name="rating" rules={[{ required: true }]}>
                    <Select options={[
                      { value: 'all', label: 'ทุกวัย' },
                      { value: 'nc', label: 'อายุ 18 ปีขึ้นไป' },
                    ]} />
                  </Form.Item>
                  <Form.Item label="หมวดหมู่" name="category" rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}>
                    <Select options={ThreadTypes.filter(t => t.id !== 0).map(t => ({ value: t.id, label: t.name }))} />
                  </Form.Item>
               </div>
            </div>

            <Form.Item label="แท็ก" name="tags" rules={[{ required: true, message: 'กรุณาระบุแท็ก' }]}>
               <Select mode="tags" placeholder="กรุณาระบุแท็ก" />
            </Form.Item>

            <Form.Item label="เนื้อหา" name="content" rules={[{ required: true, message: 'กรุณากรอกเนื้อหา' }]}>
               <TextEditor height={300} />
            </Form.Item>
         </Form>
       </Modal>

       {/* Header Banner - Pinkish Background */}
       <div className="bg-[#FFD1D1] relative h-[250px] md:h-[300px] flex items-center justify-center overflow-hidden mb-8">
          {/* Mascot (Placeholder) */}
          <div className="absolute left-4 md:left-20 bottom-0 w-32 md:w-48 h-32 md:h-48">
              <div className="w-full h-full bg-white rounded-t-full shadow-lg relative">
                 <div className="absolute top-10 left-8 w-4 h-4 bg-black rounded-full"></div>
                 <div className="absolute top-10 right-8 w-4 h-4 bg-black rounded-full"></div>
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-4 bg-pink-300 rounded-b-full"></div>
                 <div className="absolute bottom-10 left-4 text-pink-300 text-xl">{'///'}</div>
                 <div className="absolute bottom-10 right-4 text-pink-300 text-xl">{'///'}</div>
              </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-[#E53935] drop-shadow-sm">
            กระทู้
          </h1>

          <div className="absolute right-4 top-4">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-red-500">
               <span className="text-[10px] text-center font-bold leading-tight">Enjoy<br/>Book</span>
             </div>
          </div>
       </div>

       <div className="max-w-[1200px] mx-auto px-4">
          
          {/* Toolbar: Tabs & Sort */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
             {/* Tabs */}
             <Tabs
                activeKey={String(activeType)}
                onChange={handleTypeChange}
                items={ThreadTypes.map(type => ({
                  key: String(type.id),
                  label: (
                    <span className="flex items-center gap-2 text-base md:text-lg">
                      {activeType === type.id && <span className="text-red-500">◈</span>}
                      {type.name}
                    </span>
                  )
                }))}
                className="w-full md:w-auto flex-1 [&_.ant-tabs-nav]:mb-0"
             />

             {/* Sort & Create Button */}
             <div className="flex items-center gap-3">
               <button 
                 className="flex items-center gap-2 bg-[#E53935] hover:bg-[#d32f2f] text-white px-4 py-1.5 rounded-full font-medium transition-colors shadow-sm text-base"
                 style={{ color: '#ffffff' }}
                 onClick={() => {
                    if (!token) {
                        openLoginModal();
                        return;
                    }
                    setIsModalOpen(true);
                 }}
               >
                  <EditOutlined style={{ color: '#ffffff' }} />
                  <span style={{ color: '#ffffff' }}>ตั้งกระทู้</span>
               </button>

               <Select
                  defaultValue="newest"
                  style={{ width: 160 }}
                  onChange={(val) => setSort(val)}
                  options={[
                    { value: 'newest', label: 'ล่าสุด' },
                    { value: 'view', label: 'ยอดนิยม' },
                    { value: 'oldest', label: 'เก่าสุด' },
                  ]}
                  variant="borderless"
                  className="bg-white border border-gray-200 rounded px-2"
               />
             </div>
          </div>

          {/* Thread List Grid */}
          {isLoading ? (
             <div className="flex justify-center py-20">
               <GifLoader className="w-20 h-20" />
             </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                 {threads.length > 0 ? (
                   threads.map((thread) => {
                     const typeInfo = getTypeInfo(thread.type);
                     
                     const isOwner = currentUserId && Number(currentUserId) === Number(thread.user_id);

                     return (
                       <div key={thread.topic_id} className="relative group/card">
                         <Link 
                           href={`/thread/${thread.topic_id}`}
                           className="block"
                         >
                         <div 
                           className={`bg-white rounded-xl border-2 p-4 h-[220px] flex flex-col justify-between hover:shadow-lg transition-shadow cursor-pointer ${typeInfo.borderColor} relative`}
                         >
                            {/* Owner Indicator */}
                            {isOwner && (
                                <div className="absolute top-2 right-2 z-10">
                                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                                        โพสต์ของฉัน
                                    </span>
                                </div>
                            )}

                           <div>
                              <h3 className={`font-bold text-lg mb-2 truncate ${typeInfo.textColor} pr-16`}>
                                {typeInfo.name}
                              </h3>
                              
                              <div className={`${typeInfo.bgColor} rounded-lg p-3 min-h-[80px]`}>
                                 <h4 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">
                                   {thread.title}
                                 </h4>
                                 <p className="text-gray-500 text-sm line-clamp-1">
                                   {/* Description placeholder if API doesn't provide desc */}
                                   {thread.title} ...
                                 </p>
                              </div>
                           </div>
                           
                           <div className="flex items-center justify-between text-gray-400 text-xs mt-4">
                              <div className="flex items-center gap-3">
                                 <div className="flex items-center gap-1">
                                   <EyeOutlined />
                                   <span>{thread.view?.toLocaleString() || 0}</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                   <MessageOutlined />
                                   <span>{thread.comment_count?.toLocaleString() || 0}</span>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                 <ClockCircleOutlined />
                                 <span>{dayjs(thread.date_at).format('DD/MM/YYYY')}</span>
                              </div>
                           </div>
                         </div>
                         </Link>

                         {/* Delete Menu Removed - Moved to ThreadDetail */}
                       </div>
                     );
                   })
                 ) : (
                   <div className="col-span-full text-center py-20 text-gray-400">
                      <p className="text-xl">ไม่พบกระทู้ในหมวดหมู่นี้</p>
                   </div>
                 )}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                 <div className="flex justify-center mb-10">
                    <Pagination 
                      current={page} 
                      total={pagination.total} 
                      pageSize={pagination.limit}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                    />
                 </div>
              )}
            </>
          )}

       </div>
    </div>
  );
}

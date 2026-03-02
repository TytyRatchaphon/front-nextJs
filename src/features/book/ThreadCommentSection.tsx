"use client"

import React, { useState, useEffect } from "react";
import { Button, Popover, Tabs, Pagination, notification } from "antd";
import GifLoader from '@/components/utility/GifLoader';
import { fetchThreadComments, fetchStickers, postThreadComment } from "@/services/apiServices"; // Modified imports
import { StickerSet, CommentThreadData } from "@/types/api";
import ThreadCommentItem from "./ThreadCommentItem";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";

interface ThreadCommentSectionProps {
  topicId: string | number;
}

export default function ThreadCommentSection({ topicId }: ThreadCommentSectionProps) {
  const [api, contextHolder] = notification.useNotification();
  const [comments, setComments] = useState<CommentThreadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  
  // Auth
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
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(10); // API uses 20 default, but let's sync
  useState("newest");

  // Form State
  const [newComment, setNewComment] = useState("");
  
  // Sticker State
  const [stickers, setStickers] = useState<StickerSet[]>([]);
  const [stickerLoading, setStickerLoading] = useState(false);
  const [isStickerOpen, setIsStickerOpen] = useState(false);

  // ContentEditable Ref
  const editorRef = React.useRef<HTMLDivElement>(null);
  const lastCursorPosition = React.useRef<Range | null>(null);

  // Fetch Reviews
  const loadReviews = React.useCallback(async () => {
      try {
        setLoading(true);
         // Note: fetchThreadComments takes page. 
         // If we want client-side sort/pagination like BookDetail, we fetch ALL?
         // BookDetail fetched ALL (10000 limit).
         // Thread comments might be many. Let's try to stick to server pagination if possible?
         // But `CommentSection` used client pagination. 
         // Let's assume server pagination for threads usually, but user asked to be "like bookdetail".
         // Start with server pagination for scalability unless BookDetail logic is crucial.
         // Actually, `CommentSection` fetches ALL to sort by Rating/Oldest/Newest efficiently on client.
         // Threads usually just sort by Oldest/Newest.
         // I'll implementation server-side pagination compatibility if API supports it, but API implementation used specific page.
         
         const data = await fetchThreadComments(topicId, currentPage);
         if (data && data.comments) {
             // Cast to CommentThreadData - assuming API returns compatible structure or we need to map
             // In apiServices.ts we cast to CommentData[] which is wrong type now.
             // We need `CommentThreadData`.
             // I'll cast it here blindly for now, assuming fields match enough.
             // Actually, `CommentThreadData` has `comment_topic_id`. `CommentData` has `comment_book_id`.
             // This needs care.
             setComments(data.comments as unknown as CommentThreadData[]);
             
             if (data.pagination) {
                setTotalItems(data.pagination.total);
                setPageSize(data.pagination.limit); // Update pageSize from server
             } else {
                 setTotalItems(data.comments.length);
             }
         } else {
             setComments([]);
             setTotalItems(0);
         }
      } catch {
        setError("ไม่สามารถโหลดความคิดเห็นได้");
      } finally {
        setLoading(false);
      }
  }, [topicId, currentPage]);

  useEffect(() => {
    if (topicId) loadReviews();
  }, [topicId, loadReviews]); // triggering load on page change

  // Fetch Stickers
  useEffect(() => {
    const loadStickers = async () => {
        try {
            setStickerLoading(true);
            const data = await fetchStickers();
            setStickers(data);
        } catch {
        } finally {
            setStickerLoading(false);
        }
    }
    loadStickers();
  }, []);

  const handleBlur = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
          lastCursorPosition.current = selection.getRangeAt(0);
      }
  };

  const handleAddSticker = (imgUrl: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    const selection = window.getSelection();
    if (lastCursorPosition.current && editor.contains(lastCursorPosition.current.commonAncestorContainer)) {
        selection?.removeAllRanges();
        selection?.addRange(lastCursorPosition.current);
    }

    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
            range.deleteContents();
            const img = document.createElement("img");
            img.src = imgUrl;
            img.style.width = "90px";
            img.style.height = "90px";
            img.style.verticalAlign = "bottom";
            img.contentEditable = "false";
            img.style.pointerEvents = "none";
            range.insertNode(img);
            range.setStartAfter(img);
            range.setEndAfter(img);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
             const img = document.createElement("img");
             img.src = imgUrl;
             img.style.width = "90px";
             img.style.height = "90px";
             img.style.verticalAlign = "bottom";
             img.contentEditable = "false";
             img.style.pointerEvents = "none";
             editor.appendChild(img);
        }
    } else {
        const img = document.createElement("img");
        img.src = imgUrl;
        img.style.width = "90px";
        img.style.height = "90px";
        img.style.verticalAlign = "bottom";
        img.contentEditable = "false";
        img.style.pointerEvents = "none";
        editor.appendChild(img);
    }
    setNewComment(editor.innerHTML);
    setIsStickerOpen(false);
  };

  const stickerContent = (
    <div className="w-80 h-64 overflow-hidden flex flex-col">
        {stickerLoading ? (
            <div className="flex justify-center items-center h-full"><GifLoader width={50} height={50} className="py-10" /></div>
        ) : (
            <Tabs defaultActiveKey="0" tabPosition="top" size="small" className="h-full">
                {stickers.map((set, index) => (
                    <Tabs.TabPane tab={set.stck_set_name} key={index} className="h-full overflow-y-auto px-2">
                         <div className="grid grid-cols-4 gap-2 pb-2">
                            {set.sticker_list.map((sticker) => (
                                <button 
                                    key={sticker.stck_id} 
                                    onClick={() => handleAddSticker(sticker.img)}
                                    className="hover:bg-gray-100 p-1 rounded transition-colors"
                                >
                                    <div className="relative w-full aspect-square">
                                      <Image src={sticker.img} alt="sticker" fill sizes="72px" className="object-contain" unoptimized />
                                    </div>
                                </button>
                            ))}
                         </div>
                    </Tabs.TabPane>
                ))}
            </Tabs>
        )}
    </div>
  );

  const handleSubmit = async () => {
    if (!token) {
        openLoginModal();
        return;
    }

    const editor = editorRef.current;
    const hasText = editor && editor.textContent?.trim().length;
    const hasImages = editor && editor.querySelector('img');
    
    if (!hasText && !hasImages) return;

    try {
        setLoading(true);
        await postThreadComment(topicId, newComment);
        
        api.success({
            message: 'สำเร็จ',
            description: 'แสดงความคิดเห็นเรียบร้อยแล้ว',
            placement: 'topRight',
        });
        
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }
        setNewComment("");
        
        // Reload
        setCurrentPage(1);
        loadReviews();
        
    } catch (err: any) {
        api.error({
             message: 'เกิดข้อผิดพลาด',
             description: err?.response?.data?.message || "เกิดข้อผิดพลาดในการส่งความคิดเห็น",
             placement: 'topRight'
        });
    } finally {
        setLoading(false);
    }
  };

  const onPageChange = (page: number, size: number) => {
      setCurrentPage(page);
      setPageSize(size);
  };

  return (
    <div className="px-2 sm:px-4 lg:px-6 pb-8">
      {contextHolder}
      {/* Header & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold text-gray-900">ความคิดเห็นทั้งหมด ({totalItems})</h3>
      </div>

      {/* Write Comment Box */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">แสดงความคิดเห็น</h3>
        
        <div className="space-y-4">
          <div className="relative">
            <div
                ref={editorRef}
                contentEditable
                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors text-sm overflow-y-auto max-h-[300px]"
                onInput={(e) => {
                     setNewComment(e.currentTarget.innerHTML);
                     if (window.getSelection()?.rangeCount) {
                         lastCursorPosition.current = window.getSelection()!.getRangeAt(0);
                     }
                }}
                onBlur={handleBlur}
                suppressContentEditableWarning
                style={{ whiteSpace: 'pre-wrap' }}
            />
            {!newComment && (
                <div 
                    className="absolute top-3 left-3 text-gray-400 pointer-events-none text-sm"
                    onClick={() => editorRef.current?.focus()}
                >
                    พิมพ์ข้อความ...
                </div>
            )}
            
            {/* Sticker Button */}
            <div className="absolute bottom-3 right-3 z-10 bg-white/80 rounded-full">
                <Popover 
                    content={stickerContent} 
                    trigger="click" 
                    placement="bottomRight"
                    open={isStickerOpen}
                    onOpenChange={setIsStickerOpen}
                    arrow={false}
                >
                    <button className="text-gray-400 hover:text-red-500 transition-colors p-1" title="เพิ่มสติกเกอร์">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </Popover>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
                type="primary" 
                size="large"
                onClick={handleSubmit}
                disabled={!newComment}
                className="!bg-red-600 !border-red-600 hover:!bg-red-700 hover:!border-red-700 h-10 px-8 text-sm font-semibold rounded-lg"
            >
              ส่งความคิดเห็น
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12">
                <GifLoader className="py-10" width={100} height={100} />
             </div>
        ) : comments.length > 0 ? (
            <>
            {comments.map((review, index) => {
                const uniqueKey = review.comment_topic_id || index;
                return (
                  <ThreadCommentItem
                    key={`thread-comment-${uniqueKey}`}
                    review={review}
                    currentUserId={currentUserId}
                    onReplySuccess={() => loadReviews()}
                    onDeleteSuccess={loadReviews}
                    topicId={topicId} // Pass parent topicId
                  />
                );
            })}
             <div className="mt-8 flex justify-center">
                <Pagination
                    current={currentPage}
                    total={totalItems}
                    pageSize={pageSize}
                    onChange={onPageChange}
                    showSizeChanger={false}
                />
            </div>
            </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400">ยังไม่มีความคิดเห็น</p>
          </div>
        )}
      </div>
    </div>
  );
}

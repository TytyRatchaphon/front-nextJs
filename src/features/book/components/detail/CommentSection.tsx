import * as React from "react";
import { useState, useEffect } from "react";
import { Alert, Button, Select, Popover, Tabs, Pagination, App, Empty, Segmented } from "antd";
import { fetchBookReviews, fetchStickers, postBookReview, fetchBookComments, postCommentNotification, postReviewNotification } from "@/services/apiServices";
import { CommentData, CommentEpData, StickerSet } from "@/types/api";
import CommentItem from "./CommentItem";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import GifLoader from '@/components/utility/GifLoader';

interface CommentSectionProps {
  bookId: string | number;
  mode?: "comment" | "comment_ep";
}

export default function CommentSection({ bookId, mode = "comment" }: CommentSectionProps) {
  const { notification: api } = App.useApp();
  const [comments, setComments] = useState<CommentData[] | CommentEpData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth
  const { token, user } = useAuthStore();
  const { openLoginModal } = useUIStore();
  const currentUserId = user?.user_id ? Number(user.user_id) : null;

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [commentTypeSegment, setCommentTypeSegment] = useState<"ep" | "story">("ep");

  // Form State
  const [newComment, setNewComment] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const isAllCommentsMode = mode === "comment_ep";
  const effectiveMode: "comment" | "comment_ep" =
    isAllCommentsMode && commentTypeSegment === "story" ? "comment" : mode;
  const effectivePageSize = isAllCommentsMode
    ? commentTypeSegment === "story"
      ? 20
      : 10
    : 10;
  const plainNewComment = newComment.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();
  const hasImageInNewComment = /<img[\s\S]*?>/i.test(newComment);
  const canSubmitComment = plainNewComment.length > 0 || hasImageInNewComment;

  // Sticker State
  const [stickers, setStickers] = useState<StickerSet[]>([]);
  const [stickerLoading, setStickerLoading] = useState(false);
  const [isStickerOpen, setIsStickerOpen] = useState(false);

  // ContentEditable Ref
  const editorRef = React.useRef<HTMLDivElement>(null);
  const lastCursorPosition = React.useRef<Range | null>(null);

  // Fetch Reviews - Server Side Pagination
  const loadReviews = React.useCallback(async () => {
    try {
      setLoading(true);
      let data;

      if (effectiveMode === "comment") {
        data = await fetchBookReviews(bookId, currentPage, effectivePageSize, sortOrder);
      } else {
        // For fetchBookComments, check if it supports sort param usage. 
        // apiServices definition: fetchBookComments(bookId, page, limit, sort)
        data = await fetchBookComments(bookId, currentPage, effectivePageSize, sortOrder);
      }

      if (data && data.comments) {
        setError(null);
        setComments(data.comments);
        // Assuming data.pagination or similar provides total. 
        // In apiServices: fetchBookReviews returns { comments, pagination }.
        // pagination usually has total.
        if (data.pagination && typeof data.pagination.total === 'number') {
          setTotalItems(data.pagination.total);
        } else if (data.pagination && typeof data.pagination.total_items === 'number') {
          setTotalItems(data.pagination.total_items);
        } else {
          // Fallback if pagination is missing but we have comments (maybe single page)
          // If it's page 1 and count < pageSize, total = count? Not reliable.
          // Assuming API returns total. If not, pagination might break.
          // Let's try to infer or keep previous total if available? No, set to 0 or comments length if minimal?
          // Some legacy responses might fallback.
          if (currentPage === 1 && data.comments.length < effectivePageSize) {
            setTotalItems(data.comments.length);
          }
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
  }, [effectiveMode, bookId, currentPage, effectivePageSize, sortOrder]);

  useEffect(() => {
    if (bookId) loadReviews();
  }, [bookId, loadReviews]);

  useEffect(() => {
    if (!isAllCommentsMode) return;
    setCurrentPage(1);
    setSortOrder("newest");
  }, [commentTypeSegment, isAllCommentsMode]);

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

  // Save cursor position when blur
  const handleBlur = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      lastCursorPosition.current = selection.getRangeAt(0);
    }
  };

  const createStickerImageElement = (imgUrl: string) => {
    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = "sticker";
    img.style.width = "90px";
    img.style.height = "90px";
    img.style.display = "inline-block";
    img.style.verticalAlign = "middle";
    img.style.margin = "4px 2px";
    img.contentEditable = "false";
    img.style.pointerEvents = "none";
    img.draggable = false;
    return img;
  };

  const handleAddSticker = (imgUrl: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    // Restore selection if exists and is inside editor
    const selection = window.getSelection();
    if (lastCursorPosition.current && editor.contains(lastCursorPosition.current.commonAncestorContainer)) {
      selection?.removeAllRanges();
      selection?.addRange(lastCursorPosition.current);
    }

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Ensure range is inside editor
      if (editor.contains(range.commonAncestorContainer)) {
        range.deleteContents();

        const img = createStickerImageElement(imgUrl);

        range.insertNode(img);

        // Move cursor after image
        range.setStartAfter(img);
        range.setEndAfter(img);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback append if selection is weirdly outside
        const img = createStickerImageElement(imgUrl);
        editor.appendChild(img);
      }
    } else {
      // No selection, just append
      const img = createStickerImageElement(imgUrl);
      editor.appendChild(img);
    }

    // Trigger input event logic manually
    setNewComment(editor.innerHTML);
    setIsStickerOpen(false);
  };

  const stickerContent = (
    <div className="w-80 h-64 overflow-hidden flex flex-col">
      {stickerLoading ? (
        <GifLoader width={50} height={50} className="py-10" />
      ) : (
        <Tabs
          defaultActiveKey="0"
          tabPosition="top"
          size="small"
          className="h-full"
          items={stickers.map((set, index) => ({
            key: String(index),
            label: set.stck_set_name,
            children: (
              <div className="h-full overflow-y-auto px-2">
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
              </div>
            )
          }))}
        />
      )}
    </div>
  );

  const handleSubmit = async () => {
    if (!token) {
      openLoginModal();
      return;
    }

    // Basic validation
    const editor = editorRef.current;
    // Check for actual visible text or images
    const plainText = editor?.textContent?.trim() || "";
    const hasImages = !!editor?.querySelector('img');
    const isContentEmpty = !plainText && !hasImages;

    // Require actual content (text or sticker image)
    if (isContentEmpty) {
      api.warning({
        message: 'แจ้งเตือน',
        description: 'กรุณากรอกข้อความแสดงความคิดเห็น',
        placement: 'topRight',
      });
      return;
    }

    try {
      setLoading(true);
      // Use innerHTML or newComment since we know it's not empty/strictly-whitespace
      const commentToSend = editor?.innerHTML || newComment;

      const response = await postBookReview(bookId, commentToSend, effectiveMode === 'comment' ? 5 : 0);

      // Trigger notification if comment id exists
      if (response && response.data) {
        const commentId = response.data.comment_book_id || response.data.id;
        if (commentId) {
          if (effectiveMode === 'comment') {
            await postReviewNotification(commentId);
          } else {
            await postCommentNotification(commentId);
          }
        }
      }

      // Success
      api.success({
        message: 'สำเร็จ',
        description: 'แสดงความคิดเห็นเรียบร้อยแล้ว',
        placement: 'topRight',
      });

      // Clear Form
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      setNewComment("");

      // Reload data 
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



  // No Client-Side Sorting/Pagination needed anymore as we fetch from server

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteSuccess = () => {
    api.success({
      message: 'สำเร็จ',
      description: 'ลบความคิดเห็นเรียบร้อยแล้ว',
      placement: 'topRight',
    });
    loadReviews();
  };

  if (loading && comments.length === 0) return <div className="py-10 text-center"><GifLoader /></div>;
  if (error) return <Alert message={error} type="error" showIcon />;

  return (
    <div className="px-2 sm:px-4 lg:px-6 pb-8">
      {/* Header & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold text-gray-900">{mode === 'comment' ? 'รีวิวทั้งหมด' : 'ความคิดเห็นทั้งหมด'} ({totalItems})</h3>
        <div className="w-full sm:w-48">
          <Select
            value={sortOrder}
            style={{ width: "100%" }}
            onChange={(val) => setSortOrder(val)}
            options={
              mode === 'comment' && !isAllCommentsMode
                ? [
                  { value: "newest", label: "เรียงตาม: ใหม่ล่าสุด" },
                  { value: "oldest", label: "เรียงตาม: เก่าสุด" },
                  { value: "high_rating", label: "เรียงตาม: คะแนนสูงสุด" },
                  { value: "low_rating", label: "เรียงตาม: คะแนนต่ำสุด" },
                ]
                : [
                  { value: "newest", label: "เรียงตาม: ใหม่ล่าสุด" },
                  { value: "oldest", label: "เรียงตาม: เก่าสุด" },
                ]
            }
          />
        </div>
      </div>

      {isAllCommentsMode && (
        <div className="mb-6">
          <Segmented
            value={commentTypeSegment}
            onChange={(value) => setCommentTypeSegment(value as "ep" | "story")}
            options={[
              { label: "คอมเมนต์ตอน", value: "ep" },
              { label: "คอมเมนต์เรื่อง", value: "story" },
            ]}
          />
        </div>
      )}

      {/* Write Comment Box */}
      {effectiveMode === "comment" && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">เขียนความคิดเห็น</h3>

          <div className="space-y-4">


            <div className="relative">
              {/* Custom ContentEditable Div mimicking AntD TextArea */}
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
                  แสดงความคิดเห็นของคุณที่นี่...
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
                disabled={!canSubmitComment}
                className="!bg-red-600 hover:!bg-red-700 h-10 px-8 text-sm font-semibold rounded-lg"
              >
                ส่งความคิดเห็น
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <GifLoader className="py-12" width={100} height={100} />
        ) : comments.length > 0 ? (
          <>
            {comments.map((review, index) => {
              const uniqueKey = (review as CommentData).comment_book_id
                ? `review-${(review as CommentData).comment_book_id}`
                : `comment-${(review as CommentEpData).comment_ep_id}`;

              return (
                <CommentItem
                  key={`${uniqueKey}-${index}`}
                  review={review}
                  currentUserId={currentUserId}
                  onReplySuccess={() => loadReviews()}
                  onDeleteSuccess={handleDeleteSuccess}
                  mode={effectiveMode}
                />
              );
            })}
            <div className="mt-8 flex justify-center">
              <Pagination
                current={currentPage}
                total={totalItems}
                pageSize={effectivePageSize}
                onChange={onPageChange}
                showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <div className="py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Empty description={effectiveMode === "comment" ? "ยังไม่มีคอมเมนต์เรื่อง" : "ยังไม่มีคอมเมนต์ตอน"} />
          </div>
        )}
      </div>
    </div>
  );
}

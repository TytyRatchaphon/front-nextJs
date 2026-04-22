import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Alert, Button, Pagination, App, Empty, Popover, Tabs } from "antd";
import { fetchEpisodeComments, postEpisodeComment, fetchStickers, postCommentNotification } from "@/services/apiServices";
import { CommentEpData, StickerSet } from "@/types/api";
import CommentItem from "./CommentItem";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import GifLoader from '@/components/utility/GifLoader';

interface EpisodeCommentSectionProps {
    episodeId: string | number;
    theme?: { bg: string; text: string; key: string };
}

export default function EpisodeCommentSection({ episodeId, theme }: EpisodeCommentSectionProps) {
    const { notification: api } = App.useApp();
    const [comments, setComments] = useState<CommentEpData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Auth
    const { token } = useAuthStore() as any;
    const { openLoginModal } = useUIStore();
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    // Theme Logic
    const currentThemeKey = theme?.key || 'white';
    const themeStyles: any = {
        white: {
            text: 'text-black',
            textSecondary: 'text-gray-500',
            border: 'border-gray-200',
            cardBg: 'bg-white',
            inputBg: 'bg-white',
            inputBorder: 'border-gray-300',
            emptyBg: 'bg-gray-50',
            buttonPrimary: '!bg-red-600 hover:!bg-red-700',
            divider: 'border-gray-200',
            icon: 'text-gray-400',
            stickerBg: 'bg-white'
        },
        sepia: {
            text: 'text-black',
            textSecondary: 'text-gray-600',
            border: 'border-[#e6dbc4]',
            cardBg: 'bg-[#fdfaee]',
            inputBg: 'bg-[#fffaf0]',
            inputBorder: 'border-[#e6dbc4]',
            emptyBg: 'bg-[#f9f2de]/50',
            buttonPrimary: '!bg-[#8c6b4b] hover:!bg-[#6d5136] text-white',
            divider: 'border-[#e6dbc4]',
            icon: 'text-[#8c6b4b]',
            stickerBg: 'bg-[#fdfaee]'
        },
        dark: {
            text: 'text-white',
            textSecondary: 'text-gray-400',
            border: 'border-[#333333]',
            cardBg: 'bg-[#1c1c1e]',
            inputBg: 'bg-[#2b2b2b]',
            inputBorder: 'border-[#444]',
            emptyBg: 'bg-[#1c1c1e]/50',
            buttonPrimary: '!bg-red-600 hover:!bg-red-700 text-white disabled:bg-gray-700 disabled:text-gray-500 disabled:border-none',
            divider: 'border-[#333333]',
            icon: 'text-gray-400',
            stickerBg: 'bg-[#1c1c1e]'
        }
    };
    const t = themeStyles[currentThemeKey] || themeStyles.white;

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
    const [pageSize, setPageSize] = useState(10);

    // Form State
    const [newComment, setNewComment] = useState("");

    // Sticker State
    const [stickers, setStickers] = useState<StickerSet[]>([]);
    const [stickerLoading, setStickerLoading] = useState(false);
    const [isStickerOpen, setIsStickerOpen] = useState(false);

    // ContentEditable Ref
    const editorRef = React.useRef<HTMLDivElement>(null);
    const lastCursorPosition = React.useRef<Range | null>(null);

    // Load Comments
    const loadComments = React.useCallback(async () => {
        try {
            setLoading(true);
            const ALL_LIMIT = 10000;
            const data = await fetchEpisodeComments(episodeId, 1, ALL_LIMIT);

            if (data && data.comments) {
                setComments(data.comments);
                setTotalItems(data.comments.length);
            } else {
                setComments([]);
                setTotalItems(0);
            }
        } catch {
            setError("ไม่สามารถโหลดความคิดเห็นได้");
        } finally {
            setLoading(false);
        }
    }, [episodeId]);

    useEffect(() => {
        if (episodeId) loadComments();
    }, [episodeId, loadComments]);

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
                const img = createStickerImageElement(imgUrl);
                editor.appendChild(img);
            }
        } else {
            const img = createStickerImageElement(imgUrl);
            editor.appendChild(img);
        }

        setNewComment(editor.innerHTML);
        setIsStickerOpen(false);
    };

    const stickerContent = (
        <div className="w-80 h-64 overflow-hidden flex flex-col">
            {stickerLoading ? (
                <GifLoader width={50} height={50} className="py-10" />
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
            const commentToSend = newComment;

            const response = await postEpisodeComment(episodeId, commentToSend);

            if (response && (response.data?.comment_ep_id || response.comment_ep_id)) {
                const commentId = response.data?.comment_ep_id || response.comment_ep_id;
                await postCommentNotification(commentId);
            }

            api.success({
                message: 'สำเร็จ',
                description: 'แสดงความคิดเห็นเรียบร้อยแล้ว',
                placement: 'topRight',
            });

            if (editorRef.current) {
                editorRef.current.innerHTML = "";
            }
            setNewComment("");

            setCurrentPage(1);
            loadComments();

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

    // Client-Side Pagination & Sorting
    const sortedComments = useMemo(() => {
        if (!comments || !Array.isArray(comments)) return [];
        return [...comments].sort((a, b) => {
            const dateA = a.update_at ? new Date(a.update_at).getTime() : 0;
            const dateB = b.update_at ? new Date(b.update_at).getTime() : 0;
            return dateB - dateA; // Newest first
        });
    }, [comments]);

    const paginatedComments = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedComments.slice(startIndex, startIndex + pageSize);
    }, [sortedComments, currentPage, pageSize]);

    const onPageChange = (page: number, size: number) => {
        setCurrentPage(page);
        setPageSize(size);
    };

    if (loading && comments.length === 0) return <GifLoader className="py-10" width={100} height={100} />;
    if (error) return <Alert message={error} type="error" showIcon />;

    return (
        <div className={`mt-8 max-w-3xl mx-auto px-4 pb-8 transition-colors duration-300`}>
            <div className={`border-t pt-8 transition-colors ${t.divider}`}>
                <h3 className={`text-lg font-bold mb-6 transition-colors ${t.text}`}>ความคิดเห็น ({totalItems})</h3>

                {/* Write Comment Box */}
                <div className={`rounded-xl border p-6 shadow-sm mb-8 transition-colors ${t.cardBg} ${t.border}`}>
                    <h3 className={`text-base font-bold mb-4 transition-colors ${t.text}`}>เขียนความคิดเห็นของคุณ</h3>
                    <div className="relative mb-4">
                        <div
                            ref={editorRef}
                            contentEditable
                            className={`w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors text-sm overflow-y-auto max-h-[300px] ${t.inputBg} ${t.inputBorder} ${t.text} focus:border-red-500 focus:ring-red-500`}
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
                                className={`absolute top-3 left-3 pointer-events-none text-sm ${t.textSecondary}`}
                                onClick={() => editorRef.current?.focus()}
                            >
                                แสดงความคิดเห็นเกี่ยวกับตอนนี้...
                            </div>
                        )}
                        {/* Sticker Button */}
                        <div className={`absolute bottom-3 right-3 z-10 rounded-full ${t.stickerBg}`}>
                            <Popover
                                content={stickerContent}
                                trigger="click"
                                placement="bottomRight"
                                open={isStickerOpen}
                                onOpenChange={setIsStickerOpen}
                                arrow={false}
                            >
                                <button className={`transition-colors p-1 ${t.icon} hover:text-red-500`} title="เพิ่มสติกเกอร์">
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
                            onClick={handleSubmit}
                            disabled={!newComment}
                            className={`h-9 px-6 text-sm font-semibold rounded-lg ${t.buttonPrimary}`}
                        >
                            ส่งความคิดเห็น
                        </Button>
                    </div>
                </div>

                {/* Comment List */}
                <div className="space-y-4">
                    {paginatedComments.length > 0 ? (
                        <>
                            {paginatedComments.map((review, index) => (
                                <CommentItem
                                    key={`ep-comment-${review.comment_ep_id}-${index}`}
                                    review={review}
                                    currentUserId={currentUserId}
                                    onReplySuccess={() => loadComments()}
                                    onDeleteSuccess={() => {
                                        api.success({ message: 'สำเร็จ', description: 'ลบความคิดเห็นเรียบร้อยแล้ว' });
                                        loadComments();
                                    }}
                                    mode="read_ep_comment"
                                    theme={theme}
                                />
                            ))}
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
                        <div className={`py-12 rounded-2xl border border-dashed transition-colors ${t.emptyBg} ${t.divider}`}>
                            <Empty description={<span className={t.textSecondary}>ยังไม่มีความคิดเห็นในตอนนี้</span>} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { sanitizeUserGeneratedHtml } from "@/utils/sanitizeHtml";

type BookDetail = {
    category1?: { name: string } | string;
    category2?: { name: string } | string;
    end: string;
    writer?: { writer_name: string } | null;
    writer_name?: string;
    update_at: string;
    tag: string[] | string;
    des: string;
    // Dynamic lookup support
    [key: string]: any;
};

type Props = {
    bookDetail: BookDetail | null;
};

export const BookAboutTab = ({ bookDetail }: Props) => {
    if (!bookDetail) return null;
    const safeDescriptionHtml = sanitizeUserGeneratedHtml(bookDetail.des);

    return (
        <div className="text-left px-2 sm:px-4 lg:px-6">
            <div className="mb-4 sm:mb-6 space-y-2">
                <p className="text-xs sm:text-sm text-gray-700">
                    <strong>หมวดหมู่:</strong> {(bookDetail.category1 as any)?.name || bookDetail["category1.name"]} /{" "}
                    {(bookDetail.category2 as any)?.name || bookDetail["category2.name"]}
                </p>
                <p className="text-xs sm:text-sm text-gray-700">
                    <strong>สถานะ:</strong>{" "}
                    {bookDetail.end === "not_end" ? "ยังไม่จบ" : "จบแล้ว"}
                </p>
                <p className="text-xs sm:text-sm text-gray-700">
                    <strong>ผู้แต่ง:</strong> {bookDetail.writer?.writer_name || bookDetail["writer.writer_name"] || bookDetail.writer_name}
                </p>
                <p className="text-xs sm:text-sm text-gray-700">
                    <strong>อัปเดตล่าสุด:</strong>{" "}
                    {new Date(bookDetail.update_at).toLocaleDateString("th-TH")}
                </p>
            </div>

            {(() => {
                let tagsArray: string[] = [];
                if (Array.isArray(bookDetail.tag)) {
                    tagsArray = bookDetail.tag;
                } else if (typeof bookDetail.tag === "string") {
                    tagsArray = (bookDetail.tag as string).split(",").filter((t: string) => t.trim() !== "");
                }

                if (tagsArray.length === 0) return null;

                return (
                    <div className="mb-4 sm:mb-6">
                        <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                            แท็ก:
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {tagsArray.map((tag: string, index: number) => (
                                <span
                                    key={index}
                                    className="px-2 sm:px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] sm:text-xs"
                                >
                                    {String(tag).trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            })()}

            <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-2">
                    เรื่องย่อ:
                </p>
                <div
                    className="text-xs sm:text-sm text-gray-700 leading-relaxed prose prose-sm sm:prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }}
                />
            </div>
        </div>
    );
};

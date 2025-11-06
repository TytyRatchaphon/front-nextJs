type Book = {
  cover: string;
  title: string;
  author: string;
  price: number;
  chapters?: number;
  views?: number;
  reviews?: number;
  tag?: string;
};

interface BookInfoSectionProps {
  book: Book;
}

const BookInfoSection = ({ book }: BookInfoSectionProps) => (
  <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
    <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
      ข้อมูลเรื่อง
    </h3>
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">โดย</span>
        <span className="text-gray-900 font-medium">{book.author}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">ผู้เขียน</span>
        <span className="text-gray-900 font-medium">{book.author}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">ผู้แปล</span>
        <span className="text-gray-900 font-medium">-</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">จำนวนตอน</span>
        <span className="text-gray-900 font-medium">{book.chapters || 42} ตอน</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">หมวดหมู่</span>
        <span className="text-gray-900 font-medium">{book.tag || "แฟนตาซี"}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">จัดเผยแพร่เมื่อ</span>
        <span className="text-gray-900 font-medium">1 มกราคม 2025</span>
      </div>
    </div>
  </div>
);

export default BookInfoSection;

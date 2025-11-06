export default function Sidebar() {
  return (
    <aside className="w-full lg:w-80 bg-white border rounded-lg p-5 h-fit">
      <div className="text-lg font-bold mb-3">ซื้อเฉพาะตอน</div>
      <div className="space-y-2 text-sm">
        <p>ตอนที่เปิดอ่านแล้ว: 100 / 240 ตอน</p>
        <p>
          เหรียญทั้งหมด: <span className="text-red-500 font-bold">2,299</span>
        </p>
      </div>
      <button className="w-full mt-3 bg-red-500 text-white py-2 rounded-md hover:bg-red-600">
        ซื้อทั้งหมด
      </button>
      <div className="mt-5 border-t pt-3">
        <p className="text-sm text-gray-600 mb-2">ส่งของขวัญ</p>
        <div className="flex gap-3">
          <span className="bg-gray-100 p-2 rounded-md cursor-pointer hover:bg-gray-200">
            🎁
          </span>
          <span className="bg-gray-100 p-2 rounded-md cursor-pointer hover:bg-gray-200">
            💎
          </span>
          <span className="bg-gray-100 p-2 rounded-md cursor-pointer hover:bg-gray-200">
            🌹
          </span>
        </div>
      </div>
    </aside>
  );
}

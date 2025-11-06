const GiftSection = () => (
  <section className="mt-8 bg-white rounded shadow p-4">
    <h2 className="font-bold text-lg mb-1">ส่งของขวัญ</h2>
    <div className="flex gap-4 items-center">
      <button className="bg-red-500 text-white px-4 py-2 rounded">❤️</button>
      <button className="bg-pink-500 text-white px-4 py-2 rounded">🎁</button>
      <button className="bg-yellow-500 text-white px-4 py-2 rounded">⭐</button>
      <span className="ml-4 text-gray-600">(จำนวนของขวัญที่ส่ง: 10)</span>
    </div>
  </section>
);
export default GiftSection;

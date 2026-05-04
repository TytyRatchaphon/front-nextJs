export const getMobileSectionLabel = (pathname: string) => {
  if (pathname === "/novel-pack") return "มัดแพ็ค";
  if (pathname === "/translated-novel") return "นิยายแปล";
  if (pathname === "/fiction-novel") return "นิยายแต่ง";
  if (pathname.startsWith("/ranking")) return "จัดอันดับ";
  if (pathname.startsWith("/article")) return "บทความ";
  if (pathname.startsWith("/promotion")) return "โปรโมชัน";
  if (pathname.startsWith("/event")) return "กิจกรรม";
  if (pathname.startsWith("/search")) return "ค้นหา";
  if (pathname.startsWith("/shelve")) return "ชั้นหนังสือ";
  return "หน้าหลัก";
};

// ฟังก์ชันสำหรับแปลง HTML เป็น JSX elements
export const parseHtmlToJsx = (html: string) => {
  if (!html) return null;
  
  // แปลง HTML tags เป็น JSX
  const jsxHtml = html
    .replace(/<br\s*\/?>/gi, '<br />')
    .replace(/class=/gi, 'className=')
    .replace(/<p([^>]*)>/gi, '<p$1>')
    .replace(/<\/p>/gi, '</p>');
  
  return jsxHtml;
};

// ฟังก์ชันสำหรับ clean HTML tags ออกจากข้อความ (ถ้าต้องการ)
export const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
};

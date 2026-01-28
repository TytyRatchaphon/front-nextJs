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

export function randomString(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const genEmailHide = (email?: string | null) => {
    if (!email) {
        return randomString(4)
    }
 
    const explode = email.split('@')
    
    return explode[0] + randomString(4) + (explode[1] || '')
}

export const modifiedHtml = (detailData: string, currentFont: string, userData: any) => {
    const font = currentFont || 'var(--font-sarabun), sans-serif'; // Fallback if cookie usage is handled outside or passed in
    // Note: getCookies is not available here, assuming caller passes the correct resolved font

    if (!detailData) return '';

    let newDetail = detailData
            .replace(/<(\/)?font[^>]*>/g, '')
            .replace(/font-size:\d+pt;/g, '')
            .replace(/font-family:.+?;/g, '')
            .replace(/\s*class=(["'])[\s\S]*?\1/gi, '')
            .replace(/color:.+?;/g, '') 
            .replace(/<o:p>/g, '<span>')  // ลบ tag <o:p>
            .replace(/<p[^>]*>/g, `<p class="no-select" style="font-family: ${font} ">&emsp;&emsp;&emsp;`) // Format p tags with font and indentation
            .replace(/<h1[^>]*>/g, `<p class="no-select" style="font-family: ${font} ">&emsp;&emsp;&emsp;`) // Format h1 as p
            .replace(/<span[^>]*>/g, '')
            .replace(/<\/span>/g, '')
            .replace(/<\/p>/g, () => { 
              const hiddenEmail = genEmailHide(userData?.email);
              return `<span class="no-select" style="color:transparent;font-size:0;">${hiddenEmail}</span></p>`;
            });

    return newDetail;
}

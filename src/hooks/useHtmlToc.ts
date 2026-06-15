import { useMemo } from 'react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function useHtmlToc(htmlString: string | null | undefined) {
  return useMemo(() => {
    if (!htmlString) return { htmlWithIds: '', toc: [] };

    const toc: TocItem[] = [];
    let counter = 0;

    const htmlWithIds = htmlString.replace(
      /<h([2-4])([^>]*)>(.*?)<\/h\1>/gi,
      (match, levelStr, attrs, content) => {
        const level = parseInt(levelStr, 10);
        // Strip HTML tags and replace common entities to get plain text
        let text = content.replace(/<[^>]+>/g, '').trim();
        // Replace &nbsp; and its variants with regular space
        text = text.replace(/&nbsp;/gi, ' ').replace(/\u00A0/g, ' ').trim();
        
        if (!text) return match;

        // Check if id already exists
        const idMatch = attrs.match(/id=["']([^"']+)["']/i);
        const id = idMatch ? idMatch[1] : `policy-section-${counter++}`;

        toc.push({ id, text, level });

        if (idMatch) {
          return match;
        } else {
          return `<h${level}${attrs} id="${id}">${content}</h${level}>`;
        }
      }
    );

    return { htmlWithIds, toc };
  }, [htmlString]);
}

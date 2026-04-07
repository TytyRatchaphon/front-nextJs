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

    const newDetail = detailData
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

const CONTENT_OBFUSCATION_CHARS = ['\u2060', '\u200B', '\u200C'];
const CONTENT_NOISE_CLASS = 'inspect-noise no-select';
const CONTENT_NOISE_STYLE = 'display:none;color:transparent;font-size:0;line-height:0;';

const segmentForObfuscation = (text: string) => {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(text), (part) => part.segment);
    }

    return Array.from(text);
};

const buildNoiseToken = (index: number) => `n${(index * 17).toString(36)}${(index * 29).toString(36)}`;

const obfuscateVisibleText = (text: string) => {
    if (!text.trim()) return text;

    const segments = segmentForObfuscation(text);
    let visibleCount = 0;
    let markerIndex = 0;

    return segments.map((segment) => {
        if (!segment.trim()) return segment;

        visibleCount += 1;
        if (visibleCount % 3 !== 0) return segment;

        const marker = CONTENT_OBFUSCATION_CHARS[markerIndex % CONTENT_OBFUSCATION_CHARS.length];
        markerIndex += 1;
        return `${segment}${marker}`;
    }).join('');
};

export const obfuscateClipboardText = (text: string) => {
    if (!text) return '';
    return obfuscateVisibleText(text);
};

const obfuscateVisibleTextToHtml = (text: string) => {
    if (!text.trim()) return text;

    const segments = segmentForObfuscation(text);
    let visibleCount = 0;
    let markerIndex = 0;

    return segments.map((segment) => {
        if (!segment.trim()) return segment;

        visibleCount += 1;
        const marker = visibleCount % 3 === 0
            ? CONTENT_OBFUSCATION_CHARS[markerIndex++ % CONTENT_OBFUSCATION_CHARS.length]
            : '';
        const noise = visibleCount % 4 === 0
            ? `<span class="${CONTENT_NOISE_CLASS}" hidden aria-hidden="true" data-noise="${buildNoiseToken(visibleCount)}" style="${CONTENT_NOISE_STYLE}">${buildNoiseToken(visibleCount)}</span>`
            : '';

        return `${segment}${marker}${noise}`;
    }).join('');
};

export const obfuscateHtmlTextNodes = (html: string) => {
    if (!html) return '';

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        return html.replace(/>([^<>]+)</g, (_, text: string) => `>${obfuscateVisibleTextToHtml(text)}<`);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const textNodes: Text[] = [];

    const walker = doc.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                const parent = node.parentElement;
                const rawText = node.textContent || '';

                if (!parent || !rawText.trim()) return NodeFilter.FILTER_REJECT;
                if (parent.closest('script, style, noscript, .inspect-noise')) return NodeFilter.FILTER_REJECT;

                const parentStyle = parent.getAttribute('style') || '';
                if (parentStyle.includes('color:transparent') || parentStyle.includes('font-size:0')) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    while (walker.nextNode()) {
        textNodes.push(walker.currentNode as Text);
    }

    textNodes.forEach((textNode) => {
        const rawText = textNode.textContent || '';
        const segments = segmentForObfuscation(rawText);
        let visibleCount = 0;
        let markerIndex = 0;
        const fragment = doc.createDocumentFragment();

        segments.forEach((segment) => {
            fragment.appendChild(doc.createTextNode(segment));

            if (!segment.trim()) return;

            visibleCount += 1;

            if (visibleCount % 3 === 0) {
                fragment.appendChild(
                    doc.createTextNode(CONTENT_OBFUSCATION_CHARS[markerIndex++ % CONTENT_OBFUSCATION_CHARS.length])
                );
            }

            if (visibleCount % 4 === 0) {
                const noiseSpan = doc.createElement('span');
                const noiseToken = buildNoiseToken(visibleCount);
                noiseSpan.className = CONTENT_NOISE_CLASS;
                noiseSpan.hidden = true;
                noiseSpan.setAttribute('aria-hidden', 'true');
                noiseSpan.setAttribute('data-noise', noiseToken);
                noiseSpan.setAttribute('style', CONTENT_NOISE_STYLE);
                noiseSpan.textContent = noiseToken;
                fragment.appendChild(noiseSpan);
            }
        });

        textNode.parentNode?.replaceChild(fragment, textNode);
    });

    return doc.body.innerHTML;
}

export const addParagraphIndexes = (html: string) => {
    if (!html) return { html: '', paragraphCount: 0 };

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
        let index = 0;
        const indexedHtml = html.replace(/<(p|blockquote|li|pre)([^>]*)>/gi, (_, tag, attrs) => {
            index += 1;
            return `<${tag}${attrs} data-paragraph-index="${index}">`;
        });
        return { html: indexedHtml, paragraphCount: index };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks = doc.body.querySelectorAll('p, blockquote, li, pre');

    const getVisibleText = (el: Element) => {
        const clone = el.cloneNode(true) as Element;
        // Remove invisible watermark spans inserted by modifiedHtml
        clone.querySelectorAll('span[style*="color:transparent"], span[style*="font-size:0"], span.no-select[style*="transparent"]').forEach((n) => n.remove());
        return (clone.textContent || '')
            .replace(/\u00a0/g, ' ')
            .replace(/\u200b/g, '')
            .replace(/\u200c/g, '')
            .replace(/\u2060/g, '')
            .trim();
    };

    let index = 0;
    blocks.forEach((el) => {
        const text = getVisibleText(el);
        if (!text) {
            el.removeAttribute('data-paragraph-index');
            return;
        }
        index += 1;
        el.setAttribute('data-paragraph-index', String(index));
    });

    return { html: doc.body.innerHTML, paragraphCount: index };
}

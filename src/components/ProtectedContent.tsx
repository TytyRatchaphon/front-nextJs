"use client";

import { useEffect, useRef } from "react";

interface ProtectedContentProps {
  content: string;
  className?: string;
  allowHtml?: boolean;
}

/**
 * Component สำหรับแสดงเนื้อหาที่ป้องกันการคัดลอกขั้นสูง
 * - แบ่งเนื้อหาออกเป็นชิ้นเล็กๆ
 * - ใช้ CSS ::before/::after เพื่อแสดงผล
 * - ป้องกัน innerText, textContent
 */
export default function ProtectedContent({
  content,
  className = "",
  allowHtml = true,
}: ProtectedContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!containerRef.current || !content) return;

    // แยกเนื้อหา HTML ออกเป็น paragraphs
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const container = containerRef.current;

    // Clear existing content
    container.innerHTML = "";

    // If allowed, render HTML directly (honor HTML tags). This bypasses
    // the word-splitting protection but keeps copy/paste and DOM protections.
    if (allowHtml) {
      try {
        // Decode HTML entities if content was escaped
        const decodeHtml = (str: string) => {
          const txt = document.createElement('textarea');
          txt.innerHTML = str;
          return txt.value;
        };

        let decoded = decodeHtml(content);
        // Remove BOM / ZERO-WIDTH chars that may interfere with rendering
        decoded = decoded.replace(/\uFEFF/g, "").replace(/\u200B/g, "");
        container.innerHTML = decoded;

        // Apply minimal protections (prevent selection/copy on the container)
        container.querySelectorAll('*').forEach((el) => {
          try {
            (el as HTMLElement).style.userSelect = 'none';
          } catch (e) {}
        });

        // inject style to preserve HTML block spacing and basic text styling
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-protected-style', 'true');
        styleEl.textContent = `
          /* Reset alignment inside protected content to respect inline HTML styles */
          .protected-content-wrapper { white-space: pre-wrap; text-align: initial !important; }
          .protected-content-wrapper * { text-align: initial !important; }
          .protected-content-wrapper p { margin: 0 0 1rem; text-align: initial !important; }
          .protected-content-wrapper br { display: block; margin: 0.5rem 0; }
          .protected-content-wrapper strong, .protected-content-wrapper b { font-weight: 700; }
          .protected-content-wrapper em, .protected-content-wrapper i { font-style: italic; }
          .protected-content-wrapper img { max-width: 100%; height: auto; display: block; margin: 0.5rem 0; }
        `;
        container.appendChild(styleEl);

        // Prevent copying from container
        const onCopy = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
        container.addEventListener('copy', onCopy as EventListener);
        container.addEventListener('cut', onCopy as EventListener);
        container.addEventListener('paste', onCopy as EventListener);

        // Done rendering HTML; exit early and cleanup listeners/styles on unmount
        return () => {
          try {
            container.removeEventListener('copy', onCopy as EventListener);
            container.removeEventListener('cut', onCopy as EventListener);
            container.removeEventListener('paste', onCopy as EventListener);
            const injected = container.querySelector('style[data-protected-style]');
            if (injected && injected.parentNode) injected.parentNode.removeChild(injected);
          } catch (e) {}
        };
      } catch (e) {
        // fallback to protected rendering below
        console.warn('ProtectedContent: allowHtml render failed, falling back to protected mode', e);
      }
    }

    // สร้าง elements ใหม่โดยแยกข้อความออกเป็นชิ้นเล็กๆ
    const processNode = (node: Node, parent: HTMLElement) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text.trim()) {
          // แบ่งข้อความออกเป็นคำ
          const words = text.split(" ");
          words.forEach((word, index) => {
            if (word.trim()) {
              const span = document.createElement("span");
              span.className = "protected-word";
              span.setAttribute("data-content", word);
              // เก็บข้อความไว้ใน data attribute แทนที่จะเป็น text node
              parent.appendChild(span);

              if (index < words.length - 1) {
                const space = document.createElement("span");
                space.className = "protected-word";
                space.setAttribute("data-content", " ");
                parent.appendChild(space);
              }
            }
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const newElement = document.createElement(
          element.tagName.toLowerCase()
        );

        // คัดลอก attributes
        Array.from(element.attributes).forEach((attr) => {
          newElement.setAttribute(attr.name, attr.value);
        });

        parent.appendChild(newElement);

        // ประมวลผล child nodes
        Array.from(node.childNodes).forEach((child) => {
          processNode(child, newElement);
        });
      }
    };

    // ประมวลผลทุก child nodes ของ body
    Array.from(doc.body.childNodes).forEach((child) => {
      processNode(child, container);
    });

    // ป้องกันการเข้าถึง innerText และ textContent
    const protectElement = (element: HTMLElement) => {
      try {
        Object.defineProperty(element, "innerText", {
          get: () => "🔒",
          set: () => {},
          configurable: false,
        });
        Object.defineProperty(element, "textContent", {
          get: () => "🔒",
          set: () => {},
          configurable: false,
        });
        Object.defineProperty(element, "innerHTML", {
          get: () => "🔒 Protected Content",
          set: () => {},
          configurable: false,
        });
      } catch (e) {
        // Some properties might not be configurable
      }
    };

    // Apply protection to container and all children
    protectElement(container);
    container.querySelectorAll("*").forEach((el) => {
      protectElement(el as HTMLElement);
    });

    // ป้องกัน DOM methods

    container.querySelector = function () {
      return null;
    } as any;

    container.querySelectorAll = function () {
      return [] as any;
    } as any;

    // Inject minimal CSS to render the data-content from protected spans
    // This preserves the protection strategy (data attributes + getter overrides)
    // while making the text visible to users via CSS ::before content.
    try {
      const styleEl = document.createElement("style");
      styleEl.setAttribute("data-protected-style", "true");
      styleEl.textContent = `
        .protected-word { display: inline; }
        .protected-word::before { content: attr(data-content); }
        .protected-content-wrapper { white-space: pre-wrap; }
      `;
      container.appendChild(styleEl);
    } catch (e) {
      // ignore style injection errors
    }

    // Cleanup when content changes or component unmounts
    return () => {
      try {
        const injected = container.querySelector('style[data-protected-style]');
        if (injected && injected.parentNode) injected.parentNode.removeChild(injected);
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`protected-content-wrapper ${className}`}
      data-protected="true"
      onCopy={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onCut={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onPaste={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDragStart={(e) => {
        e.preventDefault();
        return false;
      }}
      style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
      }}
    />
  );
}
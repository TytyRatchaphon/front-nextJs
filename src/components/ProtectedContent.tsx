"use client";

import { useEffect, useRef } from "react";

interface ProtectedContentProps {
  content: string;
  className?: string;
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
    const originalQuerySelector = container.querySelector;
    const originalQuerySelectorAll = container.querySelectorAll;

    container.querySelector = function () {
      return null;
    } as any;

    container.querySelectorAll = function () {
      return [] as any;
    } as any;
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

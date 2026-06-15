"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TocItem } from '@/hooks/useHtmlToc';

interface PolicySidebarProps {
  toc: TocItem[];
}

const POLICY_PAGES = [
  { path: '/policy-privacy', label: 'นโยบายความเป็นส่วนตัว' },
  { path: '/policy-conditions', label: 'เงื่อนไขการใช้บริการ' },
  { path: '/other-policy', label: 'ข้อกำหนดอื่นๆ' },
];

export default function PolicySidebar({ toc }: PolicySidebarProps) {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId = '';
      for (const item of toc) {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 200) {
            currentActiveId = item.id;
            break;
          }
        }
      }
      if (currentActiveId) setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  const scrollToElement = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  };

  return (
    <div className="w-full flex-shrink-0 lg:w-64">
      <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="mb-4 text-lg font-bold text-gray-900">ข้อตกลงการใช้บริการ</h3>
        <ul className="space-y-1">
          {POLICY_PAGES.map((page) => {
            const isActivePage = pathname === page.path;
            
            return (
              <li key={page.path} className="flex flex-col">
                <Link
                  href={page.path}
                  className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActivePage 
                      ? 'bg-red-50 text-red-600' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {page.label}
                </Link>
                
                {/* TOC for the active page */}
                {isActivePage && toc.length > 0 && (
                  <ul className="mt-1 ml-4 space-y-1 border-l-2 border-red-100 pl-3">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={(e) => scrollToElement(e, item.id)}
                          className={`block py-1 text-[13px] transition-colors ${
                            activeId === item.id 
                              ? 'text-red-600 font-semibold' 
                              : 'text-gray-500 hover:text-red-500'
                          }`}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();

  // Hide footer on read pages
  if (pathname?.startsWith('/read')) {
    return null;
  }

  return <Footer />;
}

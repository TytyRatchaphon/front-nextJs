import Image from 'next/image';
import Link from 'next/link';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { resolveSettingsImageSrc } from '@/utils/imageUtils';
import {
  DEFAULT_APP_STORE_URL,
  DEFAULT_PLAY_STORE_URL,
  normalizeAppStoreUrl,
  normalizePlayStoreUrl,
} from '@/utils/storeLinkUtils';

// ... imports

export default function Footer() {
  const { settings } = useWebsiteSettings();
  const playStoreLink = normalizePlayStoreUrl(settings?.play_store, DEFAULT_PLAY_STORE_URL);
  const appStoreLink = normalizeAppStoreUrl(settings?.app_store, DEFAULT_APP_STORE_URL);


  const bgImage = `url(${resolveSettingsImageSrc(settings?.img_footer_sm, '/images/Footer-sm.png')})`;

  return (
    <footer
      className="w-full bg-no-repeat bg-cover bg-top mt-12 relative"
      style={{
        backgroundImage: bgImage,
        minHeight: '500px'
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 pt-[180px] sm:pt-[220px] lg:pt-[280px] pb-8 flex flex-col h-full justify-between">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* ... columns 1-3 ... */}
          <div className="flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-gray-800">บริการของเรา</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              {/* <li><Link href="#" className="hover:text-red-500">วิธีการซื้ออีบุ๊ก</Link></li> */}
              <li><Link href="/how-payment" className="hover:text-red-500">วิธีเติมเหรียญ / ระบบเหรียญ</Link></li>
              <li><Link href="/writer-nc-policy" className="hover:text-red-500">คู่มือนักเขียน</Link></li>
              <li><Link href="/faq" className="hover:text-red-500">คำถามที่พบบ่อย (FAQ)</Link></li>
            </ul>
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-gray-800">ข้อกำหนดและนโยบาย</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><Link href="/policy-privacy" className="hover:text-red-500">นโยบายความเป็นส่วนตัว</Link></li>
              <li><Link href="/policy-conditions" className="hover:text-red-500">ข้อกำหนดการใช้งาน</Link></li>
            </ul>
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-gray-800">เกี่ยวกับเรา</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><Link href="/about-us" className="hover:text-red-500">เกี่ยวกับ EnjoyBook</Link></li>
              {/* <li><Link href="/article" className="hover:text-red-500">ข่าวสารและกิจกรรม</Link></li> */}
            </ul>
          </div>
          <div className="flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-gray-800">ติดต่อเรา</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>{settings?.address || '-'}</li>
              <li>{settings?.email || 'support@enjoybook.co'}</li>
              <li>{settings?.phone || '-'}</li>
              <li>{settings?.work_time || '-'}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12">
              <Image src={resolveSettingsImageSrc(settings?.logo, '/images/ejb-footer.png')} alt="EnjoyBook Logo" fill className="object-contain" />
            </div>
            {settings?.img_play_store && (
              <Link href={playStoreLink} className="relative w-[140px] h-[45px] block">
                <Image src={resolveSettingsImageSrc(settings.img_play_store, '/images/google-play.png')} alt="Google Play" fill className="object-contain " />
              </Link>
            )}
            {settings?.img_app_store && (
              <Link href={appStoreLink} className="relative w-[140px] h-[45px] block">
                <Image src={resolveSettingsImageSrc(settings.img_app_store, '/images/app-store.png')} alt="App Store" fill className="object-contain" />
              </Link>
            )}
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 text-gray-400">
            <div className="flex items-center gap-4">
              <a href={settings?.fb_link || '#'} aria-label="Facebook" className="hover:opacity-80 transition-opacity">
                <Image src={resolveSettingsImageSrc(settings?.social1, '/images/social-1.png')} alt="Facebook" width={32} height={32} className="w-8 h-8 object-contain" unoptimized />
              </a>
              <a href={settings?.ig_link || '#'} aria-label="Instagram" className="hover:opacity-80 transition-opacity">
                <Image src={resolveSettingsImageSrc(settings?.social4, '/images/social-2.png')} alt="Instagram" width={32} height={32} className="w-8 h-8 object-contain" unoptimized />
              </a>
              <a href={settings?.line_link || '#'} aria-label="Line" className="hover:opacity-80 transition-opacity">
                <Image src={resolveSettingsImageSrc(settings?.social2, '/images/social-3.png')} alt="Line" width={32} height={32} className="w-8 h-8 object-contain" unoptimized />
              </a>
              <a href={settings?.tiktok_link || '#'} aria-label="Tiktok" className="hover:opacity-80 transition-opacity">
                <Image src={resolveSettingsImageSrc(settings?.social6, '/images/social-1.png')} alt="Tiktok" width={32} height={32} className="w-8 h-8 object-contain" unoptimized />
              </a>
            </div>
            <p className="text-xs mt-2 ">Copyright © EnjoyBook CO., LTD.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}


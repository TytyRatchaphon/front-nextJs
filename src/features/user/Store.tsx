'use client'

import { StoreBanner } from '@/components/Banner'
import React from 'react'
import Image from 'next/image'
import { Tabs } from 'antd'

type StoreItem = {
  id: number;
  name: string;
  desc?: string;
  price: string;
  img?: string;
  category?: 'enjoybook' | 'item' | 'promo' | 'special';
}

const MOCK_ITEMS: StoreItem[] = [
  { id: 1, name: 'เหรียญ 100', desc: 'ใช้งานเพื่อซื้อบทเพิ่ม', price: '฿29', img: '/images/coin-pack-1.png', category: 'enjoybook' },
  { id: 2, name: 'เหรียญ 500', desc: 'คุ้มค่าสำหรับนักอ่านบ่อย', price: '฿129', img: '/images/coin-pack-2.png', category: 'enjoybook' },
  { id: 3, name: 'แพ็คพิเศษ', desc: 'โบนัสเพิ่ม 10%', price: '฿249', img: '/images/coin-pack-3.png', category: 'promo' },
  { id: 4, name: 'สมัครสมาชิก VIP', desc: 'ประหยัดและรับสิทธิพิเศษ', price: '฿199/เดือน', img: '/images/vip.png', category: 'special' },
  { id: 5, name: 'กาชาไอเท็ม', desc: 'ไอเท็มสุ่มพิเศษ', price: '฿49', img: '/images/gacha-pack.png', category: 'item' },
]

function Store() {
  return (
    <div className="pb-20">
      <StoreBanner />

      {/* Payment summary row (matches the provided mock) */}
      <div className="max-w-[1128px] mx-auto px-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Main coin pill */}
            <div className="flex items-center gap-1.5 bg-white rounded-full shadow-sm" style={{ width: '108px', height: '32px', padding: '0 4px 0 10px' }}>
              <Image src="/images/e-coin.png" alt="Gold Coin" width={24} height={24}/>
              <span className="font-primary text-gray-900 text-sm">120</span>
              <button className="rounded-full flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0" style={{ width: '25px', height: '25px', backgroundColor: '#7CB342' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 0.5V9.5M0.5 5H9.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Small badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-4 bg-white border border-gray-200 px-3 py-1 rounded-full">
                <Image src="/images/ejb-stamp.png" alt="Package" width={24} height={24} />
                <span className="text-xs text-gray-700">84</span>
                <Image src="/images/money-bag.png" alt="Package" width={24} height={24} />
                <span className="text-xs text-gray-700">95</span>
                <Image src="/images/rose.png" alt="Package" width={24} height={24} />
                <span className="text-xs text-gray-700">580</span>
                <Image src="/images/heart.png" alt="Package" width={24} height={24} />
                <span className="text-xs text-gray-700">320</span>
                <Image src="/images/gacha.png" alt="Package" width={24} height={24} />
                <span className="text-xs text-gray-700">320</span>
                <Image src="/images/exp.png" alt="Package" width={24} height={24} />    
                <span className="text-xs text-gray-700">320</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span>ประวัติการชำระ</span>
          </div>
        </div>
      </div>

      {/* Store content area with Tabs (like MyBook) */}
      <div className="max-w-[1128px] mx-auto px-4 mt-8">
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: 'all',
              label: (
                <div className='flex items-center gap-2'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <g clipPath="url(#clip0_1334_2725)">
                    <path d="M10.1922 3.90412C10.4891 3.60881 10.4891 3.12756 10.1922 2.83224L9.09999 1.74006L9.10155 1.74162C8.81249 1.45256 8.31561 0.955681 7.61249 0.254119C7.28124 -0.0693187 6.7453 -0.0661937 6.41718 0.261931L0.26405 6.41037C0.185325 6.48856 0.122846 6.58155 0.0802105 6.68399C0.0375748 6.78643 0.015625 6.89629 0.015625 7.00725C0.015625 7.1182 0.0375748 7.22806 0.0802105 7.3305C0.122846 7.43294 0.185325 7.52593 0.26405 7.60412L6.41561 13.751C6.57422 13.9093 6.78916 13.9983 7.01327 13.9983C7.23737 13.9983 7.45232 13.9093 7.61093 13.751L10.1906 11.1729C10.4875 10.8776 10.4875 10.3963 10.1906 10.101C10.048 9.95911 9.85505 9.87946 9.65389 9.87946C9.45274 9.87946 9.25977 9.95911 9.11718 10.101L7.16405 12.0572C7.0828 12.1385 6.95624 12.1385 6.87499 12.0572L1.96092 7.14787C1.87967 7.06662 1.87967 6.94006 1.96092 6.85881L6.87343 1.94943C6.87968 1.94318 6.88749 1.93849 6.89374 1.93224C6.97499 1.86818 7.08749 1.87443 7.16249 1.94943L9.11874 3.90412C9.41561 4.20099 9.89686 4.20099 10.1922 3.90412ZM5.38436 7.0385C5.38436 7.47859 5.55935 7.90066 5.87084 8.21185C6.18233 8.52304 6.60479 8.69787 7.0453 8.69787C7.48581 8.69787 7.90827 8.52304 8.21976 8.21185C8.53125 7.90066 8.70624 7.47859 8.70624 7.0385C8.70624 6.5984 8.53125 6.17633 8.21976 5.86514C7.90827 5.55395 7.48581 5.37912 7.0453 5.37912C6.60479 5.37912 6.18233 5.55395 5.87084 5.86514C5.55935 6.17633 5.38436 6.5984 5.38436 7.0385ZM13.7625 6.43537L11.8422 4.52443C11.5453 4.22912 11.0641 4.22912 10.7687 4.52599C10.6982 4.59626 10.6422 4.67978 10.6039 4.77175C10.5657 4.86372 10.546 4.96234 10.546 5.06193C10.546 5.16153 10.5657 5.26014 10.6039 5.35211C10.6422 5.44408 10.6982 5.5276 10.7687 5.59787L12.0656 6.89318C12.1469 6.97443 12.1469 7.10099 12.0656 7.18224L10.7875 8.45881C10.7169 8.52907 10.6609 8.61259 10.6227 8.70456C10.5845 8.79653 10.5648 8.89515 10.5648 8.99474C10.5648 9.09434 10.5845 9.19295 10.6227 9.28493C10.6609 9.3769 10.7169 9.46041 10.7875 9.53068C10.9301 9.67257 11.1231 9.75221 11.3242 9.75221C11.5254 9.75221 11.7183 9.67257 11.8609 9.53068L13.7641 7.62912C13.8425 7.55073 13.9047 7.45763 13.9471 7.35515C13.9895 7.25267 14.0113 7.14282 14.0111 7.03192C14.011 6.92102 13.9889 6.81123 13.9463 6.70886C13.9036 6.60649 13.8411 6.51355 13.7625 6.43537Z" fill="black" fillOpacity="0.85"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_1334_2725">
                    <rect width="14" height="14" fill="white"/>
                    </clipPath>
                    </defs>
                  </svg>
                  ทั้งหมด
                </div>
              ) ,
              children: (
                <div className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {MOCK_ITEMS.map((it) => (
                      <div key={it.id} className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center text-center">
                        <div className="w-28 h-28 mb-3 relative">
                          <Image src={it.img || '/images/ejb.png'} alt={it.name} width={112} height={112} className="object-contain" />
                        </div>
                        <h3 className="font-medium text-lg mb-1">{it.name}</h3>
                        <p className="text-xs text-gray-500 mb-4">{it.desc}</p>
                        <div className="mt-auto w-full">
                          <div className="flex items-center justify-between px-2">
                            <div className="text-red-600 font-semibold">{it.price}</div>
                            <button className="bg-red-600 text-white px-4 py-2 rounded">ซื้อ</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            },
            {
              key: 'enjoybook',
              label: (
                <div className='flex items-center gap-2'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <g clipPath="url(#clip0_1334_2725)">
                    <path d="M10.1922 3.90412C10.4891 3.60881 10.4891 3.12756 10.1922 2.83224L9.09999 1.74006L9.10155 1.74162C8.81249 1.45256 8.31561 0.955681 7.61249 0.254119C7.28124 -0.0693187 6.7453 -0.0661937 6.41718 0.261931L0.26405 6.41037C0.185325 6.48856 0.122846 6.58155 0.0802105 6.68399C0.0375748 6.78643 0.015625 6.89629 0.015625 7.00725C0.015625 7.1182 0.0375748 7.22806 0.0802105 7.3305C0.122846 7.43294 0.185325 7.52593 0.26405 7.60412L6.41561 13.751C6.57422 13.9093 6.78916 13.9983 7.01327 13.9983C7.23737 13.9983 7.45232 13.9093 7.61093 13.751L10.1906 11.1729C10.4875 10.8776 10.4875 10.3963 10.1906 10.101C10.048 9.95911 9.85505 9.87946 9.65389 9.87946C9.45274 9.87946 9.25977 9.95911 9.11718 10.101L7.16405 12.0572C7.0828 12.1385 6.95624 12.1385 6.87499 12.0572L1.96092 7.14787C1.87967 7.06662 1.87967 6.94006 1.96092 6.85881L6.87343 1.94943C6.87968 1.94318 6.88749 1.93849 6.89374 1.93224C6.97499 1.86818 7.08749 1.87443 7.16249 1.94943L9.11874 3.90412C9.41561 4.20099 9.89686 4.20099 10.1922 3.90412ZM5.38436 7.0385C5.38436 7.47859 5.55935 7.90066 5.87084 8.21185C6.18233 8.52304 6.60479 8.69787 7.0453 8.69787C7.48581 8.69787 7.90827 8.52304 8.21976 8.21185C8.53125 7.90066 8.70624 7.47859 8.70624 7.0385C8.70624 6.5984 8.53125 6.17633 8.21976 5.86514C7.90827 5.55395 7.48581 5.37912 7.0453 5.37912C6.60479 5.37912 6.18233 5.55395 5.87084 5.86514C5.55935 6.17633 5.38436 6.5984 5.38436 7.0385ZM13.7625 6.43537L11.8422 4.52443C11.5453 4.22912 11.0641 4.22912 10.7687 4.52599C10.6982 4.59626 10.6422 4.67978 10.6039 4.77175C10.5657 4.86372 10.546 4.96234 10.546 5.06193C10.546 5.16153 10.5657 5.26014 10.6039 5.35211C10.6422 5.44408 10.6982 5.5276 10.7687 5.59787L12.0656 6.89318C12.1469 6.97443 12.1469 7.10099 12.0656 7.18224L10.7875 8.45881C10.7169 8.52907 10.6609 8.61259 10.6227 8.70456C10.5845 8.79653 10.5648 8.89515 10.5648 8.99474C10.5648 9.09434 10.5845 9.19295 10.6227 9.28493C10.6609 9.3769 10.7169 9.46041 10.7875 9.53068C10.9301 9.67257 11.1231 9.75221 11.3242 9.75221C11.5254 9.75221 11.7183 9.67257 11.8609 9.53068L13.7641 7.62912C13.8425 7.55073 13.9047 7.45763 13.9471 7.35515C13.9895 7.25267 14.0113 7.14282 14.0111 7.03192C14.011 6.92102 13.9889 6.81123 13.9463 6.70886C13.9036 6.60649 13.8411 6.51355 13.7625 6.43537Z" fill="black" fillOpacity="0.85"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_1334_2725">
                    <rect width="14" height="14" fill="white"/>
                    </clipPath>
                    </defs>
                  </svg>
                  สินค้าจาก enjoybook
                </div>
              ),
              children: (
                <div className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {MOCK_ITEMS.filter(i => i.category === 'enjoybook').map(it => (
                      <div key={it.id} className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center text-center">
                        <div className="w-28 h-28 mb-3 relative">
                          <Image src={it.img || '/images/ejb.png'} alt={it.name} width={112} height={112} className="object-contain" />
                        </div>
                        <h3 className="font-medium text-lg mb-1">{it.name}</h3>
                        <p className="text-xs text-gray-500 mb-4">{it.desc}</p>
                        <div className="mt-auto w-full">
                          <div className="flex items-center justify-between px-2">
                            <div className="text-red-600 font-semibold">{it.price}</div>
                            <button className="bg-red-600 text-white px-4 py-2 rounded">ซื้อ</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            },
            {
              key: 'item',
              label: (
                <div className='flex items-center gap-2'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <g clipPath="url(#clip0_1334_2725)">
                    <path d="M10.1922 3.90412C10.4891 3.60881 10.4891 3.12756 10.1922 2.83224L9.09999 1.74006L9.10155 1.74162C8.81249 1.45256 8.31561 0.955681 7.61249 0.254119C7.28124 -0.0693187 6.7453 -0.0661937 6.41718 0.261931L0.26405 6.41037C0.185325 6.48856 0.122846 6.58155 0.0802105 6.68399C0.0375748 6.78643 0.015625 6.89629 0.015625 7.00725C0.015625 7.1182 0.0375748 7.22806 0.0802105 7.3305C0.122846 7.43294 0.185325 7.52593 0.26405 7.60412L6.41561 13.751C6.57422 13.9093 6.78916 13.9983 7.01327 13.9983C7.23737 13.9983 7.45232 13.9093 7.61093 13.751L10.1906 11.1729C10.4875 10.8776 10.4875 10.3963 10.1906 10.101C10.048 9.95911 9.85505 9.87946 9.65389 9.87946C9.45274 9.87946 9.25977 9.95911 9.11718 10.101L7.16405 12.0572C7.0828 12.1385 6.95624 12.1385 6.87499 12.0572L1.96092 7.14787C1.87967 7.06662 1.87967 6.94006 1.96092 6.85881L6.87343 1.94943C6.87968 1.94318 6.88749 1.93849 6.89374 1.93224C6.97499 1.86818 7.08749 1.87443 7.16249 1.94943L9.11874 3.90412C9.41561 4.20099 9.89686 4.20099 10.1922 3.90412ZM5.38436 7.0385C5.38436 7.47859 5.55935 7.90066 5.87084 8.21185C6.18233 8.52304 6.60479 8.69787 7.0453 8.69787C7.48581 8.69787 7.90827 8.52304 8.21976 8.21185C8.53125 7.90066 8.70624 7.47859 8.70624 7.0385C8.70624 6.5984 8.53125 6.17633 8.21976 5.86514C7.90827 5.55395 7.48581 5.37912 7.0453 5.37912C6.60479 5.37912 6.18233 5.55395 5.87084 5.86514C5.55935 6.17633 5.38436 6.5984 5.38436 7.0385ZM13.7625 6.43537L11.8422 4.52443C11.5453 4.22912 11.0641 4.22912 10.7687 4.52599C10.6982 4.59626 10.6422 4.67978 10.6039 4.77175C10.5657 4.86372 10.546 4.96234 10.546 5.06193C10.546 5.16153 10.5657 5.26014 10.6039 5.35211C10.6422 5.44408 10.6982 5.5276 10.7687 5.59787L12.0656 6.89318C12.1469 6.97443 12.1469 7.10099 12.0656 7.18224L10.7875 8.45881C10.7169 8.52907 10.6609 8.61259 10.6227 8.70456C10.5845 8.79653 10.5648 8.89515 10.5648 8.99474C10.5648 9.09434 10.5845 9.19295 10.6227 9.28493C10.6609 9.3769 10.7169 9.46041 10.7875 9.53068C10.9301 9.67257 11.1231 9.75221 11.3242 9.75221C11.5254 9.75221 11.7183 9.67257 11.8609 9.53068L13.7641 7.62912C13.8425 7.55073 13.9047 7.45763 13.9471 7.35515C13.9895 7.25267 14.0113 7.14282 14.0111 7.03192C14.011 6.92102 13.9889 6.81123 13.9463 6.70886C13.9036 6.60649 13.8411 6.51355 13.7625 6.43537Z" fill="black" fillOpacity="0.85"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_1334_2725">
                    <rect width="14" height="14" fill="white"/>
                    </clipPath>
                    </defs>
                  </svg>
                  ไอเท็ม
                </div>
              ),
              children: (
                <div className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {MOCK_ITEMS.filter(i => i.category === 'item').map(it => (
                      <div key={it.id} className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center text-center">
                        <div className="w-28 h-28 mb-3 relative">
                          <Image src={it.img || '/images/ejb.png'} alt={it.name} width={112} height={112} className="object-contain" />
                        </div>
                        <h3 className="font-medium text-lg mb-1">{it.name}</h3>
                        <p className="text-xs text-gray-500 mb-4">{it.desc}</p>
                        <div className="mt-auto w-full">
                          <div className="flex items-center justify-between px-2">
                            <div className="text-red-600 font-semibold">{it.price}</div>
                            <button className="bg-red-600 text-white px-4 py-2 rounded">ซื้อ</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            },
            {
              key: 'promo',
              label: (
                <div className='flex items-center gap-2'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <g clipPath="url(#clip0_1334_2725)">
                    <path d="M10.1922 3.90412C10.4891 3.60881 10.4891 3.12756 10.1922 2.83224L9.09999 1.74006L9.10155 1.74162C8.81249 1.45256 8.31561 0.955681 7.61249 0.254119C7.28124 -0.0693187 6.7453 -0.0661937 6.41718 0.261931L0.26405 6.41037C0.185325 6.48856 0.122846 6.58155 0.0802105 6.68399C0.0375748 6.78643 0.015625 6.89629 0.015625 7.00725C0.015625 7.1182 0.0375748 7.22806 0.0802105 7.3305C0.122846 7.43294 0.185325 7.52593 0.26405 7.60412L6.41561 13.751C6.57422 13.9093 6.78916 13.9983 7.01327 13.9983C7.23737 13.9983 7.45232 13.9093 7.61093 13.751L10.1906 11.1729C10.4875 10.8776 10.4875 10.3963 10.1906 10.101C10.048 9.95911 9.85505 9.87946 9.65389 9.87946C9.45274 9.87946 9.25977 9.95911 9.11718 10.101L7.16405 12.0572C7.0828 12.1385 6.95624 12.1385 6.87499 12.0572L1.96092 7.14787C1.87967 7.06662 1.87967 6.94006 1.96092 6.85881L6.87343 1.94943C6.87968 1.94318 6.88749 1.93849 6.89374 1.93224C6.97499 1.86818 7.08749 1.87443 7.16249 1.94943L9.11874 3.90412C9.41561 4.20099 9.89686 4.20099 10.1922 3.90412ZM5.38436 7.0385C5.38436 7.47859 5.55935 7.90066 5.87084 8.21185C6.18233 8.52304 6.60479 8.69787 7.0453 8.69787C7.48581 8.69787 7.90827 8.52304 8.21976 8.21185C8.53125 7.90066 8.70624 7.47859 8.70624 7.0385C8.70624 6.5984 8.53125 6.17633 8.21976 5.86514C7.90827 5.55395 7.48581 5.37912 7.0453 5.37912C6.60479 5.37912 6.18233 5.55395 5.87084 5.86514C5.55935 6.17633 5.38436 6.5984 5.38436 7.0385ZM13.7625 6.43537L11.8422 4.52443C11.5453 4.22912 11.0641 4.22912 10.7687 4.52599C10.6982 4.59626 10.6422 4.67978 10.6039 4.77175C10.5657 4.86372 10.546 4.96234 10.546 5.06193C10.546 5.16153 10.5657 5.26014 10.6039 5.35211C10.6422 5.44408 10.6982 5.5276 10.7687 5.59787L12.0656 6.89318C12.1469 6.97443 12.1469 7.10099 12.0656 7.18224L10.7875 8.45881C10.7169 8.52907 10.6609 8.61259 10.6227 8.70456C10.5845 8.79653 10.5648 8.89515 10.5648 8.99474C10.5648 9.09434 10.5845 9.19295 10.6227 9.28493C10.6609 9.3769 10.7169 9.46041 10.7875 9.53068C10.9301 9.67257 11.1231 9.75221 11.3242 9.75221C11.5254 9.75221 11.7183 9.67257 11.8609 9.53068L13.7641 7.62912C13.8425 7.55073 13.9047 7.45763 13.9471 7.35515C13.9895 7.25267 14.0113 7.14282 14.0111 7.03192C14.011 6.92102 13.9889 6.81123 13.9463 6.70886C13.9036 6.60649 13.8411 6.51355 13.7625 6.43537Z" fill="black" fillOpacity="0.85"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_1334_2725">
                    <rect width="14" height="14" fill="white"/>
                    </clipPath>
                    </defs>
                  </svg>
                  โปรโมชั่น
                </div>
              ),
              children: (
                <div className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {MOCK_ITEMS.filter(i => i.category === 'promo').map(it => (
                      <div key={it.id} className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center text-center">
                        <div className="w-28 h-28 mb-3 relative">
                          <Image src={it.img || '/images/ejb.png'} alt={it.name} width={112} height={112} className="object-contain" />
                        </div>
                        <h3 className="font-medium text-lg mb-1">{it.name}</h3>
                        <p className="text-xs text-gray-500 mb-4">{it.desc}</p>
                        <div className="mt-auto w-full">
                          <div className="flex items-center justify-between px-2">
                            <div className="text-red-600 font-semibold">{it.price}</div>
                            <button className="bg-red-600 text-white px-4 py-2 rounded">ซื้อ</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            },
            {
              key: 'special',
              label: (
                <div className='flex items-center gap-2'>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <g clipPath="url(#clip0_1334_2725)">
                    <path d="M10.1922 3.90412C10.4891 3.60881 10.4891 3.12756 10.1922 2.83224L9.09999 1.74006L9.10155 1.74162C8.81249 1.45256 8.31561 0.955681 7.61249 0.254119C7.28124 -0.0693187 6.7453 -0.0661937 6.41718 0.261931L0.26405 6.41037C0.185325 6.48856 0.122846 6.58155 0.0802105 6.68399C0.0375748 6.78643 0.015625 6.89629 0.015625 7.00725C0.015625 7.1182 0.0375748 7.22806 0.0802105 7.3305C0.122846 7.43294 0.185325 7.52593 0.26405 7.60412L6.41561 13.751C6.57422 13.9093 6.78916 13.9983 7.01327 13.9983C7.23737 13.9983 7.45232 13.9093 7.61093 13.751L10.1906 11.1729C10.4875 10.8776 10.4875 10.3963 10.1906 10.101C10.048 9.95911 9.85505 9.87946 9.65389 9.87946C9.45274 9.87946 9.25977 9.95911 9.11718 10.101L7.16405 12.0572C7.0828 12.1385 6.95624 12.1385 6.87499 12.0572L1.96092 7.14787C1.87967 7.06662 1.87967 6.94006 1.96092 6.85881L6.87343 1.94943C6.87968 1.94318 6.88749 1.93849 6.89374 1.93224C6.97499 1.86818 7.08749 1.87443 7.16249 1.94943L9.11874 3.90412C9.41561 4.20099 9.89686 4.20099 10.1922 3.90412ZM5.38436 7.0385C5.38436 7.47859 5.55935 7.90066 5.87084 8.21185C6.18233 8.52304 6.60479 8.69787 7.0453 8.69787C7.48581 8.69787 7.90827 8.52304 8.21976 8.21185C8.53125 7.90066 8.70624 7.47859 8.70624 7.0385C8.70624 6.5984 8.53125 6.17633 8.21976 5.86514C7.90827 5.55395 7.48581 5.37912 7.0453 5.37912C6.60479 5.37912 6.18233 5.55395 5.87084 5.86514C5.55935 6.17633 5.38436 6.5984 5.38436 7.0385ZM13.7625 6.43537L11.8422 4.52443C11.5453 4.22912 11.0641 4.22912 10.7687 4.52599C10.6982 4.59626 10.6422 4.67978 10.6039 4.77175C10.5657 4.86372 10.546 4.96234 10.546 5.06193C10.546 5.16153 10.5657 5.26014 10.6039 5.35211C10.6422 5.44408 10.6982 5.5276 10.7687 5.59787L12.0656 6.89318C12.1469 6.97443 12.1469 7.10099 12.0656 7.18224L10.7875 8.45881C10.7169 8.52907 10.6609 8.61259 10.6227 8.70456C10.5845 8.79653 10.5648 8.89515 10.5648 8.99474C10.5648 9.09434 10.5845 9.19295 10.6227 9.28493C10.6609 9.3769 10.7169 9.46041 10.7875 9.53068C10.9301 9.67257 11.1231 9.75221 11.3242 9.75221C11.5254 9.75221 11.7183 9.67257 11.8609 9.53068L13.7641 7.62912C13.8425 7.55073 13.9047 7.45763 13.9471 7.35515C13.9895 7.25267 14.0113 7.14282 14.0111 7.03192C14.011 6.92102 13.9889 6.81123 13.9463 6.70886C13.9036 6.60649 13.8411 6.51355 13.7625 6.43537Z" fill="black" fillOpacity="0.85"/>
                    </g>
                    <defs>
                    <clipPath id="clip0_1334_2725">
                    <rect width="14" height="14" fill="white"/>
                    </clipPath>
                    </defs>
                  </svg>
                  ร้านค้าพิเศษ
                </div>
              ),
              children: (
                <div className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {MOCK_ITEMS.filter(i => i.category === 'special').map(it => (
                      <div key={it.id} className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center text-center">
                        <div className="w-28 h-28 mb-3 relative">
                          <Image src={it.img || '/images/ejb.png'} alt={it.name} width={112} height={112} className="object-contain" />
                        </div>
                        <h3 className="font-medium text-lg mb-1">{it.name}</h3>
                        <p className="text-xs text-gray-500 mb-4">{it.desc}</p>
                        <div className="mt-auto w-full">
                          <div className="flex items-center justify-between px-2">
                            <div className="text-red-600 font-semibold">{it.price}</div>
                            <button className="bg-red-600 text-white px-4 py-2 rounded">ซื้อ</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          ]}
          className="font-primary custom-tabs-red"
        />

        <style jsx>{`
        :global(.ant-tabs-tab:hover) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab:hover svg path) {
          fill: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active .ant-tabs-tab-btn) {
          color: #dc2626 !important;
        }
        :global(.ant-tabs-tab-active svg path) {
          fill: #dc2626 !important;
        }
        :global(.ant-tabs-ink-bar) {
          background: #dc2626 !important;
        }
      `}</style>
      </div>
    </div>
  )
}

export default Store
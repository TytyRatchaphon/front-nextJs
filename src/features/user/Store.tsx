'use client'

import { StoreBanner } from '@/components/home/Banner'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Tabs, Spin, Modal, notification } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { fetchStoreData, buyStorePack } from '@/services/apiServices'
import { useAuthStore } from '@/stores/authStore'
import type { StoreCategory, StorePack } from '@/types/api'
import Link from 'next/link'
import StoreCard from '@/components/utility/StoreCard'
import { useWebsiteStore } from '@/stores/websiteStore';
import GifLoader from '@/components/utility/GifLoader';

// Define explicit type for UserWallet state to match what we display
interface UserBalance {
  coin: number;
  flower: number;
  heart: number;
  stamp: number;
  exp_point: number;
}

function Store() {
  const { token } = useAuthStore()
  const [storeData, setStoreData] = useState<StoreCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<UserBalance>({
    coin: 0,
    flower: 0,
    heart: 0,
    stamp: 0,
    exp_point: 0
  })
  
  const [selectedPack, setSelectedPack] = useState<StorePack | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const { updateToken } = useAuthStore()
  const [api, contextHolder] = notification.useNotification();

  const handleBuyClick = (pack: any) => {
     setSelectedPack(pack)
  }
  const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
    return `${src}?w=${width ?? ''}&q=${quality ?? 75}`
  }
  const handleConfirmBuy = async () => {
    if (!selectedPack) return;
    
    try {
        setConfirmLoading(true);
        const res = await buyStorePack(selectedPack.store_pack_id);
        
        if (res.status === 'success' || res.code === 200) {
            api.success({
              message: 'ซื้อสินค้าสำเร็จ',
              description: 'ขอบคุณที่อุดหนุนสินค้าของเรา',
              icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
              placement: 'topRight',
            });
            if (res.data && res.data.token) {
                updateToken(res.data.token);
            }
            setSelectedPack(null);
        } else {
             api.error({
               message: 'เกิดข้อผิดพลาด',
               description: res.message || 'ไม่สามารถซื้อสินค้าได้',
               placement: 'topRight',
             });
        }
    } catch (error: any) {
        api.error({
           message: 'เกิดข้อผิดพลาด',
           description: error?.response?.data?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
           placement: 'topRight',
        });
    } finally {
        setConfirmLoading(false);
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await fetchStoreData()
        setStoreData(data)
      } catch (error) {
        console.error('Failed to load store data', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!token) {
      setBalance({ coin: 0, flower: 0, heart: 0, stamp: 0, exp_point: 0 })
      return
    }

    try {
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
      const decoded = JSON.parse(jsonPayload)
      
      const coins = Number(decoded.coin ?? decoded.coins ?? decoded.goldCoins ?? decoded.gold_coin ?? 0)
      const flowers = Number(decoded.flower ?? decoded.flowers ?? 0)
      const hearts = Number(decoded.heart ?? decoded.hearts ?? 0)
      
      // Attempt to find other fields if they exist in token, otherwise 0
      const stamp = Number(decoded.stamp ?? 0)
      const exp = Number(decoded.exp ?? decoded.exp_point ?? 0)

      setBalance({
        coin: coins,
        flower: flowers,
        heart: hearts,
        stamp: stamp,
        exp_point: exp
      })

    } catch (e) {
      console.warn("Failed to decode token for store balance", e)
    }
  }, [token])

  // Generate Tab Items
  const tabItems = storeData.map((category) => ({
    key: String(category.store_id),
    label: (
      <div className='flex items-center gap-2'>
        <span className="capitalize">{category.name}</span>
      </div>
    ),
    children: (
      <div className="mt-4">
        {category.StorePacks && category.StorePacks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {category.StorePacks.map((pack) => (
              <StoreCard key={pack.store_pack_id} pack={pack} onBuy={handleBuyClick} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">ไม่มีสินค้าในหมวดหมู่นี้</div>
        )}
      </div>
    )
  }));
  
  const allPacks = storeData.flatMap(c => c.StorePacks || []);
  const allTabItem = {
    key: 'all',
    label: (
      <div className='flex items-center gap-2'>
        <span>ทั้งหมด</span>
      </div>
    ),
    children: (
      <div className="mt-4">
         {allPacks.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {allPacks.map((pack) => (
                <StoreCard key={`all-${pack.store_pack_id}`} pack={pack} onBuy={handleBuyClick} />
              ))}
           </div>
         ) : (
           <div className="py-12 text-center text-gray-400">ไม่มีสินค้า</div>
         )}
      </div>
    )
  };

  const finalItems = [allTabItem, ...tabItems];
  const {settings} = useWebsiteStore(); 
  return (
    <div className="pb-20">
      {contextHolder}
      <StoreBanner />

      {/* Payment summary row */}
      <div className="max-w-[1128px] mx-auto px-4 mt-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {/* Main coin pill */}
            <div className="flex items-center gap-1.5 bg-white rounded-full shadow-sm flex-shrink-0" style={{ height: '32px', padding: '0 4px 0 10px' }}>
              <Image src={settings?.coin || '/images/e-coin.png'} alt="Gold Coin" width={24} height={24} loader={imageLoader}/>
              <span className="font-primary text-gray-900 text-sm font-bold">{balance.coin.toLocaleString()}</span>
              <button className="rounded-full flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0" style={{ width: '25px', height: '25px', backgroundColor: '#7CB342' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 0.5V9.5M0.5 5H9.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Small badges pills */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-4 bg-white border border-gray-200 px-3 py-1 rounded-full whitespace-nowrap">
                {/* Stamp */}
                <div className="flex items-center gap-1">
                    <Image src={settings?.bigstamp || '/images/ejb-stamp.png'} alt="Stamp" width={20} height={20} loader={imageLoader}/>
                    <span className="text-xs text-gray-700 font-medium">{balance.stamp.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center gap-1">
                    <Image src={settings?.flower || '/images/rose.png'} alt="Rose" width={20} height={20} loader={imageLoader}/>
                    <span className="text-xs text-gray-700 font-medium">{balance.flower.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Image src={settings?.heart || '/images/heart.png'} alt="Heart" width={20} height={20} loader={imageLoader}/>
                    <span className="text-xs text-gray-700 font-medium">{balance.heart.toLocaleString()}</span>
                </div>
                 <div className="flex items-center gap-1">
                    <Image src={settings?.exp || '/images/exp.png'} alt="Exp" width={20} height={20} loader={imageLoader}/>
                    <span className="text-xs text-gray-700 font-medium">{balance.exp_point.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          <Link href="/wallet/history">
            <div className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-auto hover:text-red-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
                <span>ประวัติการชำระ</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Store content area with Tabs */}
      <div className="max-w-[1128px] mx-auto px-4 mt-8">
        {loading ? (
            <GifLoader className="h-64" width={150} height={150} />
        ) : (
            <Tabs
            defaultActiveKey="all"
            items={finalItems}
            className="font-primary custom-tabs-red"
            />
        )}

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
      
      <Modal
        title={<div className="text-center text-xl font-bold font-primary">{selectedPack?.name}</div>}
        open={!!selectedPack}
        onCancel={() => setSelectedPack(null)}
        footer={null}
        centered
        width={380}
        style={{ maxWidth: '95vw', top: 20 }}
        closeIcon={null}
        className="custom-modal-store font-primary"
      >
         <div className="flex flex-col items-center pt-2 pb-6">
            <div className="w-full bg-gray-50 rounded-lg p-4 flex items-center gap-4 mb-6">
                 <div className="relative w-24 h-24 flex-shrink-0">
                    <Image 
                        src={selectedPack?.img || '/images/ejb.png'} 
                        alt={selectedPack?.name || 'Pack'} 
                        width={100}
                        height={100}
                        loader={imageLoader}
                        className="object-contain"
                    />
                 </div>
                 <div className="flex-1">
                     <h3 className="font-bold text-base mb-1">รายละเอียด</h3>
                     <p className="text-sm text-gray-600">- {selectedPack?.name} x1</p>
                 </div>
            </div>

            <div className="text-center mb-6">
                <h3 className="font-bold text-lg mb-2">จำนวนที่ซื้อ x 1</h3>
                <div className="flex items-center justify-center gap-2 text-xl font-bold">
                    <span>ใช้</span>
                    {selectedPack?.type_use === 'coin' ? (
                       <Image src={settings?.coin || '/images/e-coin.png'} width={28} height={28} alt="Coin" />
                    ) : null}
                    <span>{selectedPack?.price.toLocaleString()}</span>
                    {selectedPack?.type_use !== 'coin' && <span>{selectedPack?.type_use}</span>}
                </div>
            </div>

            <div className="flex items-center gap-3 w-full">
                <button 
                    onClick={() => setSelectedPack(null)}
                    className="flex-1 border border-red-500 text-red-500 py-2.5 rounded-full font-bold hover:bg-red-50 transition-colors"
                >
                    ยกเลิก
                </button>
                <button 
                     onClick={handleConfirmBuy}
                     disabled={confirmLoading}
                     className="flex-1 bg-[#E60000] !text-white py-2.5 rounded-full font-bold hover:bg-red-700 transition-colors flex justify-center items-center"
                >
                    {confirmLoading ? <Spin size="small" className="!mr-2 custom-spin-white" /> : null}
                    ยืนยัน
                </button>
            </div>
         </div>
         <style jsx global>{`
           .custom-spin-white .ant-spin-dot-item {
              background-color: white !important;
           }
         `}</style>
      </Modal>
    </div>
  )
}

export default Store
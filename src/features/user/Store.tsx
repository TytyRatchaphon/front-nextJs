"use client";
import * as React from "react";

import '@/components/home/Banner';
import { useState } from 'react'
import { Tabs, Image as AntdImage, App } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import StoreCard from '@/components/utility/StoreCard'
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import GifLoader from '@/components/utility/GifLoader';
import Link from 'next/link'
import AmountPill from '@/components/utility/AmountPill';
import FreeCoinPill from '@/components/utility/FreeCoinPill'
import StampPill from '@/components/utility/StampPill';
import RPPill from '@/components/utility/RPPill';
import FastTicketPill from '@/components/utility/FastTicketPill';

import { useStoreData } from './hooks/useStoreData';
import { useStorePurchase } from './hooks/useStorePurchase';
import { StoreBalanceBanner } from './components/StoreBalanceBanner';
import { StoreBuyModal } from './components/StoreBuyModal';


function Store() {
  const { user } = useAuthStore();
  const { settings } = useWebsiteSettings();
  const { notification: api } = App.useApp();
  const [avatarError, setAvatarError] = useState(false);

  const {
    storeData,
    loading,
    activeStoreTab,
    setActiveStoreTab,
    bannerError,
    setBannerError,
    storePromoSrc,
  } = useStoreData();

  const purchase = useStorePurchase({ notification: api, settings });

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
              <StoreCard key={pack.store_pack_id} pack={pack} onBuy={purchase.handleBuyClick} />
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
              <StoreCard key={`all-${pack.store_pack_id}`} pack={pack} onBuy={purchase.handleBuyClick} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">ไม่มีสินค้า</div>
        )}
      </div>
    )
  };

  const finalItems = [allTabItem, ...tabItems];

  return (
    <div className="pb-20">
      <div className="max-w-[1128px] mx-auto px-4 mt-6">
        <StoreBalanceBanner
          user={user}
          settings={settings}
          avatarError={avatarError}
          onAvatarError={() => setAvatarError(true)}
        />

        <div className="mt-4 relative overflow-hidden rounded-[30px] border border-stone-200 bg-white shadow-sm">
          <div className="relative h-[176px] sm:h-[204px] lg:h-[256px]">
            <AntdImage
              src={storePromoSrc}
              alt="Store promotion banner"
              width="100%"
              height="100%"
              style={{ objectFit: 'cover' }}
              preview={false}
              className="!absolute !inset-0"
              onError={() => setBannerError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/45 via-stone-950/10 to-transparent" />

            <div className="relative z-10 flex h-full items-start justify-between p-4">
              <div className="rounded-full bg-white/88 px-3 py-1 text-[11px] font-semibold text-stone-900 backdrop-blur-sm">
                Store Banner
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden payment summary row (kept for potential future use) */}
      <div className="hidden max-w-[1128px] mx-auto px-4 mt-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <AmountPill
              amount={user?.coin ?? 0}
              icon={settings?.coin || '/images/e-coin.png'}
            />
            <FreeCoinPill amount={user?.freecoin ?? 0} />
            <StampPill amount={user?.stamp ?? 0} />
            <RPPill amount={user?.current_rp ?? 0} />
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
            activeKey={activeStoreTab}
            onChange={(tabKey) => setActiveStoreTab(tabKey)}
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

      <StoreBuyModal
        selectedPack={purchase.selectedPack}
        selectedQty={purchase.selectedQty}
        confirmLoading={purchase.confirmLoading}
        addressInput={purchase.addressInput}
        onAddressInputChange={purchase.setAddressInput}
        phoneInput={purchase.phoneInput}
        onPhoneInputChange={purchase.setPhoneInput}
        selectedStorePackListIds={purchase.selectedStorePackListIds}
        onSelectableOptionChange={purchase.handleSelectableOptionChange}
        onIncrement={purchase.handleIncrement}
        onDecrement={purchase.handleDecrement}
        onConfirmBuy={purchase.handleConfirmBuy}
        onClose={purchase.handleCloseBuyModal}
        getSelectionLimit={purchase.getSelectionLimit}
        settings={settings}
      />
    </div>
  )
}

export default Store

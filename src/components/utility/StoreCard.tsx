import React from 'react';
import Image from 'next/image';
import { StorePack } from '@/types/api';
import { useWebsiteStore } from '@/stores/websiteStore';
import { App } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

interface StoreCardProps {
  pack: StorePack;
  onBuy: (pack: StorePack) => void;
}

const imageLoader = ({ src, width, quality }: { src: string; width?: number; quality?: number }): string => {
  return `${src}?w=${width ?? ''}&q=${quality ?? 100}`
}

const StoreCard: React.FC<StoreCardProps> = ({ pack, onBuy }) => {
  const { settings } = useWebsiteStore()
  const { user } = useAuthStore();
  const { modal } = App.useApp();
  const router = useRouter();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center text-center h-full hover:shadow-md transition-shadow">
      <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3 relative flex-shrink-0">
        <Image
          src={pack.img || '/images/ejb.png'}
          alt={pack.name}
          fill
          className="object-contain"
          loader={imageLoader}
        />
      </div>
      <h3 className="font-medium text-base sm:text-lg mb-1 line-clamp-1" title={pack.name}>
        {pack.name}
      </h3>
      <p className="text-xs text-gray-500 mb-4 line-clamp-2 min-h-[2.5em] opacity-80">
        {pack.name}
      </p>

      <div className="mt-auto w-full">
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="text-red-600 font-semibold whitespace-nowrap flex items-center gap-1 text-sm sm:text-base mb-1">
            {['coin', 'heart', 'flower', 'stamp', 'exp', 'freecoin'].includes(pack.type_use) ? (
              <>
                <Image
                  src={
                    pack.type_use === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                      pack.type_use === 'heart' ? (settings?.heart || "/images/heart.png") :
                        pack.type_use === 'flower' ? (settings?.flower || "/images/flower.png") :
                          pack.type_use === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                            pack.type_use === 'exp' ? (settings?.exp || "/images/exp.png") :
                              (settings?.freecoin || "/images/freecoin.png")
                  }
                  width={20}
                  height={20}
                  alt={pack.type_use}
                  loader={imageLoader}
                />
                <span>{pack.price.toLocaleString()}</span>
              </>
            ) : (
              <>
                {pack.price.toLocaleString()} {pack.type_use}
              </>
            )}
          </div>
          <button
            onClick={() => {
              if (pack.can_purchase !== false) {
                  onBuy(pack)
              }
            }}
            disabled={pack.can_purchase === false}
            className={`w-full !text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded transition-colors text-xs sm:text-sm ${pack.can_purchase === false
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
              }`}
          >
            {pack.can_purchase === false ? 'เป็นเจ้าของแล้ว' : 'ซื้อ'}
          </button>
        </div>
      </div>
    </div>
  );
};


export default StoreCard;

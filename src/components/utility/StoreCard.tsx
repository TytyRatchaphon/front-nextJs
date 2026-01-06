import React from 'react';
import Image from 'next/image';
import { StorePack } from '@/types/api';

interface StoreCardProps {
  pack: StorePack;
  onBuy: (pack: StorePack) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ pack, onBuy }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col items-center text-center h-full hover:shadow-md transition-shadow">
      <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3 relative flex-shrink-0">
        <Image
          src={pack.img || '/images/ejb.png'}
          alt={pack.name}
          fill
          className="object-contain"
          unoptimized
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
            {pack.type_use === 'coin' ? (
              <>
                <Image src="/images/e-coin.png" width={20} height={20} alt="coin" />
                <span>{pack.price.toLocaleString()}</span>
              </>
            ) : (
              <>
                {pack.price.toLocaleString()} {pack.type_use}
              </>
            )}
          </div>
          <button
            onClick={() => onBuy(pack)}
            className="w-full bg-red-600 !text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded hover:bg-red-700 transition-colors text-xs sm:text-sm"
          >
            ซื้อ
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;

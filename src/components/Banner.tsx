import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

function Banner() {
  return (
      <div className="w-full flex justify-center bg-white">
        <div className="max-w-[1440px] w-full flex flex-col relative">
          {/* Banner content */}
          <div className="h-[536px] flex justify-center items-center mt-[-32] mb-[-24]">
            <div className="w-[1128px] h-[385px] relative">
              <Image 
                src="/images/hero-banner.png"
                alt="GET APP NOW Banner"
                className="w-full h-full object-contain"
                width={1128}
                height={385}
              />
            </div>
          </div>
          {/* Menu buttons */}
          <div className="absolute bottom-[-35px] left-1/2 transform -translate-x-1/2 flex justify-center gap-4 z-20">
            <Link href="#" className="w-[270px] h-[71px]">
              <Image 
                src="/images/how-to.png" 
                alt="Howto"
                className="w-full h-full rounded-lg hover:opacity-90 transition"
                width={270}
                height={71}
              />
            </Link>
            <Link href="#" className="w-[270px] h-[71px]">
              <Image 
                src="/images/promotion.png" 
                alt="Promotion"
                className="w-full h-full rounded-lg hover:opacity-90 transition"
                width={270}
                height={71}
              />
            </Link>
            <Link href="#" className="w-[270px] h-[71px]">
              <Image 
                src="/images/blog.png" 
                alt="Blog"
                className="w-full h-full rounded-lg hover:opacity-90 transition"
                width={270}
                height={71}
              />
            </Link>
            <Link href="#" className="w-[270px] h-[71px]">
              <Image 
                src="/images/campaign.png" 
                alt="Campaign"
                className="w-full h-full rounded-lg hover:opacity-90 transition"
                width={270}
                height={71}
              />
            </Link>
          </div>
        </div>
      </div>
  )
}

export default Banner

import DailyPopup from "@/components/DailyPopup";
import { BackToTopButton } from "@/components/BackToTopButton";
import Link from "next/link";
import Banner from "@/components/Banner";
import Image from "next/image";

export default function Home() {
  return (
    <div className="bg-white font-primary font-medium flex flex-col items-center transition-colors duration-300">
      <Banner />
      {/* Main Content Section */}
      <div className="w-full flex justify-center mt-32">
        <div className="max-w-[1440px] w-full px-[156px]">
          {/* Spotlight & New Novels Section */}
          <div className="grid grid-cols-2 gap-16 mb-8">
            {/* Spotlight Column */}
            <div className="w-[536px] h-[805px]">
              <h2 className="font-bold text-2xl mb-2 text-black">Spotlight</h2>
              <div className="w-full h-[1px] bg-gray-200 mb-4"></div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                <Link href="#" key={i}>
                  <div key={i} className="flex flex-col w-[168px] h-[355px] group">
                    <div className="relative shadow-md rounded-lg overflow-hidden bg-white">
                      <Image 
                        src="/images/ejb.png"
                        alt="ENJOY BOOK"
                        width={168}
                        height={237}
                        className="w-[168px] h-[237px] object-cover"
                      />
                    </div>
                    <div className="mt-2">
                      <p className=" text-black text-lg group-hover:text-red-600 transition-colors duration-300">หนังสือเล่มใหม่</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>1k</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>10k</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span>10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                ))}
              </div>
            </div>

            {/* New Novels Column */}
            <div>
              <h2 className="font-bold text-2xl mb-2 text-black">นิยายมาใหม่</h2>
              <div className="w-full h-[1px] bg-gray-200 mb-4"></div>
              <div className="flex flex-col gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-[91px] h-[128px] rounded overflow-hidden flex-shrink-0">
                      <Image 
                        src="/images/ejb.png"
                        alt="ENJOY BOOK"
                        className="w-full h-full object-cover"
                        width={91}
                        height={128}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-black">หนังสือเล่มใหม่</h3>
                      <p className="text-sm text-gray-600">ดูแล้ว</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M12.62 20.81C12.28 20.93 11.72 20.93 11.38 20.81C8.48 19.82 2 15.69 2 8.69C2 5.6 4.49 3.1 7.56 3.1C9.38 3.1 10.99 3.98 12 5.34C13.01 3.98 14.63 3.1 16.44 3.1C19.51 3.1 22 5.6 22 8.69C22 15.69 15.52 19.82 12.62 20.81Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>1k</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M15.58 12C15.58 13.98 13.98 15.58 12 15.58C10.02 15.58 8.42 13.98 8.42 12C8.42 10.02 10.02 8.42 12 8.42C13.98 8.42 15.58 10.02 15.58 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 20.27C15.53 20.27 18.82 18.19 21.11 14.59C22.01 13.18 22.01 10.81 21.11 9.4C18.82 5.8 15.53 3.72 12 3.72C8.47 3.72 5.18 5.8 2.89 9.4C1.99 10.81 1.99 13.18 2.89 14.59C5.18 18.19 8.47 20.27 12 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>10k</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                            <path d="M3 7H21M3 12H21M3 17H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span>10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 10 Ranking Section - 1227x575 */}
          <div className="w-full mt-12 mb-24">
            <div className="text-left mb-4">
              <h2 className="text-xl font-normal text-black"></h2>
            </div>
            
            <div className="relative w-[1227px] h-[575px] mx-auto mb-24">
              {/* Background Image */}
              <Image 
                src="/images/black-board.png"
                alt="Black Board"
                className="absolute inset-0 w-full h-full object-fill overflow-visible"
                width={1227}
                height={575}
              />
              
              {/* Top 3 Podium Area - New structure based on old website */}
              <div className="absolute left-12 -bottom-8 z-30">
                <div className="relative">
                  {/* Podium base image */}
                  <Image 
                    src="/images/podium.png"
                    alt="Podium"
                    className="w-full h-auto"
                    width={600}
                    height={200}
                  />
                  
                  {/* Three cards grid positioned above podium */}
                  <div className="absolute -top-68 left-0 right-0 grid grid-cols-3 gap-4 px-4">
                    {/* Rank 2 - Left (middle height) */}
                    <div className="flex justify-start items-start w-full mt-16">
                      <div className="flex flex-col justify-center items-center gap-2 w-full">
                        <div className="w-[95px] h-[133px] flex items-center justify-center rounded-lg shadow-md cursor-pointer relative border-4 border-[#d8d8c8] overflow-hidden mx-auto transition-transform duration-300 hover:scale-110">
                          <Image 
                            src="/images/ejb3.png"
                            alt="Rank 2"
                            className="w-full h-full object-cover"
                            width={95} 
                            height={133}
                          />
                        </div>
                        {/* Read button */}
                        <button className="bg-red-600 rounded hover:bg-red-700 transition-colors w-[70px] h-[32px] mx-auto mt-4 flex items-center justify-center">
                          <span className="text-gray-200 text-sm">
                            อ่านนิยาย
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Rank 1 - Center (highest with crown) */}
                    <div className="flex justify-start items-start w-full mt-0">
                      <div className="flex flex-col justify-center items-center gap-2 w-full">
                        <div className="w-[117px] h-[163px] flex items-center justify-center rounded-lg shadow-md cursor-pointer relative border-4 border-amber-300 overflow-hidden mx-auto transition-transform duration-300 hover:scale-110">
                          <Image 
                            src="/images/ejb3.png"
                            alt="Rank 1"
                            className="w-full h-full object-cover"
                            width={117}
                            height={163}
                          />
                        </div>
                        {/* Read button */}
                        <button className="bg-red-600 rounded hover:bg-red-700 transition-colors w-[70px] h-[32px] mx-auto mt-6 flex items-center justify-center">
                          <span className="text-gray-200 text-sm">
                            อ่านนิยาย
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Rank 3 - Right (lowest) */}
                    <div className="flex justify-start items-start w-full mt-32">
                      <div className="flex flex-col justify-center items-center gap-2 w-full">
                        <div className="w-[97px] h-[135px] flex items-center justify-center rounded-lg shadow-md cursor-pointer relative border-4 border-[#e8ad74] overflow-hidden mx-auto transition-transform duration-300 hover:scale-110">
                          <Image 
                            src="/images/ejb3.png"
                            alt="Rank 3"
                            className="w-full h-full object-cover"
                            width={97}
                            height={135}
                          />
                        </div>
                        {/* Read button */}
                        <button className="bg-red-600 rounded hover:bg-red-700 transition-colors w-[70px] h-[32px] mx-auto mt-4 flex items-center justify-center">
                          <span className="text-gray-200 text-sm">
                            อ่านนิยาย
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ranks 4-10 - Right side in 2 rows */}
              <div className="absolute top-42 right-16 z-10">
                {/* Top row: Ranks 4-7 */}
                <div className="flex gap-14 mb-16">
                  {[4, 5, 6, 7].map((rank) => (
                    <div key={rank} className="relative w-[86px] h-[122px]  bg-white overflow-visible">
                      <Image 
                        src="/images/ejb.png"
                        alt={`Rank ${rank}`}
                        className="w-full h-full object-cover "
                        width={86}
                        height={122}
                      />
                      <Image 
                        src={`/images/${rank}.png`}
                        alt={`${rank}`}
                        className="absolute -bottom-2 -right-2 w-[29px] h-[30px]"
                        width={29}
                        height={30}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Bottom row: Ranks 8-10 (shifted left) */}
                <div className="flex gap-14 ml-16">
                  {[8, 9, 10].map((rank) => (
                    <div key={rank} className="relative w-[85px] h-[120px] rounded shadow-lg bg-white overflow-visible">
                      <Image 
                        src="/images/ejb.png"
                        alt={`Rank ${rank}`}
                        className="w-full h-full object-cover rounded"
                        width={85}
                        height={120}
                      />
                      <Image 
                        src={`/images/${rank}.png`}
                        alt={`${rank}`}
                        className={`absolute -bottom-2 -right-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${rank === 10 ? 'w-[58px] h-[30px]' : 'w-[29px] h-[30px]'}`}
                        width={rank === 10 ? 58 : 29}
                        height={30}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Chalk slot underneath ranks 4-10 */}
                <Image 
                  src="/images/chalk-slot.png"
                  alt="Chalk Slot"
                  className="absolute -bottom-30 left-0 z-20 w-[600px] h-[61px]"
                  width={600}
                  height={61}
                />
              </div>
              {/* Bottom orange/gold bar */}
            </div>
          </div>
           <BackToTopButton />         
          <DailyPopup />
        </div>
      </div>
    </div>
  );
}

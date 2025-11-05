import React from 'react'
import Image from 'next/image'


function Redeem() {
  return (
    <div className='min-h-screen' style={{ backgroundColor: '#FFF7F7' }}>
        {/* Background Section */}
        <div className='relative w-full h-[400px]'>
            <Image 
                src="https://img.enjoybook.co/img/redeembg.png" 
                alt="Redeem Background" 
                fill
                className='object-cover'
                priority
            />
        </div>
        
        {/* Card Below Background */}
        <div className='flex justify-center px-4 mt-18'>
            <div className='bg-white rounded-2xl shadow-lg p-6 w-[320px]'>
                {/* Header with Logo */}
                <div className='flex items-center justify-center gap-2 mb-6'>
                    <Image 
                        src="https://img.enjoybook.co/img/logo2025omxesk8HIC0602112905.png" 
                        alt="Logo" 
                        width={24} 
                        height={24}
                    />
                    <span className='text-gray-800 font-primary font-medium'>Enjoybook Coin</span>
                </div>
                
                {/* Coins Display */}
                <div className='flex justify-between items-center'>
                    {/* Gold Coin */}
                    <div className='flex items-center gap-2'>
                        <Image 
                            src="https://img.enjoybook.co/img/coin2025of4oReSgpR0109170013.png" 
                            alt="Gold Coin" 
                            width={20} 
                            height={20}
                        />
                        <span className='text-2xl font-bold text-gray-900'>0</span>
                    </div>
                    
                    {/* Red Coin */}
                    <div className='flex items-center gap-2'>
                        <Image 
                            src="https://img.enjoybook.co/img/freecoinEJB2024KwnlwebuY1pjqzSXy7es1224140652.png" 
                            alt="Red Coin" 
                            width={20} 
                            height={20}
                        />
                        <span className='text-2xl font-bold text-gray-900'>0</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Redeem Code Section */}
        <div className='flex justify-center px-4 mt-8'>
            <div className='w-[500px] max-w-full'>
                {/* Title */}
                <h2 className='text-2xl font-bold text-center mb-2 font-primary text-black'>รหัสแลกรับ</h2>
                
                {/* Description */}
                <p className='text-center text-sm mb-6 font-primary text-gray-700'>
                    กรอกรหัส Redeem ของคุณทางด้านล่างเพื่อรับเหรียญ
                </p>
                
                {/* Input Field */}
                <div className='bg-white rounded-full shadow-md px-6 py-3 flex items-center'>
                    <input 
                        type='text'
                        placeholder='กรอกรหัสของคุณที่นี่'
                        className='flex-1 outline-none font-primary text-gray-700'
                    />
                </div>
            </div>
        </div>
    </div>
  )
}

export default Redeem
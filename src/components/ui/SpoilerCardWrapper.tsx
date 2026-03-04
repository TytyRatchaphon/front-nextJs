import React, { useState } from 'react';

interface SpoilerCardWrapperProps {
  children: React.ReactNode;
  isSpoiler: boolean;
  onClick: () => void;
}

export default function SpoilerCardWrapper({ children, isSpoiler, onClick }: SpoilerCardWrapperProps) {
  const [isRevealed, setIsRevealed] = useState(!isSpoiler);

  if (!isSpoiler || isRevealed) {
    return (
      <div 
        onClick={onClick}
        className="bg-white rounded-xl shadow-sm border border-red-200 p-4 h-[240px] flex flex-col hover:shadow-md transition-shadow cursor-pointer relative"
      >
        {children}
      </div>
    );
  }

  return (
    <div 
      className="bg-[#FFE5E5] rounded-xl shadow-sm border border-[#E33527]/30 h-[240px] flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group p-4"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsRevealed(true);
      }}
    >
      <div className="absolute inset-0 opacity-10 blur-sm pointer-events-none p-4 flex flex-col border border-[#FEE8D6]">
        {children}
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#E33527] mb-2 drop-shadow-sm">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-[#E33527] font-bold text-center px-4 leading-snug drop-shadow-sm">
          รีวิวนี้มีสปอยล์<br/>คลิกเพื่ออ่าน
        </span>
      </div>
    </div>
  );
}

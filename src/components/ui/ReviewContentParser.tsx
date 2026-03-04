import React, { useState } from 'react';
import parse, { DOMNode, Element, domToReact } from 'html-react-parser';

const SpoilerWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  return (
    <div className="relative block my-1 group/spoiler w-full">
      <div 
        className={`transition-all duration-300 rounded-lg p-3 w-full border border-[#FFE5E5] ${!isRevealed ? 'bg-[#FFE5E5]/50 text-transparent blur-sm cursor-pointer select-none' : 'bg-[#FFE5E5]/20 text-[#E33527] cursor-auto'}`}
        onClick={(e) => {
          if (!isRevealed) {
            e.stopPropagation();
            e.preventDefault();
            setIsRevealed(true);
          }
        }}
      >
        {children || 'เนื้อหาสปอยล์'}
      </div>
      {!isRevealed && (
         <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer pointer-events-none">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#E33527] mb-1">
             <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
             <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
           </svg>
           <span className="bg-[#E33527] text-white text-xs px-3 py-1 rounded-full shadow-sm">
             กดปุ่มนี้เพื่อเปิดสปอยล์
           </span>
         </div>
      )}
    </div>
  );
};

export const parseReviewContent = (content: string) => {
  if (!content) return null;
  
  // Replace [SPOILER]...[/SPOILER] tags with <spoiler>...</spoiler>
  // using a regex that handles across newlines, extracting ONLY the group inside
  const processed = content.replace(/\[SPOILER\]([\s\S]*?)\[\/SPOILER\]/gi, '<spoiler>$1</spoiler>');

  return parse(processed, {
    replace: (domNode) => {
      // Check if it's our custom spoiler tag
      if (domNode instanceof Element && domNode.name === 'spoiler') {
        return (
          <SpoilerWrapper>
            {domToReact(domNode.children as DOMNode[])}
          </SpoilerWrapper>
        );
      }
    }
  });
};

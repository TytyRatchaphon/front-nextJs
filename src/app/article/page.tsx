import React from 'react';
import Article from "@/features/article/Article";

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-white flex justify-center w-full">
      <div className="max-w-[1440px] w-full px-4  py-8">
         <Article />
      </div>
    </div>
  );
}
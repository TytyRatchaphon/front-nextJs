"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

type TagType = "new" | "bestseller" | "completed" | null;

interface NovelCardProps {
  novel: {
    bookID: string;
    img: string;
    name: string;
    user_id: string;
    view: number;
    type: string;
  };
  tag?: TagType; // เพิ่ม prop สำหรับกำหนดประเภท tag
}

const formatViews = (num: number | undefined | null): string => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(0) + "K";
  return num.toString();
};

// Component สำหรับแสดง Tag ต่างๆ
const NovelTag = ({ type }: { type: TagType }) => {
  if (!type) return null;

  // Standardized to match CardBook.tsx
  const tagConfig = {
    new: {
      image: "/images/new.png", 
      alt: "new-tag",
      width: 50,
      height: 50,
      className: "absolute top-2 right-1"
    },
    bestseller: {
      image: "/images/bestseller.png",
      alt: "bestseller-tag", 
      width: 46,
      height: 54,
       className: "absolute -top-2 -right-0" // Matches CardBook
    },
    completed: {
      // CardBook uses HTML for completed, but sticking to image here for now if available, 
      // OR better: match CardBook exactly.
      // CardBook uses: "bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md z-20"
      // If type is 'completed', let's return that component.
      
      // However, to minimal change, let's just fix "New" first.
      image: "https://img.enjoybook.co/img/tag/completedTag.png?w=256&q=75",
      alt: "completed-tag",
      width: 40,
      height: 20, // dummy
      className: "absolute -left-1 top-2" // Keep old pos for others?
    },
  };

  if (type === 'new') {
      return (
        <div className="absolute top-2 right-1 z-10 w-[50px] h-[50px]">
             <Image 
                src="/images/new.png"
                alt="new"
                width={50}
                height={50}
                unoptimized
             />
        </div>
      );
  }
  
  if (type === 'bestseller') {
       return (
        <div className="absolute -top-2 -right-0 z-10 w-[46px] h-[54px]">
             <Image 
                src="/images/bestseller.png"
                alt="bestseller"
                width={46}
                height={54}
                unoptimized
             />
        </div>
      );
  }

  // Fallback for original logic
  const config = tagConfig[type]; 
  // ... but checking legacy config for completed
  
  return (
    <div className="relative w-full">
      <Image
        alt={config.alt}
        loading="lazy"
        width={100}
        height={100}
        decoding="async"
        src={config.image}
        className="absolute -left-1 sm:-left-1.5 top-2 sm:top-3 z-10 w-8 sm:w-10 h-auto"
        style={{
          color: "transparent",
        }}
        unoptimized
      />
    </div>
  );
};

export default function NovelCard({ novel, tag = null }: NovelCardProps) {
  if (!novel) return null;

  return (
    <div className="w-[168px] h-[355px]">
      <Link
        className="flex flex-col cursor-pointer text-start hover:text-primary bg-transparent rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
        href={`/detail/${novel.bookID}`}
        style={{ width: "168px", height: "355px" }}
      >
        <div
          className="relative mb-2"
          style={{ width: "100%", overflow: "visible" }}
        >
          {/* แสดง Tag ตามประเภทที่กำหนด */}
          <NovelTag type={tag} />

          <div
            className="flex items-center justify-center rounded-lg shadow-md cursor-pointer relative"
            style={{ width: "168px", height: "237px" }}
          >
            <Image
              alt={novel.name}
              loading="lazy"
              decoding="async"
              fill
              sizes="168px"
              className="rounded-lg object-cover"
              src={novel.img}
            />
          </div>
        </div>

        <div className="px-2 flex-1 flex flex-col justify-between min-h-0">
          <div className="mb-2">
            <h3
              className="font-semibold line-clamp-2 leading-tight text-black hover:text-primary novel-name text-sm block mb-1 overflow-hidden"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {novel.name}
            </h3>
            <span
              className="text-gray-500 text-xs line-clamp-1 overflow-hidden author-name block"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {novel.user_id}
            </span>
          </div>

          <div className="flex flex-row justify-between items-center pb-2 flex-shrink-0">
            <span className="text-xs text-gray-600 flex flex-row items-center gap-1">
              <Image
                src="/assets/icons/heart_outline.png"
                alt="likes"
                width={16}
                height={16}
                className="grayscale opacity-60"
              />
              1k
            </span>

            <span className="text-xs text-gray-600 flex flex-row items-center gap-1">
              <Image
                src="/assets/icons/eye.png"
                alt="views"
                width={16}
                height={16}
                className="grayscale opacity-60"
              />
              {formatViews(novel.view)}
            </span>

            <span className="text-xs text-gray-600 flex flex-row items-center gap-1">
              <Image
                src="/assets/icons/menu.png"
                alt="comments"
                width={16}
                height={16}
                className="grayscale opacity-60"
              />
              10
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
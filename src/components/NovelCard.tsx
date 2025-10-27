'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface NovelCardProps {
  novel: {
    bookID: string;
    img: string;
    name: string;
    user_id: string;
    view: number;
    type: string;
  };
}

const formatViews = (num: number | undefined | null): string => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(0) + "K";
  return num.toString();
};

export default function NovelCard({ novel }: NovelCardProps) {
  if (!novel) return null;

  return (
    <div
      className="swiper-slide items-start SwiperSlide"
      style={{ width: "151.667px", marginRight: "10px" }}
    >
      <Link
        className="flex flex-col cursor-pointer p-2 text-start hover:text-primary bg-transparent"
        href={`/book/${novel.bookID}`}
        style={{ width: "100%", height: "auto" }}
      >
        <div className="relative" style={{ width: "100%", overflow: "visible" }}>
          <div className="relative" style={{ width: "100%" }}>
            <Image
              alt="new-tag"
              loading="lazy"
              width={100}
              height={100}
              decoding="async"
              src="https://img.enjoybook.co/img/tag/newTag.png?w=256&q=75"
              style={{
                color: "transparent",
                width: "2.5rem",
                height: "auto",
                position: "absolute",
                left: "-6px",
                top: "0.7rem",
                zIndex: 10,
              }}
            />
          </div>

          <div
            className="flex items-center justify-center rounded-lg shadow-md cursor-pointer relative"
            style={{ width: "100%", height: "auto", aspectRatio: "1 / 1.454" }}
          >
            <Image
              alt={novel.name}
              loading="lazy"
              decoding="async"
              fill
              sizes="400px"
              className="rounded-lg"
              src={novel.img}
            />
          </div>
        </div>

        <div>
          <span className="font-semibold line-clamp-2 leading-[1.2] min-h-[2.4rem] overflow-x-hidden mt-1 hover:text-primary text-black novel-name">
            {novel.name}
          </span>
          <span className="text-black text-sm text-nowrap line-clamp-1 overflow-x-hidden author-name">
            {novel.user_id}
          </span>
        </div>

        <div className="flex flex-row justify-start gap-2 mt-1">
          <span className="text-sm text-black flex flex-row items-center gap-1">
            👁 {formatViews(novel.view)}
          </span>

          <span className="text-sm text-black flex flex-row items-center gap-1">
            📖 {novel.type}
          </span>
        </div>
      </Link>
    </div>
  );
}

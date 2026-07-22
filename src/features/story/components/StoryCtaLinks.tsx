import { LinkOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import { useState } from "react";

import type { StoryLink } from "../types/storyTypes";

const StoryCtaLinks = ({ links }: { links: StoryLink[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!links.length) return null;

  const openLink = (event: React.MouseEvent, url: string) => {
    event.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const visibleLinks = links.length > 3 ? links.slice(0, 2) : links;

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        {visibleLinks.map((link, index) => (
          <button
            key={`${link.url}-${index}`}
            type="button"
            onClick={(event) => openLink(event, link.url)}
            className="group flex flex-col items-center gap-1.5 hover:-translate-y-1 transition-transform"
          >
            <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center text-white shadow-lg bg-white/20 backdrop-blur-md border border-white/30 group-hover:bg-red-500 group-hover:border-red-500 group-hover:shadow-red-500/50 transition-all">
              <LinkOutlined className="text-xl" />
            </div>
            <span className="text-xs font-semibold text-white drop-shadow-md truncate max-w-[70px] text-center">{link.label}</span>
          </button>
        ))}
        {links.length > 3 ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(true);
            }}
            className="group flex flex-col items-center gap-1.5 hover:-translate-y-1 transition-transform"
          >
            <div className="w-[40px] h-[40px] rounded-full bg-black/60 flex items-center justify-center text-white shadow-lg backdrop-blur-md border border-white/20">
              <span className="text-xl leading-none -mt-2">...</span>
            </div>
            <span className="text-[10px] font-medium text-white drop-shadow-md">เพิ่มเติม</span>
          </button>
        ) : null}
      </div>
      <Modal title="เลือกลิงก์" open={isOpen} onCancel={() => setIsOpen(false)} footer={null} centered zIndex={10000}>
        <div className="flex flex-col gap-2 py-2">
          {links.slice(2).map((link, index) => (
            <button
              key={`${link.url}-${index}`}
              type="button"
              onClick={(event) => openLink(event, link.url)}
              className="w-full rounded-md bg-gray-100 px-4 py-3 text-left font-medium hover:bg-gray-200"
            >
              {link.label}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default StoryCtaLinks;

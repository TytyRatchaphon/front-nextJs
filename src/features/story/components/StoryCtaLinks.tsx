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
      <div className="flex flex-col items-center gap-2">
        {visibleLinks.map((link, index) => (
          <button
            key={`${link.url}-${index}`}
            type="button"
            onClick={(event) => openLink(event, link.url)}
            className="flex max-w-full items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-black shadow-lg hover:bg-gray-100"
          >
            <LinkOutlined />
            <span className="truncate">{link.label}</span>
          </button>
        ))}
        {links.length > 3 ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(true);
            }}
            className="rounded-full bg-black/60 px-4 py-2 font-medium text-white backdrop-blur-md hover:bg-black/80"
          >
            เพิ่มเติม
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

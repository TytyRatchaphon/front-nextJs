import React, { useState } from 'react';
import { StoryLink } from '../types/storyTypes';
import { Modal } from 'antd';
import { UpOutlined, LinkOutlined } from '@ant-design/icons';

interface StoryCtaLinksProps {
  links: StoryLink[];
}

const StoryCtaLinks: React.FC<StoryCtaLinksProps> = ({ links }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!links || links.length === 0) return null;

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const renderLinkButton = (link: StoryLink, fullWidth = false) => (
    <button
      key={link.url}
      onClick={(e) => handleLinkClick(e, link.url)}
      className={`px-5 py-2.5 bg-white hover:bg-gray-100 rounded-full !text-black font-semibold shadow-lg transition-colors flex items-center justify-center gap-2 ${fullWidth ? 'w-full' : 'w-auto'}`}
    >
      <LinkOutlined className="text-sm opacity-80" />
      <span>{link.label}</span>
    </button>
  );

  if (links.length === 1) {
    return (
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full px-8 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          {renderLinkButton(links[0])}
        </div>
      </div>
    );
  }

  if (links.length <= 3) {
    return (
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full px-8 flex flex-col gap-2 items-center pointer-events-none">
        {links.map((link, index) => (
          <div key={`${link.url}-${index}`} className="pointer-events-auto w-auto">
            {renderLinkButton(link, false)}
          </div>
        ))}
      </div>
    );
  }

  // More than 3 links
  const visibleLinks = links.slice(0, 2);
  const moreLinks = links.slice(2);

  return (
    <>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full px-8 flex flex-col gap-2 items-center pointer-events-none">
        {visibleLinks.map((link, index) => (
           <div key={`${link.url}-${index}`} className="pointer-events-auto w-auto">
             {renderLinkButton(link, false)}
           </div>
        ))}
        <button
          onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
          className="pointer-events-auto px-4 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white font-medium shadow-md flex items-center gap-2"
        >
          <UpOutlined className="text-xs" /> เพิ่มเติม
        </button>
      </div>

      <Modal
        title="เลือกลิงก์ที่ต้องการ"
        open={isModalOpen}
        onCancel={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
        footer={null}
        destroyOnHidden
        zIndex={10000} // above viewer
        centered
      >
        <div className="flex flex-col gap-3 py-4">
          {moreLinks.map((link, index) => (
            <button
              key={`${link.url}-${index}`}
              onClick={(e) => {
                handleLinkClick(e, link.url);
                setIsModalOpen(false);
              }}
              className="w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors font-medium text-black dark:text-white"
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

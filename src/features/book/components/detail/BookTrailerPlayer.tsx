"use client";

import { useRef, useEffect, useState } from "react";
import { Image as AntImage } from "antd";
import { Loader2, RotateCcw, AlertTriangle, Maximize2, X } from "lucide-react";
import type { BookDetailTrailer, BookDetailPresentation } from "@/types/book";
import { useBookTrailer } from "@/features/book/hooks/useBookTrailer";

interface BookTrailerPlayerProps {
  trailer: BookDetailTrailer;
  presentation?: BookDetailPresentation | null;
  poster: string;
}

export default function BookTrailerPlayer({ trailer, presentation, poster }: BookTrailerPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { mediaMode, playerState, errorMessage, retry } = useBookTrailer({
    trailer,
    presentation,
    videoRef,
  });

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        handleCloseModal(e as any);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const handleContainerClick = () => {
    const video = videoRef.current;
    if (!video || mediaMode !== "trailer" || playerState === "error" || playerState === "unsupported") return;

    setIsModalOpen(true);
    video.muted = false;
  };

  const handleCloseModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(false);
    
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }
  };

  return (
    <>
      <link href="https://unpkg.com/video.js@8/dist/video-js.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
  /* ================= GLOBALS OVERRIDE ================= */
  .video-js, .video-js * {
    font-family: VideoJS, var(--font-bai-jamjuree) !important;
  }

  /* ================= INLINE MODE ================= */
  .book-trailer-inline-container .vjs-control-bar,
  .book-trailer-inline-container .vjs-poster,
  .book-trailer-inline-container .vjs-big-play-button,
  .book-trailer-inline-container .vjs-loading-spinner,
  .book-trailer-inline-container .vjs-error-display { 
    display: none !important; 
  }
  
  .book-trailer-inline-container { position: absolute !important; inset: 0 !important; }

  .book-trailer-inline-container .video-js { 
    position: absolute !important; inset: 0 !important;
    width: 100% !important; height: 100% !important; 
    border-radius: 0.5rem; overflow: hidden !important; 
    background-color: transparent !important;
    pointer-events: none !important;
  }
  
  .book-trailer-inline-container .vjs-tech { 
    position: absolute !important; top: 50% !important; left: 50% !important; 
    width: 100% !important; height: auto !important; min-height: 100% !important; 
    aspect-ratio: 9 / 16 !important; object-fit: cover !important; 
    transform: translate(-50%, -50%) !important; 
    margin: 0 !important; padding: 0 !important; 
    max-width: none !important; max-height: none !important; 
  }

  /* ================= MODAL MODE ================= */
  .book-trailer-modal-container .video-js {
    width: 100% !important; height: 100% !important;
    border-radius: 0.75rem !important; 
    background-color: black !important;
    overflow: hidden !important;
  }

  .book-trailer-modal-container .vjs-tech {
    position: absolute !important; top: 0 !important; left: 0 !important;
    width: 100% !important; height: 100% !important;
    object-fit: contain !important;
    transform: none !important;
  }

  /* ================= YOUTUBE STYLE CONTROLS ================= */
  /* Transparent control bar gradient */
  .book-trailer-modal-container .vjs-control-bar {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0) 100%) !important;
    height: 48px !important;
    padding-bottom: 0 !important;
    display: flex !important;
    align-items: center !important;
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  /* Push settings, PiP, and Fullscreen to the right side */
  .book-trailer-modal-container .vjs-custom-control-spacer {
    display: flex !important;
    flex: 1 1 auto !important;
  }

  /* Center buttons vertically */
  .book-trailer-modal-container .vjs-control {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  
  /* Format time exactly like YouTube (e.g. 1:23 / 4:56) */
  .book-trailer-modal-container .vjs-time-control {
    align-items: center !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    padding: 0 !important;
  }
  
  .book-trailer-modal-container .vjs-current-time,
  .book-trailer-modal-container .vjs-time-divider,
  .book-trailer-modal-container .vjs-duration {
    display: flex !important;
    align-items: center !important;
  }

  .book-trailer-modal-container .vjs-current-time {
    padding-left: 8px !important;
    padding-right: 4px !important;
  }

  .book-trailer-modal-container .vjs-time-divider {
    padding: 0 2px !important;
    min-width: auto !important;
  }

  .book-trailer-modal-container .vjs-duration {
    padding-left: 4px !important;
    padding-right: 8px !important;
    color: #ccc !important;
  }

  /* Hide remaining time, live indicators, and unused menu buttons that cause gaps */
  .book-trailer-modal-container .vjs-remaining-time,
  .book-trailer-modal-container .vjs-live-control,
  .book-trailer-modal-container .vjs-seek-to-live-control,
  .book-trailer-modal-container .vjs-chapters-button,
  .book-trailer-modal-container .vjs-descriptions-button,
  .book-trailer-modal-container .vjs-subtitles-button,
  .book-trailer-modal-container .vjs-captions-button,
  .book-trailer-modal-container .vjs-audio-track-button {
    display: none !important;
  }

  /* Full width progress bar floating above controls (Real YouTube style) */
  .book-trailer-modal-container .vjs-progress-control {
    position: absolute !important;
    top: -10px !important;
    left: 12px !important;
    right: 12px !important;
    width: auto !important;
    height: 20px !important;
    display: flex !important;
    align-items: center !important;
  }

  /* Red progress bar */
  .book-trailer-modal-container .vjs-play-progress {
    background-color: #ef4444 !important; /* Tailwind red-500 */
  }
  
  /* Knob (Scrubber) */
  .book-trailer-modal-container .vjs-play-progress:before {
    font-size: 14px !important;
    color: #ef4444 !important;
    top: -0.35em !important;
    transition: transform 0.1s ease;
  }

  /* Make progress bar thinner by default, thicker on hover (YouTube style) */
  .book-trailer-modal-container .vjs-progress-control .vjs-progress-holder {
    height: 4px !important;
    transition: height 0.1s ease !important;
    margin: 0 !important;
    border-radius: 2px;
  }
  
  .book-trailer-modal-container .vjs-progress-control:hover .vjs-progress-holder {
    height: 6px !important;
  }
  
  /* Hide the knob by default, show on hover */
  .book-trailer-modal-container .vjs-progress-control .vjs-play-progress:before {
    transform: scale(0);
  }
  .book-trailer-modal-container .vjs-progress-control:hover .vjs-play-progress:before {
    transform: scale(1);
  }

  /* Slider background and load progress */
  .book-trailer-modal-container .vjs-slider {
    background-color: rgba(255, 255, 255, 0.2) !important;
  }
  .book-trailer-modal-container .vjs-load-progress {
    background: rgba(255, 255, 255, 0.3) !important;
  }
  .book-trailer-modal-container .vjs-load-progress div {
    background: rgba(255, 255, 255, 0.4) !important;
  }

  /* Eliminate gaps between Play and Volume */
  .book-trailer-modal-container .vjs-control-bar > .vjs-control:not(.vjs-play-control):not(.vjs-volume-panel):not(.vjs-time-control):not(.vjs-progress-control):not(.vjs-playback-rate):not(.vjs-picture-in-picture-control):not(.vjs-fullscreen-control):not(.vjs-custom-control-spacer) {
    display: none !important;
  }

  .book-trailer-modal-container .vjs-play-control,
  .book-trailer-modal-container .vjs-mute-control {
    flex: 0 0 36px !important;
    width: 36px !important;
    max-width: 36px !important;
    min-width: 36px !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Volume slider (YouTube style hover expansion) */
  .book-trailer-modal-container .vjs-volume-panel {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    flex: 0 0 36px !important;
    width: 36px !important; /* Fixed width when collapsed */
    max-width: 36px !important;
    min-width: 36px !important;
    margin: 0 12px 0 0 !important;
    padding: 0 !important;
    transition: all 0.2s ease !important;
    overflow: visible !important;
  }
  .book-trailer-modal-container .vjs-volume-panel:hover,
  .book-trailer-modal-container .vjs-volume-panel:focus-within {
    flex: 0 0 100px !important;
    width: 100px !important; /* Expand on hover */
    max-width: 100px !important;
  }

  .book-trailer-modal-container .vjs-volume-control.vjs-volume-horizontal {
    display: flex !important;
    align-items: center !important;
    width: 0 !important;
    opacity: 0 !important;
    transition: width 0.2s ease, opacity 0.2s ease !important;
    overflow: hidden !important;
  }
  .book-trailer-modal-container .vjs-volume-panel:hover .vjs-volume-control.vjs-volume-horizontal,
  .book-trailer-modal-container .vjs-volume-panel:focus-within .vjs-volume-control.vjs-volume-horizontal {
    width: 60px !important;
    opacity: 1 !important;
    margin-left: 4px !important;
  }
  .book-trailer-modal-container .vjs-volume-level {
    background-color: #fff !important;
  }
  .book-trailer-modal-container .vjs-volume-level:before {
    color: #fff !important;
    top: -0.3em !important;
  }

  /* ================= MINIMAL ICONS ================= */
  .book-trailer-modal-container .vjs-icon-placeholder:before,
  .book-trailer-modal-container .vjs-big-play-button .vjs-icon-placeholder:before {
    content: "" !important;
    font-family: none !important;
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    background-size: 24px !important;
    background-repeat: no-repeat !important;
    background-position: center !important;
  }

  /* Play */
  .book-trailer-modal-container .vjs-play-control.vjs-playing .vjs-icon-placeholder:before {
    background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>') !important;
  }
  .book-trailer-modal-container .vjs-play-control.vjs-paused .vjs-icon-placeholder:before {
    background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>') !important;
    background-size: 28px !important;
  }
  .book-trailer-modal-container .vjs-big-play-button .vjs-icon-placeholder:before {
    background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>') !important;
    background-size: 36px !important;
    margin-left: 4px !important; /* Visual center adjustment for play triangle */
  }

  /* Volume */
  .book-trailer-modal-container .vjs-mute-control .vjs-icon-placeholder:before {
    background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>') !important;
  }
  .book-trailer-modal-container .vjs-mute-control.vjs-vol-muted .vjs-icon-placeholder:before {
    background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>') !important;
  }

  /* Fullscreen */
  .book-trailer-modal-container .vjs-fullscreen-control .vjs-icon-placeholder:before {
    background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>') !important;
    background-size: 26px !important;
  }
  .video-js.vjs-fullscreen .vjs-fullscreen-control .vjs-icon-placeholder:before {
    background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>') !important;
  }

  /* Picture-in-Picture */
  .book-trailer-modal-container .vjs-picture-in-picture-control .vjs-icon-placeholder:before {
    background-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>') !important;
    background-size: 22px !important;
  }

  /* Big play button centered and red */
  .book-trailer-modal-container .vjs-big-play-button {
    background-color: rgba(0, 0, 0, 0.6) !important;
    border: none !important;
    border-radius: 50% !important;
    width: 60px !important;
    height: 60px !important;
    line-height: 60px !important;
    margin-top: -30px !important;
    margin-left: -30px !important;
    transition: background-color 0.2s ease, transform 0.2s ease !important;
  }
  .book-trailer-modal-container:hover .vjs-big-play-button {
    background-color: #ef4444 !important;
    transform: scale(1.1);
  }
`}} />
      <div 
        className={`relative w-[168px] h-[237px] rounded-lg shadow-md bg-gray-900 group ${
          mediaMode === "trailer" && playerState !== "error" && !isModalOpen ? "cursor-pointer" : ""
        }`}
        onClick={!isModalOpen ? handleContainerClick : undefined}
      >
        {/* Cover Image / GIF (Always kept in the background for layout stability) */}
        <div 
          className={`absolute inset-0 z-20 transition-opacity duration-500 ease-in-out rounded-lg overflow-hidden ${
            mediaMode === "trailer" && !isModalOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <AntImage
            src={poster}
            alt="ปกหนังสือ"
            width={168}
            height={237}
            preview={{}}
            className="object-cover rounded-lg w-[168px] h-[237px]"
          />
        </div>

        {/* The Video Container: Switches from absolute inline to fixed modal overlay */}
        <div 
          className={
            isModalOpen 
              ? "fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" 
              : "absolute inset-0 z-10 rounded-lg overflow-hidden"
          }
          onClick={isModalOpen ? handleCloseModal : undefined}
        >
          {/* Modal Close Button */}
          {isModalOpen && (
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-[2001] transition-colors"
              aria-label="ปิด"
            >
              <X className="w-8 h-8" />
            </button>
          )}

          {/* Video Wrapper (to constrain size in modal) */}
          <div 
            className={
              isModalOpen 
                ? "relative w-full max-w-4xl h-[85vh] flex items-center justify-center book-trailer-modal-container" 
                : "relative w-full h-full book-trailer-inline-container"
            }
            onClick={isModalOpen ? (e) => e.stopPropagation() : undefined}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              loop
              preload="metadata"
              poster={trailer.thumbnailUrl || poster}
              className="video-js vjs-default-skin vjs-big-play-centered"
              onContextMenu={(e) => e.preventDefault()}
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
            />

            {/* Overlays */}
            {/* Loading Overlay */}
            {(playerState === "loading" || playerState === "buffering") && mediaMode === "trailer" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg z-30 pointer-events-none">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}

            {/* Expand Icon Overlay (Shows on Hover when Inline) */}
            {mediaMode === "trailer" && playerState !== "loading" && playerState !== "buffering" && playerState !== "error" && !isModalOpen && (
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20 pointer-events-none">
                <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform duration-300">
                  <Maximize2 className="w-6 h-6 text-white" />
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {playerState === "error" && !isModalOpen && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg gap-2 px-2 z-30">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <p className="text-white text-[10px] text-center leading-tight">
                  {errorMessage || "เกิดข้อผิดพลาด"}
                </p>
                <button
                  onClick={retry}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white text-[10px] rounded-full transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  ลองใหม่
                </button>
              </div>
            )}

            {/* Unsupported Browser */}
            {playerState === "unsupported" && !isModalOpen && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg gap-1 px-2 z-30">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <p className="text-white text-[10px] text-center leading-tight">
                  เบราว์เซอร์ไม่รองรับ
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}


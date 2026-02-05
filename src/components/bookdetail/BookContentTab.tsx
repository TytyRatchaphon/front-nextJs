import React, { useState, useEffect, useRef } from "react";
import { Segmented } from "antd";
import { BookEpisodesTab } from "./BookEpisodesTab";

type Props = {
    episodesData: any;
    bookId: string;
    bookDetail: any;
    settings: any;
    isLoading: boolean;
    latestUpdate?: string;
    onOpenPurchaseModal?: () => void;
};

export const BookContentTab = ({ episodesData, bookId, bookDetail, settings, isLoading, latestUpdate, onOpenPurchaseModal }: Props) => {
    // Determine initial active tab
    // If pack exists, default to pack, else episodes
    // Check existence
    const hasPack = (episodesData?.novel_packpack && episodesData.novel_packpack?.length > 0) || 
                   (episodesData?.novel_pack && episodesData.novel_pack?.length > 0) || 
                   (episodesData?.pack && episodesData.pack?.length > 0);
    
    const hasNormal = (episodesData?.novel && episodesData.novel?.length > 0) || 
                      (episodesData?.normal && episodesData.normal?.length > 0) || 
                      (episodesData?.groups && episodesData.groups?.length > 0);

    // Initial Active Segment
    // If pack exists, default to pack, else normal
    const [activeSegment, setActiveSegment] = useState<string>(hasPack ? 'มัดแพ็ค' : 'รายตอน');
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (!isInitializedRef.current && hasPack) {
             setActiveSegment('มัดแพ็ค');
             isInitializedRef.current = true;
        } else if (!isInitializedRef.current && !isLoading && episodesData) {
             // If data loaded but no pack, mark initialized so we don't force switch later
             isInitializedRef.current = true;
        }
    }, [hasPack, isLoading, episodesData]);

    if (!hasPack && !hasNormal) return null;

    // Get Data for Current Segment
    let currentData = { groups: [] };
    let emptyMsg = "";

    // Force segment if only one exists
    let displaySegment = activeSegment;
    if (hasPack && !hasNormal) displaySegment = 'มัดแพ็ค';
    if (!hasPack && hasNormal) displaySegment = 'รายตอน';

    if (displaySegment === 'มัดแพ็ค') {
        currentData = { groups: episodesData?.novel_packpack || episodesData?.novel_pack || episodesData?.pack || [] };
        emptyMsg = "ยังไม่มีชุดมัดแพ็ค";
    } else {
        currentData = { groups: episodesData?.novel || episodesData?.normal || episodesData?.groups || [] };
        emptyMsg = "ยังไม่มีรายตอน";
    }

    return (
        <div className="bg-white">
            {/* Header with Segmented Control */}
            <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
                <div className="flex justify-end items-center bg-gray-50/50 p-2 rounded-xl">
                    <button 
                        onClick={onOpenPurchaseModal}
                        className="h-10 px-4 rounded-xl border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-colors flex items-center gap-1 bg-white shadow-sm"
                    >
                        เลือกซื้อหลายตอน
                    </button>
                </div>
                
                {(hasPack && hasNormal) && (
                    <Segmented
                        options={['มัดแพ็ค', 'รายตอน']}
                        value={displaySegment}
                        onChange={(val) => setActiveSegment(val as string)}
                        className="bg-red-50 p-1 text-red-600 font-medium"
                        block={true}
                        size="large"
                        style={{
                            backgroundColor: '#FEF2F2', // red-50
                            borderRadius: '0.5rem',
                        }}
                    />
                )}
            </div>

            {/* List Content */}
            <BookEpisodesTab 
                episodesData={currentData}
                bookId={bookId}
                bookDetail={bookDetail}
                settings={settings}
                isLoading={isLoading}
                latestUpdate={latestUpdate}
                emptyMessage={emptyMsg}
            />
        </div>
    );
};

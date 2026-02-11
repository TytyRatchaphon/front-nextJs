"use client";

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { fetchCampaignsDiscount } from "@/services/apiServices";
import { CampaignDiscount as CampaignDiscountType } from "@/types/api";

export default function CampaignDiscount() {
    const [campaigns, setCampaigns] = useState<CampaignDiscountType[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchCampaignsDiscount();
            setCampaigns(data);
        };
        fetchData();
    }, []);

    return (
        <>
            <main className="mx-auto max-w-[800px] px-4 py-4 space-y-6">
                <h1 className="text-2xl font-bold">
                    โปรโมชั่นลดราคาพิเศษจาก  <span className="text-red-600 !font-extrabold">EnjoyBook</span>
                </h1>

                {campaigns
                    .filter((item) => !!item.img_banner)
                    .map((item) => (
                        <div key={item.cp_id} className="relative">
                            {/* Banner (คลิกได้ทั้งรูป) */}
                            <Link
                                href={`/campaign/${item.cp_id}`}
                                className="block relative w-full overflow-hidden rounded-xl aspect-[1000/300]"
                            >
                                <Image
                                    src={item.img_banner as string}
                                    alt={`Campaign ${item.cp_id}`}
                                    fill
                                    priority
                                    className="object-cover"
                                    unoptimized
                                />
                            </Link>

                            {/* ปุ่มดูรายละเอียด */}
                            <Link
                                href={`/campaign/${item.cp_id}`}
                                className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 md:bottom-4 md:right-4 z-10
                        !bg-white !bg-opacity-90
                        text-xs sm:text-sm md:text-lg !font-medium
                        px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2
                        !rounded-full
                        !transition-all !duration-200
                        hover:!bg-opacity-100 hover:!shadow-lg hover:!scale-105
                        active:!scale-95"
                            >
                                ดูรายละเอียดโปรโมชั่น
                            </Link>
                        </div>
                    ))}
            </main>
        </>
    );
}

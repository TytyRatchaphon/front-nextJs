"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import { Spin } from 'antd';

const CartDetail = dynamic(() => import('./CartDetail'), { 
    ssr: false,
    loading: () => <div className="flex justify-center items-center h-[50vh]"><Spin size="large" /></div>
});

export default function CartClientLoader() {
  return <CartDetail />;
}

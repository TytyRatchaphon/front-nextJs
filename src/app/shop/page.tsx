"use client";

import React from "react";
import Image from "next/image";
import { Tabs } from "antd";
import type { TabsProps } from "antd";
import "./shop.css"; // Add this import
import Footer from "@/components/Footer";

// Mock data for products
const exclusiveProducts = [
  {
    id: 1,
    title: "หนมสุด exclusive",
    image: "/api/placeholder/200/200",
    price: 5,
  },
  {
    id: 2,
    title: "หนมสุด exclusive",
    image: "/api/placeholder/200/200",
    price: 5,
  },
  {
    id: 3,
    title: "หนมสุด exclusive",
    image: "/api/placeholder/200/200",
    price: 5,
  },
  {
    id: 4,
    title: "หนมสุด exclusive",
    image: "/api/placeholder/200/200",
    price: 5,
  },
  {
    id: 5,
    title: "หนมสุด exclusive",
    image: "/api/placeholder/200/200",
    price: 5,
  },
  {
    id: 6,
    title: "หนมสุด exclusive",
    image: "/api/placeholder/200/200",
    price: 5,
  },
  {
    id: 7,
    title: "หนมสุด exclusive",
    image: "/api/placeholder/200/200",
    price: 5,
  },
  {
    id: 8,
    title: "หนมสุด exclusive",
    image: "/api/placeholder/200/200",
    price: 5,
  },
  {
    id: 9,
    title: "หนมสุด exclusive",
    image: "/api/placeholder/200/200",
    price: 5,
  },
  {
    id: 10,
    title: "หนมสุด exclusive",
    image: "/api/placeholder/200/200",
    price: 5,
  },
];

const categories = [
  { key: "all", label: "ทั้งหมด" },
  { key: "latest", label: "สินค้าจาก Enjoybook" },
  { key: "other", label: "ไอเทม" },
  { key: "exclusive", label: "โปรโมชั่น" },
  { key: "files", label: "ร้านค้าพิเศษ" },
];

const stats = [{ emoji: "😊", count: 150 }];

const currency = [
  { emoji: "🎨", count: 95 },
  { emoji: "📝", count: 580 },
  { emoji: "💕", count: 320 },
  { emoji: "🎁", count: 320 },
  { emoji: "🔥", count: 320 },
  { emoji: "💎", count: 320 },
];
function ShopPage() {
  const tabItems: TabsProps["items"] = categories.map((cat) => ({
    key: cat.key,
    label: cat.label,
    children: (
      <>
        {/* Products Grid */}
        <div className="flex items-center justify-end mb-4">
          <span className="text-sm text-gray-600 mr-2">
            ประวัติทำรายการล่าสุด
          </span>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {exclusiveProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative aspect-square">
                  <Image
                    src="https://img.enjoybook.co/img/banner/2025Q72BQfABCP1001155615.jpeg?w=1920&q=75"
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 font-bold flex items-center">
                      <Image
                        src="https://img.enjoybook.co/img/logo2025.png"
                        alt="coin"
                        width={16}
                        height={16}
                        className="mr-1"
                      />
                      {product.price}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mb-8">
          <nav className="flex items-center space-x-2">
            <button className="px-3 py-2 text-sm text-red-500 hover:text-gray-700">
              ‹
            </button>
            <button className="px-3 py-2 text-sm bg-red-600 text-white rounded">
              1
            </button>
            <button className="px-3 py-2 text-sm text-red-500 hover:text-gray-700">
              2
            </button>
            <button className="px-3 py-2 text-sm text-red-500 hover:text-gray-700">
              3
            </button>
            <button className="px-3 py-2 text-sm text-red-500 hover:text-gray-700">
              4
            </button>
            <button className="px-3 py-2 text-sm text-red-500 hover:text-gray-700">
              5
            </button>
            <button className="px-3 py-2 text-sm text-red-500 hover:text-gray-700">
              ›
            </button>
          </nav>
        </div>
      </>
    ),
  }));

  return (
    <div className="bg-gray-50 min-h-screen font-primary">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <Image
          src="https://img.enjoybook.co/img/banner/2025Q72BQfABCP1001155615.jpeg?w=1920&q=75"
          alt="Shop Banner"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        <div className="absolute bottom-8 left-0 right-0 text-center text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">ENJOYSHOP</h1>
          <p className="text-sm md:text-base">
            ชมรมสนใจร่วมให้ทุกรายละเอียดอื่นไม่ได้ ENJOYBOOK
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Stats Section - Moved to Left */}
        <div className="flex justify-start mb-8">
          <div className="flex flex-wrap gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`flex items-center bg-white rounded-full px-4 py-2 border border-gray-300 gap-1`}
              >
                <span className="text-2xl mr-2">{stat.emoji}</span>
                <span className="font-bold text-gray-800">{stat.count}</span>
                <span className="text-2xl mr-2">➕</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <div
              className={`flex items-center bg-white rounded-full px-4 py-2 border border-gray-300 gap-0.5`}
            >
              <span className="text-2xl mr-2">💮</span>
              <span className="font-bold text-gray-800">100 </span>
              <span className="text-2xl mr-2">💰</span>
              <span className="font-bold text-gray-800">100 </span>
              <span className="text-2xl mr-2">🌹</span>
              <span className="font-bold text-gray-800">100 </span>
              <span className="text-2xl mr-2">❤️</span>
              <span className="font-bold text-gray-800">100 </span>
              <span className="text-2xl mr-2">🔮</span>
              <span className="font-bold text-gray-800">100 </span>
              <span className="text-2xl mr-2">🪙</span>
              <span className="font-bold text-gray-800">100 </span>
            </div>
          </div>
        </div>

        {/* Category Tabs with Ant Design */}
        <div className="mb-8">
          <Tabs
            defaultActiveKey="all"
            items={tabItems}
            tabBarExtraContent={{}}
            className="shop-tabs"
          />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default ShopPage;

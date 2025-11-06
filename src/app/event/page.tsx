"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Footer from "@/components/Footer";

// Mock data for events
const featuredEvent = {
  id: 1,
  title: "ชวนโปรดิวไปรวมลิสต์นิยายต้อนรับลมร้อนในงาน E-BOOK EXPO!",
  description: "4 - 13 มีนาคม 67",
  image: "/api/placeholder/600/300",
  author: "ADMIN",
  date: "January 10, 2025",
  views: 300,
  category: "กิจกรรม",
};

const featuredRightEvents = [
  {
    id: 2,
    title: "HEADINGHEADINGHEADINGHEADING",
    image: "/api/placeholder/400/200",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
  {
    id: 3,
    title: "HEADINGHEADINGHEADINGHEADING",
    image: "/api/placeholder/400/200",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
  {
    id: 4,
    title: "HEADINGHEADINGHEADINGHEADING",
    image: "/api/placeholder/400/200",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
];

const events = [
  {
    id: 1,
    title: "เรื่องใหม่มาเติม! กับนิยาย 4 เรื่อง 4 สไตล์จาก 'นามปากกา' ยอดนิยม",
    image: "/api/placeholder/400/250",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
  {
    id: 2,
    title: "HEADINGHEADINGHEADINGHEADING",
    image: "/api/placeholder/400/250",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
  {
    id: 3,
    title: "HEADINGHEADINGHEADINGHEADING",
    image: "/api/placeholder/400/250",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
  {
    id: 4,
    title: "HEADINGHEADINGHEADINGHEADING",
    image: "/api/placeholder/400/250",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
  {
    id: 5,
    title: "HEADINGHEADINGHEADINGHEADING",
    image: "/api/placeholder/400/250",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
  {
    id: 6,
    title: "HEADINGHEADINGHEADINGHEADING",
    image: "/api/placeholder/400/250",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
  {
    id: 7,
    title: "HEADINGHEADINGHEADINGHEADING",
    image: "/api/placeholder/400/250",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
  {
    id: 8,
    title: "HEADINGHEADINGHEADINGHEADING",
    image: "/api/placeholder/400/250",
    author: "ADMIN",
    date: "January 10, 2025",
    views: 200,
    category: "กิจกรรม",
  },
];

function EventsPage() {
  return (
    <div className="bg-gray-50 min-h-screen font-primary">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          ข่าวสาร กิจกรรม
        </h1>

        {/* Featured News Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left - Large Featured Event */}
            <div className="lg:col-span-2">
              <div className="relative bg-white rounded-lg overflow-hidden shadow-lg h-full">
                <div className="relative h-64 md:h-110">
                  <Image
                    src="https://img.enjoybook.co/img/img_campaign2025O5WjY5DhqK0916150451.jpeg?w=3840&q=75"
                    alt={featuredEvent.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="inline-block bg-red-600 text-white px-3 py-1 rounded text-sm font-medium mb-2">
                      {featuredEvent.category}
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold mb-2 line-clamp-2">
                      {featuredEvent.title}
                    </h2>
                    <p className="text-sm opacity-90 mb-2">
                      {featuredEvent.description}
                    </p>
                    <div className="flex items-center text-sm opacity-80">
                      <span>by {featuredEvent.author}</span>
                      <span className="mx-2">•</span>
                      <span>{featuredEvent.date}</span>
                      <span className="mx-2">•</span>
                      <span>{featuredEvent.views} views</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Three Small Featured Events */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              {featuredRightEvents.map((event) => (
                <div
                  key={event.id}
                  className="relative bg-white rounded-lg overflow-hidden shadow-lg flex-1"
                >
                  <div className="relative h-32">
                    <Image
                      src="https://img.enjoybook.co/img/banner/2025Q72BQfABCP1001155615.jpeg?w=1920&q=75"
                      alt={event.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {event.category}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 text-white">
                      <h3 className="text-sm font-bold line-clamp-1 mb-1">
                        {event.title}
                      </h3>
                      <div className="flex items-center text-xs opacity-80">
                        <span>by {event.author}</span>
                        <span className="mx-1">•</span>
                        <span>{event.date}</span>
                        <span className="mx-1">•</span>
                        <span>{event.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Events Grid Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">อัพเดทล่าสุด</h2>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  color="red"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 bg-gray-100">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  color="red"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <Image
                    src="https://img.enjoybook.co/img/banner/2025Q72BQfABCP1001155615.jpeg?w=1920&q=75"
                    alt={event.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                      {event.category}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 text-sm">
                    {event.title}
                  </h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>by {event.author}</span>
                    <span className="mx-1">•</span>
                    <span>{event.date}</span>
                    <span className="mx-1">•</span>
                    <span>{event.views}</span>
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
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default EventsPage;

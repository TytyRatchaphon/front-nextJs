"use client";

import { Image as AntdImage } from "antd";

type EditBookOverviewProps = {
  display: any;
  bookId?: string | null;
  getBookName: (book: any) => string;
  onEditBook: () => void;
};

export function EditBookOverview({
  display,
  bookId,
  getBookName,
  onEditBook,
}: EditBookOverviewProps) {
  return (
    <>
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-8 flex flex-col md:flex-row gap-8 items-start">
        <AntdImage
          src={display.img}
          alt="cover"
          width={160}
          preview={{
            mask: <div className="text-white">preview</div>,
          }}
          className="rounded-lg shadow-md object-cover border border-gray-100"
        />
        <div className="flex-1 min-w-0">
          <h1
            className="text-3xl font-bold text-gray-900 leading-tight mb-3 cursor-pointer hover:text-rose-600 transition-colors"
            onClick={() => window.open(`/book/${bookId}`, "_blank")}
            title="เปิดหน้านิยาย"
          >
            {getBookName(display) || "ไม่ระบุชื่อหนังสือ"}
          </h1>
          <div className="text-lg text-gray-600 mb-6 flex items-center gap-2">
            <span className="font-medium text-gray-900">โดย:</span>
            {display.writer?.writer_name ?? "ไม่ระบุ"}
          </div>

          {display.title && (
            <div className="text-gray-600 mb-8 max-w-3xl leading-relaxed">
              {display.title}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <StatPill icon="view" value={display.view ?? display.views} label="วิว" />
            <StatPill icon="episodes" value={display.total_eps} label="ตอน" />
            <StatPill icon="groups" value={display.total_groups} label="เล่ม" />
          </div>
        </div>
      </div>

      <hr className="my-8" />

      <section className="mb-8 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <h2 className="font-semibold text-lg text-gray-800">รายละเอียด</h2>
          <button
            onClick={onEditBook}
            className="inline-flex items-center justify-center px-4 py-1 rounded text-sm font-medium bg-rose-600 text-white hover:bg-rose-700"
            style={{ color: "#ffffff" }}
          >
            แก้ไข
          </button>
        </div>
        <p className="text-gray-700 leading-relaxed text-base">{display.title}</p>
      </section>
    </>
  );
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: "view" | "episodes" | "groups";
  value: unknown;
  label: string;
}) {
  const displayValue = value !== null && value !== undefined && typeof (value as any).toLocaleString === "function"
    ? (value as any).toLocaleString()
    : value ?? "";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-gray-600 text-sm font-medium">
      <StatIcon icon={icon} />
      {displayValue} {label}
    </div>
  );
}

function StatIcon({ icon }: { icon: "view" | "episodes" | "groups" }) {
  if (icon === "view") {
    return (
      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg" className="text-rose-500">
        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
      </svg>
    );
  }

  if (icon === "episodes") {
    return (
      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg" className="text-rose-500">
        <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
      </svg>
    );
  }

  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg" className="text-rose-500">
      <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783" />
    </svg>
  );
}

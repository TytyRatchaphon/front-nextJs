"use client";
import * as React from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotifications,
  deleteAllNotifications,
  NotificationTab,
} from "@/services/apiServices";
import { Button, Tag, Pagination, Tabs, App } from "antd";
import {
  BellOutlined,
  CheckOutlined,
  BookOutlined,
  MessageOutlined,
  InfoCircleOutlined,
  UserOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";
import GifLoader from "@/components/utility/GifLoader";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { navigateSafely } from "@/utils/navigationUtils";

dayjs.extend(relativeTime);
dayjs.locale("th");

interface NotificationType {
  noti_type_id: number;
  category: string;
  type:
    | "book_new"
    | "book_update"
    | "system"
    | "comment_book_id"
    | "comment_ep_id"
    | "comment_sub_book_id"
    | "comment_sub_ep_id";
  book_id?: number;
  ep_id?: number;
  comment_id?: number;
  title: string;
  subtitle: string;
  message?: string;
  image?: string;
  url?: string;
  status: string;
  scheduled_at?: string;
  create_at: string;
}

interface NotificationItem {
  id: number;
  user_id: number;
  noti_type_id: number;
  readed: "Y" | "N";
  create_at: string;
  update_at: string;
  NotiType: NotificationType;
}

const NotificationPage: React.FC = () => {
  const { notification } = App.useApp();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  React.useEffect(() => {
    if (!token) {
      router.push("/");
    }
  }, [token, router]);

  React.useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, page]);

  const { data, isLoading } = useQuery({
    queryKey: ["allNotifications", activeTab, page],
    queryFn: () => fetchAllNotifications(page, 20, activeTab),
    staleTime: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const notifications = data?.notifications || [];
  const pagination = data?.pagination;

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["navbarNotifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: (tab: NotificationTab) => markAllNotificationsAsRead(tab),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["navbarNotifications"] });
    },
  });

  const deleteNotificationsMutation = useMutation({
    mutationFn: (ids: number[]) => deleteNotifications(ids),
    onSuccess: (_, ids) => {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["navbarNotifications"] });
      notification.success({ message: ids.length > 1 ? "ลบการแจ้งเตือนที่เลือกแล้ว" : "ลบการแจ้งเตือนแล้ว" });
    },
    onError: () => {
      notification.error({ message: "ลบการแจ้งเตือนไม่สำเร็จ" });
    },
  });

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["allNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["navbarNotifications"] });
      notification.success({ message: "ลบการแจ้งเตือนทั้งหมดแล้ว" });
    },
    onError: () => {
      notification.error({ message: "ลบการแจ้งเตือนทั้งหมดไม่สำเร็จ" });
    },
  });

  const handleNotificationClick = (item: NotificationItem) => {
    if (item.readed === "N") {
      markReadMutation.mutate(item.id);
    }

    if (item.NotiType.url) {
      const didNavigate = navigateSafely(item.NotiType.url);
      if (didNavigate) {
        return;
      }
    }

    const { type, book_id, ep_id } = item.NotiType;
    if (type === "book_new" || type === "book_update" || type === "comment_book_id") {
      if (book_id) router.push(`/book/${book_id}`);
      return;
    }

    if (type === "comment_ep_id" || type === "comment_sub_ep_id") {
      if (book_id && ep_id) router.push(`/read/${book_id}/${ep_id}`);
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(activeTab);
  };

  const toggleSelected = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((itemId) => itemId !== id);
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    deleteNotificationsMutation.mutate(selectedIds);
  };

  const handleDeleteOne = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteNotificationsMutation.mutate([id]);
  };

  const handleDeleteAll = () => {
    if (notifications.length === 0) return;
    deleteAllNotificationsMutation.mutate();
  };

  const toggleExpand = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getIconByType = (type: string) => {
    switch (type) {
      case "book_new":
      case "book_update":
        return <BookOutlined />;
      case "system":
        return <InfoCircleOutlined />;
      case "comment_book_id":
      case "comment_ep_id":
      case "comment_sub_book_id":
      case "comment_sub_ep_id":
        return <MessageOutlined />;
      default:
        return <BellOutlined />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "book_new":
        return { text: "เรื่องใหม่", color: "green" };
      case "book_update":
        return { text: "นิยาย", color: "blue" };
      case "system":
        return { text: "ระบบ", color: "red" };
      case "comment_book_id":
      case "comment_ep_id":
      case "comment_sub_book_id":
      case "comment_sub_ep_id":
        return { text: "ความคิดเห็น", color: "orange" };
      default:
        return { text: "แจ้งเตือน", color: "default" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center">
        <GifLoader width={150} height={150} />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold text-gray-800">การแจ้งเตือนทั้งหมด</h1>
          <p className="mt-1 text-sm text-gray-500">จัดการและดูประวัติการแจ้งเตือนของคุณ</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              danger
              className="rounded-full"
              onClick={handleDeleteSelected}
              loading={deleteNotificationsMutation.isPending}
              icon={<DeleteOutlined />}
            >
              ลบที่เลือก ({selectedIds.length})
            </Button>
          )}
          {notifications.some((n: NotificationItem) => n.readed === "N") && (
            <Button
              className="rounded-full border-gray-200 hover:bg-red-50 hover:text-red-500"
              onClick={handleMarkAllRead}
              loading={markAllReadMutation.isPending}
              icon={<CheckOutlined />}
            >
              อ่านทั้งหมด
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              danger
              className="rounded-full"
              onClick={handleDeleteAll}
              loading={deleteAllNotificationsMutation.isPending}
              icon={<DeleteOutlined />}
            >
              ลบทั้งหมด
            </Button>
          )}
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as NotificationTab);
          setPage(1);
        }}
        className="mb-5"
        items={[
          { key: "all", label: "ทั้งหมด" },
          { key: "comment", label: "ความคิดเห็น" },
          { key: "system", label: "ระบบ" },
          { key: "book", label: "นิยาย" },
        ]}
      />

      {!notifications || notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-12 text-gray-400 shadow-sm">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-3xl opacity-30">
            <BellOutlined />
          </div>
          <h3 className="text-lg font-medium text-gray-600">ไม่มีการแจ้งเตือน</h3>
          <p className="text-sm">คุณยังไม่มีการแจ้งเตือนใดๆ ในขณะนี้</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((item: NotificationItem) => {
            const typeInfo = getTypeLabel(item.NotiType.type);
            const isSystem = item.NotiType.type === "system";
            const isExpanded = expandedIds.has(item.id);

            return (
              <div
                key={item.id}
                className={`group relative cursor-pointer rounded-xl border border-gray-100 px-5 py-5 shadow-sm transition-all duration-200 hover:shadow-md ${
                  item.readed === "N" ? "bg-white ring-1 ring-red-50" : "bg-gray-50/50 grayscale-[10%] hover:grayscale-0"
                }`}
                onClick={() => handleNotificationClick(item)}
              >
                {item.readed === "N" && (
                  <div className="absolute bottom-6 left-0 top-6 w-1 rounded-r-full bg-[#E31C3D]" />
                )}

                <div className="flex gap-5">
                  <div className="shrink-0 pt-1">
                    {item.NotiType.image ? (
                      <div className="relative">
                        <div className="relative h-16 w-16 flex-shrink-0">
                          <Image
                            src={item.NotiType.image}
                            alt="Notification"
                            fill
                            className="rounded-xl border border-gray-200 bg-white object-cover shadow-sm"
                          />
                        </div>
                        <div
                          className={`absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full text-xs text-white shadow-sm ring-2 ring-white ${
                            ["book_new", "book_update"].includes(item.NotiType.type)
                              ? "bg-blue-500"
                              : item.NotiType.type === "system"
                                ? "bg-red-500"
                                : "bg-orange-500"
                          }`}
                        >
                          {getIconByType(item.NotiType.type)}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-xl border border-gray-100 text-3xl shadow-sm ${
                          ["book_new", "book_update"].includes(item.NotiType.type)
                            ? "bg-blue-50 text-blue-500"
                            : item.NotiType.type === "system"
                              ? "bg-red-50 text-red-500"
                              : "bg-orange-50 text-orange-500"
                        }`}
                      >
                        {getIconByType(item.NotiType.type)}
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Tag color={item.readed === "N" ? typeInfo.color : "default"} className="m-0 border-none font-semibold">
                          {typeInfo.text}
                        </Tag>
                        {item.readed === "N" && (
                          <Tag color="red" className="m-0 border-none text-[10px]">
                            ใหม่
                          </Tag>
                        )}
                      </div>
                      <span className="ml-auto whitespace-nowrap text-xs text-gray-400">
                        {dayjs(item.create_at).format("D MMM YYYY, HH:mm")}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <label
                          className="flex h-5 w-5 cursor-pointer items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={(e) => toggleSelected(item.id, e.target.checked)}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-red-600 accent-red-600 focus:ring-red-500"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteOne(e, item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          aria-label="ลบการแจ้งเตือน"
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className={`mb-1 text-base leading-snug ${item.readed === "N" ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                        {item.NotiType.title}
                      </h4>
                      <div className="relative">
                        <p className={`m-0 text-sm text-gray-500 transition-all duration-300 ${isSystem && isExpanded ? "" : "line-clamp-2"}`}>
                          {item.NotiType.subtitle}
                        </p>
                      </div>
                    </div>

                    {item.NotiType.message && (
                      <div className="mt-2 flex flex-col gap-1 rounded-lg border-t border-gray-100 bg-gray-50 p-3 text-sm text-gray-500">
                        <div className="mb-1 flex items-center gap-2">
                          <UserOutlined />
                          <span className="font-semibold">ข้อความจากระบบ</span>
                        </div>
                        <span className={`${isSystem && isExpanded ? "" : "line-clamp-2"} whitespace-pre-line leading-relaxed`}>
                          {item.NotiType.message}
                        </span>
                        {isSystem && (
                          <div
                            className="mt-1 -ml-1 flex w-fit cursor-pointer select-none items-center gap-1 rounded p-1 text-sm font-semibold text-red-400 transition-colors hover:text-[#E31C3D]"
                            onClick={(e) => toggleExpand(e, item.id)}
                          >
                            {isExpanded ? "ย่อลง" : "ดูเพิ่มเติม"}
                            <svg
                              className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            current={page}
            onChange={(p) => setPage(p)}
            total={pagination?.total || 100}
            pageSize={20}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationPage;

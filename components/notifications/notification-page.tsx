"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { NotificationItem } from "./notification-item";

export const NOTIFICATION_TABS = [
  { key: "all" as const, label: "All" },
  { key: "unread" as const, label: "Unread" },
  { key: "mentions" as const, label: "Mentions" },
];

export function NotificationPage() {
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "mentions">("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading } = trpc.notifications.list.useQuery({
    page,
    perPage,
    filter: activeTab,
  });
  const utils = trpc.useUtils();

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const notifications = (data?.data ?? []).map((n: any) => ({
    ...n,
    createdAt: new Date(n.createdAt),
  }));
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "#0D0D0D" }}>Notifications</h1>
        <button
          onClick={() => markAllRead.mutate()}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#F4F4F4]"
          style={{ color: "#6366F1" }}
        >
          Mark All Read
        </button>
      </div>

      <div className="mt-4 flex gap-1 border-b" style={{ borderColor: "#E8E8E8" }}>
        {NOTIFICATION_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeTab === tab.key ? "#0D0D0D" : "#7A7A7A",
              borderBottom: activeTab === tab.key ? "2px solid #0D0D0D" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: "#E8E8E8" }}>
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm" style={{ color: "#7A7A7A" }}>Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>No notifications</p>
            <p className="mt-1 text-sm" style={{ color: "#7A7A7A" }}>
              You're all caught up!
            </p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onToggleRead={(id) => markRead.mutate({ notificationId: id })}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded px-3 py-1 text-sm disabled:opacity-40"
            style={{ color: "#7A7A7A" }}
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: "#7A7A7A" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded px-3 py-1 text-sm disabled:opacity-40"
            style={{ color: "#7A7A7A" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

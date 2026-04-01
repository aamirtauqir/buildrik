"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { NotificationItem } from "./notification-item";
import type { NotificationData } from "@lib/validations/notifications";

export const NOTIFICATION_TABS = [
  { key: "all" as const, label: "All" },
  { key: "unread" as const, label: "Unread" },
  { key: "mentions" as const, label: "Mentions" },
];

type TabFilter = "all" | "unread" | "mentions";

export function NotificationPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data, isLoading } = trpc.notifications.listGrouped.useQuery({
    filter: activeTab,
  });
  const utils = trpc.useUtils();

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.listGrouped.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.listGrouped.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  function toggleGroup(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  function toNotificationData(n: {
    id: string;
    type: string;
    actorName: string | null;
    message: string;
    actionUrl: string | null;
    read: boolean;
    priority: string;
    createdAt: Date | string;
  }): NotificationData {
    return {
      ...n,
      createdAt: n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt as string),
    };
  }

  const groups = data?.groups ?? [];

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "#0D0D0D" }}>Notifications</h1>
        <button
          onClick={() => markAllRead.mutate()}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#F4F4F4]"
          style={{ color: "#7A7A7A" }}
        >
          Mark All Read
        </button>
      </div>

      <div className="mt-4 flex gap-1 border-b" style={{ borderColor: "#E8E8E8" }}>
        {NOTIFICATION_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
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
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>No notifications</p>
            <p className="mt-1 text-sm" style={{ color: "#7A7A7A" }}>
              You&apos;re all caught up!
            </p>
          </div>
        ) : (
          groups.map((group) => {
            const lead = toNotificationData(group.notifications[0]);
            const isExpanded = expandedGroups.has(group.id);

            if (group.count <= 1) {
              return (
                <NotificationItem
                  key={group.id}
                  notification={lead}
                  onToggleRead={(id) => markRead.mutate({ notificationId: id })}
                />
              );
            }

            return (
              <div key={group.id}>
                <NotificationItem
                  notification={lead}
                  onToggleRead={(id) => markRead.mutate({ notificationId: id })}
                />
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-1 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-[#F4F4F4]"
                  style={{ color: "#7A7A7A" }}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {isExpanded
                    ? "Hide similar notifications"
                    : `${group.count - 1} similar notification${group.count - 1 > 1 ? "s" : ""}`}
                </button>
                {isExpanded &&
                  group.notifications.slice(1).map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={toNotificationData(n)}
                      onToggleRead={(id) => markRead.mutate({ notificationId: id })}
                    />
                  ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

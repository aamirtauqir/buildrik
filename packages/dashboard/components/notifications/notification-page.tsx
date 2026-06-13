"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { NotificationItem } from "./notification-item";
import type { NotificationData } from "@buildrik/shared/schemas/notifications";

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
  const deleteNotif = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.listGrouped.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
  const muteType = trpc.notifications.muteType.useMutation({
    onSuccess: () => utils.notifications.listGrouped.invalidate(),
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
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Notifications</h1>
        <button
          onClick={() => markAllRead.mutate()}
          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--color-bg-subtle)]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Mark All Read
        </button>
      </div>

      <div className="mt-4 flex gap-1 border-b" style={{ borderColor: "var(--color-border-default)" }}>
        {NOTIFICATION_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{
              color: activeTab === tab.key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              borderBottom: activeTab === tab.key ? "2px solid var(--color-text-primary)" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: "var(--color-border-default)" }}>
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>No notifications</p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
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
                  onDelete={(id) => deleteNotif.mutate({ notificationId: id })}
                  onMuteType={(type) => muteType.mutate({ type })}
                />
              );
            }

            return (
              <div key={group.id}>
                <NotificationItem
                  notification={lead}
                  onToggleRead={(id) => markRead.mutate({ notificationId: id })}
                  onDelete={(id) => deleteNotif.mutate({ notificationId: id })}
                  onMuteType={(type) => muteType.mutate({ type })}
                />
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-1 px-4 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-bg-subtle)]"
                  style={{ color: "var(--color-text-secondary)" }}
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
                  onDelete={(id) => deleteNotif.mutate({ notificationId: id })}
                  onMuteType={(type) => muteType.mutate({ type })}
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

"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { NotificationItem } from "./notification-item";
import { useNotificationSSE } from "@lib/hooks/use-notification-sse";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useNotificationSSE();

  const { data: recentData } = trpc.notifications.recent.useQuery(undefined, {
    enabled: open,
  });
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery();
  const utils = trpc.useUtils();

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.recent.invalidate();
      utils.notifications.unreadCount.invalidate();
      utils.notifications.listGrouped.invalidate();
    },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.recent.invalidate();
      utils.notifications.unreadCount.invalidate();
      utils.notifications.listGrouped.invalidate();
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const notifications = (recentData ?? []).map((n) => ({
    ...n,
    createdAt: n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt as string),
  }));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 transition-colors hover:bg-[var(--color-bg-subtle)]"
        style={{ color: "var(--color-text-secondary)" }}
        aria-label={`Notifications${(unreadCount ?? 0) > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {(unreadCount ?? 0) > 0 && (
          <span
            className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-lg border bg-white shadow-lg" style={{ borderColor: "var(--color-border-default)" }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--color-border-default)" }}>
            <span className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>Notifications</span>
            <button
              onClick={() => markAllRead.mutate()}
              className="text-body-sm font-medium hover:underline"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-body" style={{ color: "var(--color-text-secondary)" }}>
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onToggleRead={(id, read) => markRead.mutate({ notificationId: id, read })}
                />
              ))
            )}
          </div>
          <div className="border-t px-4 py-2 text-center" style={{ borderColor: "var(--color-border-default)" }}>
            <a
              href="/dashboard/notifications"
              className="text-body-sm font-medium hover:underline"
              style={{ color: "var(--color-text-secondary)" }}
            >
              View All &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

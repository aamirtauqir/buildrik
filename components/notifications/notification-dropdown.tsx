"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { NotificationItem } from "./notification-item";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: recentData } = trpc.notifications.recent.useQuery(undefined, {
    enabled: open,
  });
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery();
  const utils = trpc.useUtils();

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.recent.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.recent.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = (recentData ?? []).map((n: any) => ({
    ...n,
    createdAt: new Date(n.createdAt),
  }));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 transition-colors hover:bg-[#F4F4F4]"
        style={{ color: "#7A7A7A" }}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {(unreadCount ?? 0) > 0 && (
          <span
            className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: "#E42313" }}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-lg border bg-white shadow-lg" style={{ borderColor: "#E8E8E8" }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "#E8E8E8" }}>
            <span className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>Notifications</span>
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs font-medium hover:underline"
              style={{ color: "#6366F1" }}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm" style={{ color: "#7A7A7A" }}>
                No notifications yet
              </p>
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
          <div className="border-t px-4 py-2 text-center" style={{ borderColor: "#E8E8E8" }}>
            <a
              href="/dashboard/notifications"
              className="text-xs font-medium hover:underline"
              style={{ color: "#6366F1" }}
            >
              View All &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

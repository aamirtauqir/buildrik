"use client";

import { Eye, EyeOff } from "lucide-react";
import type { NotificationData } from "@/lib/validations/notifications";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NotificationItemProps {
  notification: NotificationData;
  onToggleRead: (id: string, read: boolean) => void;
}

export function NotificationItem({ notification, onToggleRead }: NotificationItemProps) {
  return (
    <div
      className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#F4F4F4]"
      style={{
        borderLeft: notification.read ? "3px solid transparent" : "3px solid #6366F1",
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: "#0D0D0D" }}>
          {notification.actorName && (
            <span className="font-semibold">{notification.actorName} </span>
          )}
          {notification.message}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs" style={{ color: "#7A7A7A" }}>
            {timeAgo(notification.createdAt)}
          </span>
          {notification.actionUrl && (
            <a
              href={notification.actionUrl}
              className="text-xs font-medium hover:underline"
              style={{ color: "#6366F1" }}
            >
              View
            </a>
          )}
        </div>
      </div>
      <button
        onClick={() => onToggleRead(notification.id, !notification.read)}
        className="hidden shrink-0 rounded p-1 transition-colors hover:bg-[#E8E8E8] group-hover:block"
        style={{ color: "#7A7A7A" }}
        aria-label={notification.read ? "Mark as unread" : "Mark as read"}
      >
        {notification.read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

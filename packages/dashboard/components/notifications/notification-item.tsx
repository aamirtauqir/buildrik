"use client";

import { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, MoreHorizontal } from "lucide-react";
import type { NotificationData } from "@buildrik/shared/schemas/notifications";

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
  onMuteType?: (type: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationItem({
  notification,
  onToggleRead,
  onMuteType,
  onDelete,
}: NotificationItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  function handleClick() {
    if (notification.actionUrl) {
      if (!notification.read) {
        onToggleRead(notification.id, true);
      }
      window.location.href = notification.actionUrl;
    }
  }

  return (
    <div
      className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#F4F4F4]"
      style={{
        backgroundColor: notification.read ? undefined : "#F4F4F4",
        opacity: notification.read ? 0.6 : 1,
        cursor: notification.actionUrl ? "pointer" : "default",
      }}
      onClick={handleClick}
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
              style={{ color: "#E42313" }}
              onClick={(e) => e.stopPropagation()}
            >
              View
            </a>
          )}
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-1 group-hover:flex" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleRead(notification.id, !notification.read)}
          className="rounded p-1 transition-colors hover:bg-[#E8E8E8]"
          style={{ color: "#7A7A7A" }}
          aria-label={notification.read ? "Mark as unread" : "Mark as read"}
        >
          {notification.read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded p-1 transition-colors hover:bg-[#E8E8E8]"
            style={{ color: "#7A7A7A" }}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border bg-white shadow-lg"
              style={{ borderColor: "#E8E8E8" }}
            >
              {onMuteType && (
                <button
                  onClick={() => { onMuteType(notification.type); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[#F4F4F4]"
                  style={{ color: "#0D0D0D" }}
                >
                  Mute this type
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(notification.id); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[#F4F4F4]"
                  style={{ color: "#E42313" }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

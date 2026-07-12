"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  // Navigate the notification target. Internal URLs go through the SPA router so
  // a deleted target's destination `notFound()` renders the in-app not-found
  // boundary gracefully instead of a hard full-page load to a dead resource.
  function navigate(url: string) {
    if (/^https?:\/\//i.test(url)) window.location.href = url;
    else router.push(url);
  }

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
      navigate(notification.actionUrl);
    }
  }

  return (
    <div
      className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-bg-subtle)]"
      style={{
        backgroundColor: notification.read ? undefined : "var(--color-bg-subtle)",
        opacity: notification.read ? 0.6 : 1,
        cursor: notification.actionUrl ? "pointer" : "default",
      }}
      onClick={handleClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
          {notification.actorName && (
            <span className="font-semibold">{notification.actorName} </span>
          )}
          {notification.message}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {timeAgo(notification.createdAt)}
          </span>
          {notification.actionUrl && (
            <button
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--color-primary)" }}
              onClick={(e) => { e.stopPropagation(); navigate(notification.actionUrl!); }}
            >
              View
            </button>
          )}
        </div>
      </div>
      <div className="hidden shrink-0 items-center gap-1 group-hover:flex" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onToggleRead(notification.id, !notification.read)}
          className="rounded p-1 transition-colors hover:bg-[var(--color-border-default)]"
          style={{ color: "var(--color-text-secondary)" }}
          aria-label={notification.read ? "Mark as unread" : "Mark as read"}
        >
          {notification.read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded p-1 transition-colors hover:bg-[var(--color-border-default)]"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border bg-white shadow-lg"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              {onMuteType && (
                <button
                  onClick={() => { onMuteType(notification.type); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-bg-subtle)]"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Mute this type
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => { onDelete(notification.id); setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-bg-subtle)]"
                  style={{ color: "var(--color-primary)" }}
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

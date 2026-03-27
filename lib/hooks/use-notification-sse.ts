"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

export function useNotificationSSE() {
  const utils = trpc.useUtils();

  useEffect(() => {
    const es = new EventSource("/api/sse/notifications");

    es.addEventListener("unread", () => {
      utils.notifications.unreadCount.invalidate();
      utils.notifications.recent.invalidate();
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [utils]);
}

"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

export function useNotificationSSE() {
  const utils = trpc.useUtils();

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      es = new EventSource("/api/sse/notifications");

      es.addEventListener("unread", () => {
        utils.notifications.unreadCount.invalidate();
        utils.notifications.recent.invalidate();
      });

      es.onerror = () => {
        es.close();
        // Reconnect after 5 seconds on error
        retryTimeout = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [utils]);
}

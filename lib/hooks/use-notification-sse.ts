"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

const BASE_RETRY_MS = 5000;
const MAX_RETRY_MS = 60000;

export function useNotificationSSE() {
  const utils = trpc.useUtils();

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;
    let attempt = 0;
    let stopped = false;

    function scheduleRetry() {
      // Exponential backoff with jitter — a fixed 5s retry meant a dev server
      // restart (or any outage) drove one reconnect attempt every 5 seconds
      // indefinitely. Jitter avoids every open tab retrying in lockstep.
      const delay = Math.min(BASE_RETRY_MS * 2 ** attempt, MAX_RETRY_MS);
      const jitter = delay * (0.5 + Math.random() * 0.5);
      attempt += 1;
      retryTimeout = setTimeout(connect, jitter);
    }

    async function connect() {
      if (stopped) return;
      // A signed-out tab (session expired, logged out elsewhere) has nothing
      // to reconnect for — the SSE route requires auth, so it would just
      // fail and retry forever. Stop instead of backing off toward nothing.
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json().catch(() => null);
        if (!session?.user) { stopped = true; return; }
      } catch {
        // Network hiccup checking the session — fall through and let the
        // EventSource itself fail/retry rather than stopping on a fluke.
      }
      if (stopped) return;

      es = new EventSource("/api/sse/notifications");

      es.addEventListener("open", () => {
        attempt = 0;
      });

      es.addEventListener("unread", () => {
        utils.notifications.unreadCount.invalidate();
        utils.notifications.recent.invalidate();
      });

      es.onerror = () => {
        es.close();
        if (!stopped) scheduleRetry();
      };
    }

    connect();

    return () => {
      stopped = true;
      clearTimeout(retryTimeout);
      es?.close();
    };
  }, [utils]);
}

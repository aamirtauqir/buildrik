"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import { SessionProvider } from "next-auth/react";
import type { AppRouter } from "@/server/trpc/router";

export const trpc = createTRPCReact<AppRouter>();

/** tRPC codes that will answer the same way however many times we ask. */
const FINAL_CODES = new Set([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "BAD_REQUEST",
  "CONFLICT",
  "PRECONDITION_FAILED",
  "UNPROCESSABLE_CONTENT",
  "METHOD_NOT_SUPPORTED",
  "PAYLOAD_TOO_LARGE",
]);

export function isFinalAnswer(code: unknown): boolean {
  return typeof code === "string" && FINAL_CODES.has(code);
}

function showErrorToast(title: string, message?: string) {
  const container = document.getElementById("trpc-toast-root");
  if (!container) return;

  const toast = document.createElement("div");
  toast.setAttribute("role", "alert");
  toast.style.cssText =
    "display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);background:#FEF2F2;border-left:4px solid #EF4444;max-width:360px;font-size:14px;color:#0D0D0D;animation:fadeIn 0.2s ease";

  const titleEl = document.createElement("span");
  titleEl.style.fontWeight = "600";
  titleEl.textContent = title;
  toast.appendChild(titleEl);

  if (message) {
    const msgEl = document.createElement("span");
    msgEl.style.color = "#7A7A7A";
    msgEl.textContent = ` ${message}`;
    toast.appendChild(msgEl);
  }

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/** /review/<token> and /share/<token> are reached by people with no login at
 *  all (a client reviewing a draft, a share-link visitor) — bouncing them to
 *  /auth/login on an UNAUTHORIZED answer (e.g. a stale/rotated token) dumps
 *  them out of the flow they were sent. Every other route keeps the
 *  redirect. */
function isPublicUnauthenticatedRoute(): boolean {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  return path.startsWith("/review/") || path.startsWith("/share/");
}

export function handleTRPCError(error: unknown) {
  if (!(error instanceof TRPCClientError)) {
    if (
      error instanceof Error &&
      (error.message.includes("fetch") || error.message.includes("network"))
    ) {
      showErrorToast("Network error", "Check your connection.");
    }
    return;
  }

  const code = error.data?.code as string | undefined;

  if (code === "UNAUTHORIZED" && !isPublicUnauthenticatedRoute()) {
    window.location.href = "/auth/login";
    return;
  }

  if (code === "INTERNAL_SERVER_ERROR") {
    showErrorToast("Something went wrong", "Please try again.");
    return;
  }

  if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
    showErrorToast("Network error", "Check your connection.");
    return;
  }

  // Every other tRPC error (4xx, including UNAUTHORIZED on a public route)
  // carries a server message worth surfacing — a hook-level onError still
  // overrides this default, and mutate(..., {onError}) runs alongside it.
  if (typeof code === "string") {
    showErrorToast("Couldn't complete that", error.message);
  }
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // D-13: the default staleTime is 0, so every remount/refocus
            // refetched — navigating Projects → Media → Projects inside 30s
            // re-issued sites.list every time. A query that needs fresher
            // data invalidates explicitly on mutation (grep onSuccess) or
            // overrides staleTime per-call; this is a floor, not a cap.
            staleTime: 30_000,
            retry: (failureCount, error) => {
              /* A definitive answer is not worth asking again. Only
                 UNAUTHORIZED was listed here, so opening a site you have no
                 access to sat behind the loading skeleton for ~6 seconds of
                 retries before the page could say "Site not found" — measured
                 on /dashboard/sites/<someone-else's-id>: skeleton at t+4s, the
                 real message only at t+6s. These codes mean the server has
                 answered; retrying changes nothing. */
              if (error instanceof TRPCClientError && isFinalAnswer(error.data?.code)) {
                return false;
              }
              return failureCount < 3;
            },
          },
          mutations: {
            onError: handleTRPCError,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          {children}
          <div
            id="trpc-toast-root"
            className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
          />
        </SessionProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

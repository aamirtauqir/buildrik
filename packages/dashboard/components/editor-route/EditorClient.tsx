"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { EditorSkeleton } from "./EditorSkeleton";
import { EditorErrorBoundary, EditorErrorScreen } from "./EditorErrorBoundary";

const AquibraStudio = dynamic(
  () => import("@buildrik/editor").then((m) => ({ default: m.AquibraStudio })),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

function reportColdLoad(siteId: string) {
  if (typeof window === "undefined" || typeof performance === "undefined") return;
  const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const navStart = navEntry?.startTime ?? 0;
  const coldLoadMs = Math.round(performance.now() - navStart);
  // Phase 3 observability scaffold: structured log readable by log aggregator.
  // When Sentry/Vercel Analytics is wired, replace with the SDK call.
  console.info(
    JSON.stringify({
      metric: "editor.cold_load_ms",
      value: coldLoadMs,
      siteId,
      route_unified: true,
      ts: Date.now(),
    }),
  );
}

export function EditorClient({ siteId }: { siteId: string }) {
  useEffect(() => {
    reportColdLoad(siteId);
    document.body.dataset.routeUnified = "true";
    return () => {
      delete document.body.dataset.routeUnified;
    };
  }, [siteId]);

  return (
    <EditorErrorBoundary
      siteId={siteId}
      fallback={({ error, retry }) => (
        <EditorErrorScreen
          message={
            error.name === "ChunkLoadError"
              ? "Editor was updated. Reload to continue."
              : "Editor crashed unexpectedly."
          }
          onRetry={() => {
            // ChunkLoadError after deploy: stale chunk URL is now 404.
            // Local retry remounts the same import — useless. Hard-reload required.
            if (error.name === "ChunkLoadError") window.location.reload();
            else retry();
          }}
        />
      )}
    >
      {/*
        key={siteId} forces full remount when soft-routing /edit/A → /edit/B.
        Without this, Composer state from previous site can autosave into wrong site.
        Eng review D4 / codex critical finding.
      */}
      <AquibraStudio key={siteId} style={{ height: "100vh" }} />
    </EditorErrorBoundary>
  );
}

"use client";

import dynamic from "next/dynamic";
import { EditorSkeleton } from "./EditorSkeleton";
import { EditorErrorBoundary, EditorErrorScreen } from "./EditorErrorBoundary";

const AquibraStudio = dynamic(
  () => import("@buildrik/editor").then((m) => ({ default: m.AquibraStudio })),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

export function EditorClient({ siteId }: { siteId: string }) {
  return (
    <EditorErrorBoundary
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

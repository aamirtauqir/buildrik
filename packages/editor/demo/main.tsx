/**
 * new-editor-l2 Demo
 * Standalone test harness for L2 production-wired editor extraction
 */

import * as React from "react";
import { createRoot } from "react-dom/client";
import { Agentation } from "agentation";
import { AquibraStudio } from "../src/editor/shell/AquibraStudio";
import type { Composer } from "../src/engine/Composer";
import { initErrorTracking } from "../src/shared/utils/errorTracking";
// Global styles.
// fonts.css is imported HERE rather than from default.css: default.css is also
// bundled into the dashboard for the unified editor route, where layout.tsx
// already loads the same families from a CDN — see the note at the top of
// themes/default.css. This host is the conformance measurement target, so it
// needs the self-hosted faces.
import "../src/themes/fonts.css";
import "../src/themes/default.css";

// Fire-and-forget Sentry init. No-ops when VITE_SENTRY_DSN is absent or
// @sentry/react isn't installed — safe in dev. captureError() calls inside
// ErrorBoundary components relied on this running first; previously init
// was never called and Sentry didn't know the DSN.
void initErrorTracking();
// Note: canvas CSS now loaded via src/editor/canvas/Canvas.tsx import (./Canvas.css).
// Legacy import "../src/components/Canvas/Canvas.css" deleted 2026-05-02 with src/components/.

const App: React.FC = () => {
  const composerRef = React.useRef<Composer | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0c10",
        color: "#e5e7eb",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AquibraStudio
        licenseKey="DEMO"
        onEditor={(composer) => {
          composerRef.current = composer;
        }}
        onReady={(_composer) => {
          // editor ready
        }}
        style={{ height: "100vh" }}
      />
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

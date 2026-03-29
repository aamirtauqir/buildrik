/**
 * new-editor-l2 Demo
 * Standalone test harness for L2 production-wired editor extraction
 */

import * as React from "react";
import { createRoot } from "react-dom/client";
import { AquibraStudio } from "../src/components/Editor/AquibraStudio";
import type { Composer } from "../src/engine/Composer";
import { applyTheme } from "../src/themes/index";

// Global styles
import "../src/themes/default.css";
import "../src/components/Canvas/Canvas.css";

const App: React.FC = () => {
  const composerRef = React.useRef<Composer | null>(null);

  React.useEffect(() => {
    applyTheme();
    document.documentElement.classList.add("aqb-dark");
  }, []);

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
    </div>
  );
};

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

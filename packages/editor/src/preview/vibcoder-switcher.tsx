import React from "react";
import { createRoot } from "react-dom/client";
import { Switcher } from "../editor/shared/vibcoder/Switcher";
import { sectionLabel } from "./_galleryStyles";

const tile: React.CSSProperties = {
  background: "var(--bk-bg-subtle, #f3f4f6)",
  border: "1px solid var(--bk-border)",
  borderRadius: 4,
  padding: "8px 12px",
  fontSize: 13,
  textAlign: "center",
};

const containerCard: React.CSSProperties = {
  background: "var(--bk-bg-panel, #fff)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  padding: 12,
  resize: "horizontal",
  overflow: "auto",
  minWidth: 160,
  maxWidth: 800,
  width: 600,
};

const note: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bk-ink-muted)",
  marginBottom: 8,
};

// Pure-CSS responsive: drag the bottom-right corner of each card to resize the
// container width. When width drops below the threshold, the row collapses
// into a vertical stack — no JS, no media queries, just flex-basis math.
function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default (threshold = md, 480px)</h2>
      <p style={note}>Resize card width below 480px — items stack.</p>
      <div style={containerCard}>
        <Switcher>
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Switcher>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>threshold = sm (320px)</h2>
      <p style={note}>Stays in row down to ~320px wide.</p>
      <div style={containerCard}>
        <Switcher threshold="sm">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Switcher>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>threshold = md (explicit, same as default)</h2>
      <p style={note}>Identical to default — collapses below 480px.</p>
      <div style={containerCard}>
        <Switcher threshold="md">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Switcher>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>threshold = lg (640px)</h2>
      <p style={note}>Collapses earlier — anything below 640px stacks.</p>
      <div style={containerCard}>
        <Switcher threshold="lg">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Switcher>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

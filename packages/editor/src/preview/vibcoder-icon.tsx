import React from "react";
import { createRoot } from "react-dom/client";
import { Icon, type IconName } from "../editor/shared/vibcoder/Icon";

const sectionLabel = {
  fontSize: 12,
  margin: "0 0 8px",
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const row = {
  display: "flex" as const,
  gap: 16,
  alignItems: "center" as const,
  flexWrap: "wrap" as const,
};

const grid = {
  display: "grid" as const,
  gridTemplateColumns: "repeat(8, 1fr)",
  gap: 12,
};

const cell = {
  display: "flex" as const,
  flexDirection: "column" as const,
  alignItems: "center" as const,
  gap: 4,
  padding: 8,
};

const cellName = { fontSize: 9, fontFamily: "ui-monospace, monospace", opacity: 0.5 };

const ALL_ICONS: IconName[] = [
  "alert-circle", "arrow-down", "arrow-up", "check", "check-circle",
  "chevron-down", "chevron-left", "chevron-right", "chevron-up", "circle",
  "close", "components", "copy", "eye", "eye-off",
  "file", "folder", "grip-vertical", "history", "image",
  "info", "layers", "link", "lock", "media",
  "minus", "more-horizontal", "more-vertical", "pages", "palette",
  "plus", "plus-square", "redo", "refresh", "search",
  "settings", "share", "square", "trash", "undo",
  "x",
];

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>sizes (chevron-down)</h2>
      <div style={row}>
        <Icon name="chevron-down" size="xs" />
        <Icon name="chevron-down" size="sm" />
        <Icon name="chevron-down" />
        <Icon name="chevron-down" size="md" />
        <Icon name="chevron-down" size="lg" />
        <Icon name="chevron-down" size="xl" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>color via parent (currentColor)</h2>
      <div style={row}>
        <span style={{ color: "var(--bd-fg-primary, #000)" }}>
          <Icon name="info" /> primary
        </span>
        <span style={{ color: "var(--buildrick-accent, #2D6DFF)" }}>
          <Icon name="link" /> accent
        </span>
        <span style={{ color: "var(--buildrick-success, #10b981)" }}>
          <Icon name="check-circle" /> success
        </span>
        <span style={{ color: "var(--buildrick-error, #ef4444)" }}>
          <Icon name="alert-circle" /> error
        </span>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>aria-label override (meaningful icon)</h2>
      <div style={row}>
        <Icon name="trash" aria-label="Delete page" aria-hidden={false} />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>all 41 glyphs</h2>
      <div style={grid}>
        {ALL_ICONS.map((n) => (
          <div key={n} style={cell}>
            <Icon name={n} />
            <span style={cellName}>{n}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

import React from "react";
import { createRoot } from "react-dom/client";
import { Icon, type IconName } from "../editor/shared/vibcoder/Icon";
import { sectionLabel, flexRow } from "./_galleryStyles";

const wideRow = { ...flexRow, gap: 16 };

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
      <div style={wideRow}>
        <Icon name="chevron-down" size="xs" />
        <Icon name="chevron-down" size="sm" />
        <Icon name="chevron-down" />
        <Icon name="chevron-down" size="md" />
        <Icon name="chevron-down" size="lg" />
        <Icon name="chevron-down" size="xl" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>color via parent (currentColor)</h2>
      <div style={wideRow}>
        <span style={{ color: "var(--bk-ink)" }}>
          <Icon name="info" /> primary
        </span>
        <span style={{ color: "var(--bk-accent)" }}>
          <Icon name="link" /> accent
        </span>
        <span style={{ color: "var(--bk-success)" }}>
          <Icon name="check-circle" /> success
        </span>
        <span style={{ color: "var(--bk-error)" }}>
          <Icon name="alert-circle" /> error
        </span>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>aria-label override (meaningful icon)</h2>
      <div style={wideRow}>
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

import React from "react";
import { createRoot } from "react-dom/client";
import { Spinner, StatusDot } from "../editor/shared/vibcoder/Spinner";
import { sectionLabel, flexRow } from "./_galleryStyles";

const inline = { ...flexRow, gap: 16 };
const labelRow = {
  display: "inline-flex" as const,
  gap: 8,
  alignItems: "center" as const,
};

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>spinner sizes (sm / default / lg)</h2>
      <div style={inline}>
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>spinner with custom aria-label</h2>
      <div style={inline}>
        <Spinner aria-label="Publishing" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>status dots (color via parent currentColor)</h2>
      <div style={inline}>
        <span style={{ ...labelRow, color: "var(--bk-accent)" }}>
          <StatusDot pulse />Connected
        </span>
        <span style={{ ...labelRow, color: "var(--bk-warning)" }}>
          <StatusDot />Slow connection
        </span>
        <span style={{ ...labelRow, color: "var(--bk-error)" }}>
          <StatusDot />Offline
        </span>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

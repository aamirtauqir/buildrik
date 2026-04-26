import React from "react";
import { createRoot } from "react-dom/client";
import { Divider } from "../editor/shared/vibcoder/Divider";
import { sectionLabel, stack, flexRow } from "./_galleryStyles";

const stackTight = { ...stack, gap: 12, maxWidth: 360 };
const verticalRow = {
  ...flexRow,
  gap: 12,
  alignItems: "stretch" as const,
  height: 32,
};

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>horizontal — solid (default)</h2>
      <div style={stackTight}>
        <Divider />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>horizontal — dashed / dotted / strong</h2>
      <div style={stackTight}>
        <Divider dividerStyle="dashed" />
        <Divider dividerStyle="dotted" />
        <Divider tone="strong" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>horizontal — inset</h2>
      <div style={stackTight}>
        <Divider inset />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>vertical (in-line dividers between buttons)</h2>
      <div style={verticalRow}>
        <span>One</span>
        <Divider orientation="vertical" />
        <span>Two</span>
        <Divider orientation="vertical" dividerStyle="dashed" />
        <span>Three</span>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>labelled composite (centered text)</h2>
      <div style={stackTight}>
        <Divider label="SECTION HEADER" />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

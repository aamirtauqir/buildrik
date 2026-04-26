import React from "react";
import { createRoot } from "react-dom/client";
import { Thumb } from "../editor/shared/vibcoder/Thumb";
import { sectionLabel, gridRow } from "./_galleryStyles";

const row = gridRow(3);

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>kinds (md)</h2>
      <div style={row}>
        <Thumb kind="placeholder" />
        <Thumb kind="image" src="https://picsum.photos/240/140" alt="" />
        <Thumb kind="interactive">click me</Thumb>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>sizes (placeholder)</h2>
      <div style={row}>
        <Thumb kind="placeholder" size="sm" />
        <Thumb kind="placeholder" />
        <Thumb kind="placeholder" size="lg" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>ratios (placeholder)</h2>
      <div style={row}>
        <Thumb kind="placeholder" ratio="1-1" />
        <Thumb kind="placeholder" ratio="16-9" />
        <Thumb kind="placeholder" ratio="4-3" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>interactive disabled</h2>
      <div style={row}>
        <Thumb kind="interactive">enabled</Thumb>
        <Thumb kind="interactive" disabled>disabled</Thumb>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

/**
 * Rail gallery — inline static demo.
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { Rail, RailButton } from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <div style={stack}>
      <p style={sectionLabel}>Vertical (default)</p>
      <Rail>
        <RailButton active aria-label="Pages">P</RailButton>
        <RailButton aria-label="Templates">T</RailButton>
        <RailButton aria-label="Media">M</RailButton>
        <RailButton aria-label="History">H</RailButton>
      </Rail>

      <p style={{ ...sectionLabel, marginTop: 24 }}>Horizontal (mobile bottom nav)</p>
      <Rail horizontal>
        <RailButton aria-label="Home">H</RailButton>
        <RailButton active aria-label="Search">S</RailButton>
        <RailButton aria-label="Account">A</RailButton>
      </Rail>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

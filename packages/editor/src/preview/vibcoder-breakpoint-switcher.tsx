import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { BreakpointSwitcher, type Breakpoint } from "../editor/shared/vibcoder/BreakpointSwitcher";
import { sectionLabel, stack } from "./_galleryStyles";

const stackSpaced = { ...stack, gap: 16 };

function Demo() {
  const [bp1, setBp1] = useState<Breakpoint>("desktop");
  const [bp2, setBp2] = useState<Breakpoint>("tablet");
  return (
    <>
      <h2 style={sectionLabel}>icon-only (default) — current: {bp1}</h2>
      <div style={stackSpaced}>
        <BreakpointSwitcher value={bp1} onChange={setBp1} />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>labelled — current: {bp2}</h2>
      <div style={stackSpaced}>
        <BreakpointSwitcher value={bp2} onChange={setBp2} labelled />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>each value pinned (no interaction)</h2>
      <div style={stackSpaced}>
        <BreakpointSwitcher value="desktop" onChange={() => {}} />
        <BreakpointSwitcher value="tablet" onChange={() => {}} />
        <BreakpointSwitcher value="mobile" onChange={() => {}} />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

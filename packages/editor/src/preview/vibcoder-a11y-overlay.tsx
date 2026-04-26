/**
 * A11yOverlay gallery — inline static demo.
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import {
  A11yOverlay,
  A11yOverlayTile,
  A11yOverlaySwatch,
  A11yOverlayRatio,
  A11yOverlayHit,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <div style={stack}>
      <p style={sectionLabel}>Default — accessibility audit panel</p>
      <A11yOverlay>
        <A11yOverlayTile>
          <h4>Contrast</h4>
          <p>WCAG 2.2 AA — minimum 4.5:1 for body text.</p>
          <div className="bd-a11y__contrast">
            <A11yOverlaySwatch>
              <span>Aa</span>
              <A11yOverlayRatio>7.4</A11yOverlayRatio>
            </A11yOverlaySwatch>
            <A11yOverlaySwatch tone="warn">
              <span>Aa</span>
              <A11yOverlayRatio>3.2</A11yOverlayRatio>
            </A11yOverlaySwatch>
            <A11yOverlaySwatch tone="fail">
              <span>Aa</span>
              <A11yOverlayRatio>1.8</A11yOverlayRatio>
            </A11yOverlaySwatch>
          </div>
        </A11yOverlayTile>
        <A11yOverlayTile>
          <h4>Touch targets</h4>
          <p>Minimum 44×44px hit area for interactive controls.</p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <A11yOverlayHit>OK</A11yOverlayHit>
            <A11yOverlayHit kind="fail">!</A11yOverlayHit>
          </div>
        </A11yOverlayTile>
      </A11yOverlay>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

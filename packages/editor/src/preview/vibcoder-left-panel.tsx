/**
 * LeftPanel gallery — inline static demo.
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import {
  LeftPanel,
  LeftPanelHead,
  LeftPanelTitle,
  LeftPanelSub,
  LeftPanelActions,
  LeftPanelBody,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <div style={stack}>
      <p style={sectionLabel}>Default — 320px scrollable side panel</p>
      <LeftPanel>
        <LeftPanelHead>
          <div>
            <LeftPanelTitle>Pages</LeftPanelTitle>
            <LeftPanelSub>12 pages</LeftPanelSub>
          </div>
          <LeftPanelActions>
            <button className="bd-icon-btn">+</button>
          </LeftPanelActions>
        </LeftPanelHead>
        <LeftPanelBody>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            <li>Home</li>
            <li>About</li>
            <li>Pricing</li>
            <li>Contact</li>
          </ul>
        </LeftPanelBody>
      </LeftPanel>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

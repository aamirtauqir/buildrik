/**
 * Topbar gallery — inline static demo (E5 doesn't apply, layout-only).
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import {
  Topbar,
  TopbarGroup,
  TopbarBrand,
  TopbarStatus,
  TopbarStatusDot,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <div style={stack}>
      <p style={sectionLabel}>Default — 3-column grid</p>
      <Topbar>
        <TopbarGroup>
          <TopbarBrand>Buildrik</TopbarBrand>
          <button className="bd-btn bd-btn--ghost">File</button>
          <button className="bd-btn bd-btn--ghost">Edit</button>
        </TopbarGroup>
        <TopbarGroup center>
          <button className="bd-btn">Desktop</button>
          <button className="bd-btn bd-btn--ghost">Tablet</button>
          <button className="bd-btn bd-btn--ghost">Mobile</button>
        </TopbarGroup>
        <TopbarGroup>
          <TopbarStatus>
            <TopbarStatusDot />
            Live
          </TopbarStatus>
          <button className="bd-btn bd-btn--primary">Publish</button>
        </TopbarGroup>
      </Topbar>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

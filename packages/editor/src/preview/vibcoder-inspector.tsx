/**
 * Inspector gallery — inline static demo.
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import {
  Inspector,
  InspectorCrumbs,
  InspectorHead,
  InspectorHeadIcon,
  InspectorSection,
  InspectorSectionHead,
  InspectorSectionBody,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <div style={stack}>
      <p style={sectionLabel}>Default — 280px right inspector</p>
      <Inspector>
        <InspectorCrumbs>Body / Hero / Heading</InspectorCrumbs>
        <InspectorHead>
          <InspectorHeadIcon>H</InspectorHeadIcon>
          <div>
            <strong>Hero heading</strong>
            <div>{"<h1>"}</div>
          </div>
        </InspectorHead>
        <InspectorSection expanded>
          <InspectorSectionHead>Layout</InspectorSectionHead>
          <InspectorSectionBody>
            <div>position, width, height controls...</div>
          </InspectorSectionBody>
        </InspectorSection>
        <InspectorSection>
          <InspectorSectionHead>Typography</InspectorSectionHead>
          <InspectorSectionBody>
            <div>(collapsed)</div>
          </InspectorSectionBody>
        </InspectorSection>
      </Inspector>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

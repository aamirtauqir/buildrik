/**
 * HistoryPanel gallery — inline static demo.
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import {
  HistoryPanel,
  HistoryPanelTimeline,
  HistoryPanelDay,
  HistoryPanelRow,
  HistoryPanelTag,
  HistoryPanelViewer,
  HistoryPanelDiffLine,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <div style={stack}>
      <p style={sectionLabel}>Default — timeline + diff viewer</p>
      <HistoryPanel>
        <HistoryPanelTimeline>
          <HistoryPanelDay>Today</HistoryPanelDay>
          <HistoryPanelRow selected>
            Edit hero copy <HistoryPanelTag published>v1.2</HistoryPanelTag>
          </HistoryPanelRow>
          <HistoryPanelRow>Add CTA button</HistoryPanelRow>
          <HistoryPanelDay>Yesterday</HistoryPanelDay>
          <HistoryPanelRow>
            Initial scaffold <HistoryPanelTag>v1.0</HistoryPanelTag>
          </HistoryPanelRow>
        </HistoryPanelTimeline>
        <HistoryPanelViewer>
          <HistoryPanelDiffLine kind="add">+ Welcome to Buildrik</HistoryPanelDiffLine>
          <HistoryPanelDiffLine kind="rem">- Hello world</HistoryPanelDiffLine>
          <HistoryPanelDiffLine>  Subhead unchanged</HistoryPanelDiffLine>
        </HistoryPanelViewer>
      </HistoryPanel>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

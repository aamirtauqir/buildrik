/**
 * NotificationCenter gallery — inline static demo.
 *
 * NOTE: per plan adaptation in NotificationCenter.tsx, the vendored CSS is a
 * persistent dropdown panel (not a Radix.Toast queue). E5 (DemoTrigger) does
 * NOT apply — this organism has no overlay state to drive.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import {
  NotificationCenter,
  NotificationCenterMark,
  NotificationCenterTabs,
  NotificationCenterTab,
  NotificationCenterBody,
  NotificationCenterGroup,
  NotificationCenterFoot,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <div style={stack}>
      <p style={sectionLabel}>Default panel (380px wide)</p>
      <NotificationCenter>
        <NotificationCenterTabs>
          <NotificationCenterTab active>All</NotificationCenterTab>
          <NotificationCenterTab>Mentions</NotificationCenterTab>
          <NotificationCenterTab>Comments</NotificationCenterTab>
        </NotificationCenterTabs>
        <NotificationCenterBody>
          <NotificationCenterGroup label="Today">
            <div style={{ padding: "8px 12px" }}>Saqib commented on Hero</div>
            <div style={{ padding: "8px 12px" }}>You were mentioned in Pricing</div>
          </NotificationCenterGroup>
          <NotificationCenterGroup label="Yesterday">
            <div style={{ padding: "8px 12px" }}>Build deployed to production</div>
          </NotificationCenterGroup>
        </NotificationCenterBody>
        <NotificationCenterFoot>View all notifications</NotificationCenterFoot>
      </NotificationCenter>

      <p style={{ ...sectionLabel, marginTop: 24 }}>With mark-all-read action</p>
      <NotificationCenter>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            borderBottom: "1px solid var(--bk-border)",
          }}
        >
          <strong>Notifications</strong>
          <NotificationCenterMark>Mark all read</NotificationCenterMark>
        </div>
        <NotificationCenterBody>
          <NotificationCenterGroup label="Today">
            <div style={{ padding: "8px 12px" }}>Empty state placeholder</div>
          </NotificationCenterGroup>
        </NotificationCenterBody>
      </NotificationCenter>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

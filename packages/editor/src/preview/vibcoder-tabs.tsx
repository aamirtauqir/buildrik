import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Tabs,
  Tab,
  PillGroup,
  PillButton,
} from "../editor/shared/vibcoder/Tabs";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 24, maxWidth: 640 };

function Demo() {
  // Per Contract B: caller owns active id. Demo shows local useState
  // driving controlled value — wrapper itself stays stateless. Panel
  // content is rendered by the caller based on the same value (NO
  // TabPanel exported — out of scope for Phase 2).
  const [tab, setTab] = useState("layout");
  const [bp, setBp] = useState("desktop");

  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>Tabs (underlined) — controlled</h2>
      <Tabs value={tab} onValueChange={setTab}>
        <Tab id="layout">Layout</Tab>
        <Tab id="design">Design</Tab>
        <Tab id="settings">Settings</Tab>
        <Tab id="ai" disabled>
          AI (locked)
        </Tab>
      </Tabs>
      <div
        style={{
          padding: 12,
          border: "1px solid var(--bk-border)",
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        Panel content for: <strong>{tab}</strong> (caller-rendered)
      </div>

      <h2 style={sectionLabel}>PillGroup (segmented control) — controlled</h2>
      <PillGroup value={bp} onValueChange={setBp}>
        <PillButton id="desktop">Desktop</PillButton>
        <PillButton id="tablet">Tablet</PillButton>
        <PillButton id="mobile">Mobile</PillButton>
      </PillGroup>
      <small style={{ opacity: 0.6 }}>active breakpoint: {bp}</small>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

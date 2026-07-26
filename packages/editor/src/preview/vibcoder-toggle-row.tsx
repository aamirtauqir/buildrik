import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ToggleRow } from "../editor/shared/vibcoder/ToggleRow";
import { Switch } from "../editor/shared/vibcoder/Switch";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 0, maxWidth: 480 };
const card = {
  padding: "0 16px",
  border: "1px solid var(--bk-border)",
  borderRadius: 8,
};

function Demo() {
  const [autoSave, setAutoSave] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [sync, setSync] = useState(true);

  return (
    <div style={{ ...stackWide, gap: 24 }}>
      <h2 style={sectionLabel}>preferences card — slot composition</h2>
      <div style={card}>
        <ToggleRow
          label="Auto-save"
          helper="Saves your work locally every 10 seconds."
          first
        >
          <Switch checked={autoSave} onCheckedChange={setAutoSave} />
        </ToggleRow>
        <ToggleRow
          label="Analytics"
          helper="Share anonymous usage data to help us improve."
        >
          <Switch checked={analytics} onCheckedChange={setAnalytics} />
        </ToggleRow>
        <ToggleRow label="Cloud sync" helper="Sync projects across devices.">
          <Switch checked={sync} onCheckedChange={setSync} />
        </ToggleRow>
      </div>

      <h2 style={sectionLabel}>disabled state (.is-disabled)</h2>
      <div style={card}>
        <ToggleRow
          label="Beta features"
          helper="Available on Pro plan."
          disabled
          first
        >
          <Switch checked={false} disabled />
        </ToggleRow>
      </div>

      <h2 style={sectionLabel}>--inset variant (off-card padding)</h2>
      <ToggleRow label="Notifications" helper="Inset row, no card needed." inset first>
        <Switch checked={true} onCheckedChange={() => {}} />
      </ToggleRow>

      <h2 style={sectionLabel}>label-only (no helper)</h2>
      <div style={card}>
        <ToggleRow label="Compact mode" first>
          <Switch checked={false} onCheckedChange={() => {}} />
        </ToggleRow>
      </div>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

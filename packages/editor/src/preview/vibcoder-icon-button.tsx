import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { IconButton } from "../editor/shared/vibcoder/IconButton";
import { Icon } from "../editor/shared/vibcoder/Icon";
import { sectionLabel, flexRow } from "./_galleryStyles";

function Demo() {
  const [on, setOn] = useState(true);
  return (
    <>
      <h2 style={sectionLabel}>sizes (ghost)</h2>
      <div style={flexRow}>
        <IconButton size="xs" aria-label="Settings"><Icon name="settings" /></IconButton>
        <IconButton size="sm" aria-label="Settings"><Icon name="settings" /></IconButton>
        <IconButton aria-label="Settings"><Icon name="settings" /></IconButton>
        <IconButton size="lg" aria-label="Settings"><Icon name="settings" /></IconButton>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>tones</h2>
      <div style={flexRow}>
        <IconButton variant="ghost" aria-label="More"><Icon name="more-horizontal" /></IconButton>
        <IconButton variant="primary" aria-label="Add"><Icon name="plus" /></IconButton>
        <IconButton variant="accent" aria-label="View"><Icon name="eye" /></IconButton>
        <IconButton variant="danger" aria-label="Close"><Icon name="x" /></IconButton>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>states</h2>
      <div style={flexRow}>
        <IconButton aria-label="Default"><Icon name="layers" /></IconButton>
        <IconButton pressed aria-label="Pressed"><Icon name="eye" /></IconButton>
        <IconButton disabled aria-label="Disabled"><Icon name="settings" /></IconButton>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>toggle (controlled)</h2>
      <div style={flexRow}>
        <IconButton
          variant="accent"
          pressed={on}
          aria-label={on ? "Hide" : "Show"}
          onClick={() => setOn((v) => !v)}
        >
          <Icon name={on ? "eye" : "eye-off"} />
        </IconButton>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>toggle states across tones (pressed)</h2>
      <div style={flexRow}>
        <IconButton variant="ghost" pressed aria-label="Ghost on"><Icon name="layers" /></IconButton>
        <IconButton variant="primary" pressed aria-label="Primary on"><Icon name="pages" /></IconButton>
        <IconButton variant="accent" pressed aria-label="Accent on"><Icon name="components" /></IconButton>
        <IconButton variant="danger" pressed aria-label="Danger on"><Icon name="x" /></IconButton>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

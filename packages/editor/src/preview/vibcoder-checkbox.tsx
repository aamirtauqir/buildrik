import React from "react";
import { createRoot } from "react-dom/client";
import { Checkbox } from "../editor/shared/vibcoder/Checkbox";

const sectionLabel = {
  fontSize: 12,
  margin: "0 0 8px",
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const stack = { display: "flex" as const, flexDirection: "column" as const, gap: 8 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>sizes</h2>
      <div style={stack}>
        <Checkbox size="sm" label="sm" />
        <Checkbox label="md (default)" />
        <Checkbox size="lg" label="lg" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>states</h2>
      <div style={stack}>
        <Checkbox defaultChecked label="checked" />
        <Checkbox indeterminate label="indeterminate" />
        <Checkbox error label="error" />
        <Checkbox disabled label="disabled" />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

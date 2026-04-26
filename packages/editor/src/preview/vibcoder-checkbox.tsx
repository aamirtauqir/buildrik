import React from "react";
import { createRoot } from "react-dom/client";
import { Checkbox } from "../editor/shared/vibcoder/Checkbox";
import { sectionLabel, stack } from "./_galleryStyles";

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

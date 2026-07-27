import React from "react";
import { createRoot } from "react-dom/client";
import { Checkbox } from "../editor/shared/vibcoder/Checkbox";
import { sectionLabel, stack } from "./_galleryStyles";

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>sizes</h2>
      <div style={stack}>
        <label className="bk-stack bk-stack--row bk-stack--sm"><Checkbox size="sm" /><span>sm</span></label>
        <label className="bk-stack bk-stack--row bk-stack--sm"><Checkbox /><span>md (default)</span></label>
        <label className="bk-stack bk-stack--row bk-stack--sm"><Checkbox size="lg" /><span>lg</span></label>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>states</h2>
      <div style={stack}>
        <label className="bk-stack bk-stack--row bk-stack--sm"><Checkbox defaultChecked /><span>checked</span></label>
        <label className="bk-stack bk-stack--row bk-stack--sm"><Checkbox indeterminate /><span>indeterminate</span></label>
        <label className="bk-stack bk-stack--row bk-stack--sm"><Checkbox error /><span>error</span></label>
        <label className="bk-stack bk-stack--row bk-stack--sm"><Checkbox disabled /><span>disabled</span></label>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

import React from "react";
import { createRoot } from "react-dom/client";
import { Label } from "../editor/shared/vibcoder/Label";
import { sectionLabel, stack } from "./_galleryStyles";

const stackForms = { ...stack, gap: 16, maxWidth: 360 };
// Local column-flex row for label-over-input. Renamed from `field` to avoid
// shadowing `_galleryStyles.field` (block + maxWidth, different shape).
const formRow = { display: "flex" as const, flexDirection: "column" as const, gap: 4 };
const fieldMock = {
  padding: "6px 10px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontFamily: "inherit",
};

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default</h2>
      <div style={stackForms}>
        <div style={formRow}>
          <Label htmlFor="f1">Page title</Label>
          <input id="f1" style={fieldMock} defaultValue="Home" />
        </div>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>required + info</h2>
      <div style={stackForms}>
        <div style={formRow}>
          <Label
            htmlFor="f2"
            required
            info={{ "aria-label": "Email is used for password reset" }}
          >
            Email
          </Label>
          <input id="f2" type="email" style={fieldMock} aria-required="true" />
        </div>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>size = sm + inline (sits beside control)</h2>
      <div style={stackForms}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Label size="sm" inline htmlFor="f3">Slug</Label>
          <input id="f3" style={fieldMock} defaultValue="/pricing" />
        </div>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>disabled</h2>
      <div style={stackForms}>
        <div style={formRow}>
          <Label htmlFor="f4" disabled>API key (read-only)</Label>
          <input id="f4" style={fieldMock} value="sk_live_***" readOnly />
        </div>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

import React from "react";
import { createRoot } from "react-dom/client";
import { Select } from "../editor/shared/vibcoder/Select";

const sectionLabel = {
  fontSize: 12,
  margin: "0 0 8px",
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const field = { display: "block" as const, maxWidth: 240, marginBottom: 8 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>sizes</h2>
      <div style={field}>
        <Select size="xs"><option>xs (24px)</option><option>two</option></Select>
      </div>
      <div style={field}>
        <Select size="sm"><option>sm (28px)</option><option>two</option></Select>
      </div>
      <div style={field}>
        <Select><option>md (default 32px)</option><option>two</option></Select>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>states</h2>
      <div style={field}>
        <Select error><option>error</option></Select>
      </div>
      <div style={field}>
        <Select disabled><option>disabled</option></Select>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

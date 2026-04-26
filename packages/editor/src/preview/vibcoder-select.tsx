import React from "react";
import { createRoot } from "react-dom/client";
import { Select } from "../editor/shared/vibcoder/Select";
import { sectionLabel, field } from "./_galleryStyles";

const wrap = field(240);

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>sizes</h2>
      <div style={wrap}>
        <Select size="xs"><option>xs (24px)</option><option>two</option></Select>
      </div>
      <div style={wrap}>
        <Select size="sm"><option>sm (28px)</option><option>two</option></Select>
      </div>
      <div style={wrap}>
        <Select><option>md (default 32px)</option><option>two</option></Select>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>states</h2>
      <div style={wrap}>
        <Select error><option>error</option></Select>
      </div>
      <div style={wrap}>
        <Select disabled><option>disabled</option></Select>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

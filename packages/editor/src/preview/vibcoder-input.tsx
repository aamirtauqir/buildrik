import React from "react";
import { createRoot } from "react-dom/client";
import { Input } from "../editor/shared/vibcoder/Input";
import { sectionLabel, field } from "./_galleryStyles";

const wrap = field(280);

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>variants</h2>
      <div style={wrap}><Input placeholder="default" /></div>
      <div style={wrap}><Input error defaultValue="bad" placeholder="error" /></div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>states</h2>
      <div style={wrap}><Input disabled placeholder="disabled" /></div>
      <div style={wrap}><Input type="number" defaultValue="42" /></div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

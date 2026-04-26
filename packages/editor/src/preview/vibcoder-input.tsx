import React from "react";
import { createRoot } from "react-dom/client";
import { Input } from "../editor/shared/vibcoder/Input";

const sectionLabel = {
  fontSize: 12,
  margin: "0 0 8px",
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const field = { display: "block" as const, maxWidth: 280, marginBottom: 8 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>variants</h2>
      <div style={field}><Input placeholder="default" /></div>
      <div style={field}><Input error defaultValue="bad" placeholder="error" /></div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>states</h2>
      <div style={field}><Input disabled placeholder="disabled" /></div>
      <div style={field}><Input type="number" defaultValue="42" /></div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

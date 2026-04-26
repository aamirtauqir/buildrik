import React from "react";
import { createRoot } from "react-dom/client";
import { Textarea } from "../editor/shared/vibcoder/Textarea";

const sectionLabel = {
  fontSize: 12,
  margin: "0 0 8px",
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const field = { display: "block" as const, maxWidth: 320, marginBottom: 12 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>sizes</h2>
      <div style={field}><Textarea size="sm" placeholder="sm" /></div>
      <div style={field}><Textarea placeholder="md (default)" /></div>
      <div style={field}><Textarea size="lg" placeholder="lg" /></div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>states</h2>
      <div style={field}><Textarea error defaultValue="bad" placeholder="error" /></div>
      <div style={field}><Textarea fixed placeholder="fixed (no resize)" /></div>
      <div style={field}><Textarea disabled placeholder="disabled" /></div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

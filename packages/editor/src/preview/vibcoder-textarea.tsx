import React from "react";
import { createRoot } from "react-dom/client";
import { Textarea } from "../editor/shared/vibcoder/Textarea";
import { sectionLabel, field } from "./_galleryStyles";

const wrap = { ...field(320), marginBottom: 12 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>sizes</h2>
      <div style={wrap}><Textarea size="sm" placeholder="sm" /></div>
      <div style={wrap}><Textarea placeholder="md (default)" /></div>
      <div style={wrap}><Textarea size="lg" placeholder="lg" /></div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>states</h2>
      <div style={wrap}><Textarea error defaultValue="bad" placeholder="error" /></div>
      <div style={wrap}><Textarea fixed placeholder="fixed (no resize)" /></div>
      <div style={wrap}><Textarea disabled placeholder="disabled" /></div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

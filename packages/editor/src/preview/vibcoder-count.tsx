import React from "react";
import { createRoot } from "react-dom/client";
import { Count } from "../editor/shared/vibcoder/Count";

const sectionLabel = {
  fontSize: 12,
  margin: "0 0 8px",
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const row = {
  display: "flex" as const,
  gap: 12,
  alignItems: "center" as const,
  flexWrap: "wrap" as const,
};

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>variants (md)</h2>
      <div style={row}>
        <Count>3</Count>
        <Count variant="accent">9</Count>
        <Count variant="success">42</Count>
        <Count variant="warning">!</Count>
        <Count variant="error">!!</Count>
        <Count variant="ink">12</Count>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>sizes</h2>
      <div style={row}>
        <Count size="xs">3</Count>
        <Count size="sm">3</Count>
        <Count>3</Count>
        <Count size="lg">3</Count>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>dot (xs / sm / md / lg + tones)</h2>
      <div style={row}>
        <Count dot size="xs" />
        <Count dot size="sm" />
        <Count dot />
        <Count dot size="lg" />
        <Count dot variant="accent" />
        <Count dot variant="error" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>inline (inside h3)</h2>
      <h3 style={{ fontSize: 18, margin: 0 }}>
        Drafts <Count inline variant="accent">7</Count>
      </h3>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

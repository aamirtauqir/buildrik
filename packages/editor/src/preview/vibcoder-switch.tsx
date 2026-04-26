import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Switch } from "../editor/shared/vibcoder/Switch";

const sectionLabel = {
  fontSize: 12,
  margin: "0 0 8px",
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const row = { display: "flex" as const, gap: 24, alignItems: "center" as const };

function Demo() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(true);
  return (
    <>
      <h2 style={sectionLabel}>states</h2>
      <div style={row}>
        <Switch checked={a} onCheckedChange={setA} />
        <Switch checked={b} onCheckedChange={setB} />
        <Switch checked={false} disabled />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

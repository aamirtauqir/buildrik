import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Switch } from "../editor/shared/vibcoder/Switch";
import { sectionLabel, flexRow } from "./_galleryStyles";

function Demo() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(true);
  return (
    <>
      <h2 style={sectionLabel}>states</h2>
      <div style={{ ...flexRow, gap: 24 }}>
        <Switch checked={a} onCheckedChange={setA} />
        <Switch checked={b} onCheckedChange={setB} />
        <Switch checked={false} disabled />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

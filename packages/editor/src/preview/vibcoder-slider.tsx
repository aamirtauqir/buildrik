import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Slider } from "../editor/shared/vibcoder/Slider";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 24 };

function Demo() {
  const [opacity, setOpacity] = useState(86);
  const [blur, setBlur] = useState(24);
  const [bare, setBare] = useState(50);

  return (
    <>
      <h2 style={sectionLabel}>with label + unit (controlled)</h2>
      <div style={stackWide}>
        <Slider
          label="Opacity"
          unit="%"
          value={opacity}
          onChange={setOpacity}
          min={0}
          max={100}
        />
        <Slider
          label="Blur radius"
          unit="px"
          value={blur}
          onChange={setBlur}
          min={0}
          max={80}
        />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>without head (track only)</h2>
      <div style={stackWide}>
        <Slider value={bare} onChange={setBare} min={0} max={100} />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>fractional step (0.1)</h2>
      <div style={stackWide}>
        <Slider
          label="Letter-spacing"
          unit="em"
          value={0.05}
          onChange={() => {}}
          min={-0.05}
          max={0.2}
          step={0.01}
        />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

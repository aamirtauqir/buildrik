import React from "react";
import { createRoot } from "react-dom/client";
import { Progress } from "../editor/shared/vibcoder/Progress";
import { sectionLabel, stack } from "./_galleryStyles";

const stackTight = { ...stack, gap: 12, maxWidth: 360 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>sizes (sm / md / lg) at 62%</h2>
      <div style={stackTight}>
        <Progress value={0.62} size="sm" />
        <Progress value={0.62} />
        <Progress value={0.62} size="lg" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>tones (default / success / warning / error)</h2>
      <div style={stackTight}>
        <Progress value={0.45} />
        <Progress value={1} variant="success" />
        <Progress value={0.78} variant="warning" />
        <Progress value={0.92} variant="error" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>indeterminate (publishing pending)</h2>
      <div style={stackTight}>
        <Progress indeterminate aria-label="Publishing" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>row composite — label + percent</h2>
      <div style={{ maxWidth: 360 }}>
        <Progress value={0.62} label="Publishing 7 changes" showPercent />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>row composite — completion success</h2>
      <div style={{ maxWidth: 360 }}>
        <Progress value={1} variant="success" label="hero-bg.jpg" showPercent />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

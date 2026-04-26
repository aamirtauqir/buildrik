import React from "react";
import { createRoot } from "react-dom/client";
import { Skeleton } from "../editor/shared/vibcoder/Skeleton";
import { sectionLabel, stack, flexRow } from "./_galleryStyles";

const stackTight = { ...stack, gap: 8, maxWidth: 360 };
const inline = { ...flexRow, gap: 8 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>rect (default)</h2>
      <div style={{ maxWidth: 360 }}>
        <Skeleton />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>multi-line text (line shape, varying widths)</h2>
      <div style={stackTight}>
        <Skeleton shape="line" style={{ width: "92%" }} />
        <Skeleton shape="line" style={{ width: "78%" }} />
        <Skeleton shape="line" style={{ width: "60%" }} />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>circle avatar (default 32px)</h2>
      <Skeleton shape="circle" />

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>card composite — circle + 2 lines</h2>
      <div style={inline}>
        <Skeleton shape="circle" size="lg" />
        <div style={{ ...stackTight, flex: 1, maxWidth: 280 }}>
          <Skeleton shape="line" style={{ width: "50%" }} />
          <Skeleton shape="line" style={{ width: "75%" }} />
        </div>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>circle — all sizes (xs / sm / default md / lg)</h2>
      <div style={inline}>
        <Skeleton shape="circle" size="xs" />
        <Skeleton shape="circle" size="sm" />
        <Skeleton shape="circle" />
        <Skeleton shape="circle" size="lg" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>rect — all sizes (xs / sm / default md / lg)</h2>
      <div style={stackTight}>
        <Skeleton shape="rect" size="xs" />
        <Skeleton shape="rect" size="sm" />
        <Skeleton shape="rect" />
        <Skeleton shape="rect" size="lg" />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

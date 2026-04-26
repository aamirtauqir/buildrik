import React from "react";
import { createRoot } from "react-dom/client";
import { Grip } from "../editor/shared/vibcoder/Grip";
import { Icon } from "../editor/shared/vibcoder/Icon";
import { sectionLabel, flexRow } from "./_galleryStyles";

const inline = { ...flexRow, gap: 16 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>vertical sizes (sm / default / lg)</h2>
      <div style={inline}>
        <Grip aria-label="Drag (sm)" size="sm">
          <Icon name="grip-vertical" />
        </Grip>
        <Grip aria-label="Drag">
          <Icon name="grip-vertical" />
        </Grip>
        <Grip aria-label="Drag (lg)" size="lg">
          <Icon name="grip-vertical" />
        </Grip>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>horizontal (rotated 90deg)</h2>
      <div style={inline}>
        <Grip aria-label="Drag row (sm)" orientation="horizontal" size="sm">
          <Icon name="grip-vertical" />
        </Grip>
        <Grip aria-label="Drag row" orientation="horizontal">
          <Icon name="grip-vertical" />
        </Grip>
        <Grip aria-label="Drag row (lg)" orientation="horizontal" size="lg">
          <Icon name="grip-vertical" />
        </Grip>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>disabled</h2>
      <div style={inline}>
        <Grip aria-label="Cannot reorder" disabled>
          <Icon name="grip-vertical" />
        </Grip>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

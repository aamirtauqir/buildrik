import React from "react";
import { createRoot } from "react-dom/client";
import { Kbd, KbdSeq } from "../editor/shared/vibcoder/Kbd";
import { sectionLabel, stack, flexRow, darkSurface } from "./_galleryStyles";

const stackP = { ...stack, gap: 16 };
const inline = { ...flexRow, gap: 12 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default (light) — sm + xs</h2>
      <div style={inline}>
        <Kbd>K</Kbd>
        <Kbd>⌘</Kbd>
        <Kbd size="xs">esc</Kbd>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>bare (no chrome — colored mono glyph)</h2>
      <div style={inline}>
        <Kbd variant="bare">⌘K</Kbd>
        <Kbd variant="bare" size="xs">/</Kbd>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>sequences — chord + then-separator</h2>
      <div style={stackP}>
        <KbdSeq>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdSeq>
        <KbdSeq>
          <Kbd>g</Kbd>
          <span className="bd-kbd-seq__then">then</span>
          <Kbd>p</Kbd>
        </KbdSeq>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>inverted (on dark surface — tooltip / menu context)</h2>
      <div style={darkSurface}>
        <p style={{ margin: 0, display: "flex", gap: 8, alignItems: "center" }}>
          Open command palette&nbsp;
          <KbdSeq>
            <Kbd variant="inverted">⌘</Kbd>
            <Kbd variant="inverted">K</Kbd>
          </KbdSeq>
        </p>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

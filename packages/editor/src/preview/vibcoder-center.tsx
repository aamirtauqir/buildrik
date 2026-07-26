import React from "react";
import { createRoot } from "react-dom/client";
import { Center } from "../editor/shared/vibcoder/Center";
import { sectionLabel } from "./_galleryStyles";

const child: React.CSSProperties = {
  background: "var(--bk-accent)",
  color: "var(--bk-accent-on)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  padding: "12px 20px",
  fontSize: 13,
};

const containerCard: React.CSSProperties = {
  background: "var(--bk-bg-panel, #fff)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  padding: 12,
  maxWidth: 520,
  height: 160,
};

const pageCard: React.CSSProperties = {
  background: "var(--bk-bg-panel, #fff)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  maxWidth: 520,
  // Capped so 100vh demo doesn't blow out the gallery — page modifier still
  // visible on the rendered Center via min-height:100vh on the inner.
  height: 240,
  overflow: "hidden",
};

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default (centers single child both axes)</h2>
      <div style={containerCard}>
        <Center style={{ height: "100%" }}>
          <div style={child}>centered</div>
        </Center>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>
        page (min-height: 100vh) — capped here for visual sanity
      </h2>
      <div style={pageCard}>
        <Center page>
          <div style={child}>splash content</div>
        </Center>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>
        inline (display: inline-flex — only as wide as child)
      </h2>
      <div style={containerCard}>
        <Center inline>
          <div style={child}>intrinsic</div>
        </Center>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>
        page + inline (combination — both modifiers applied)
      </h2>
      <div style={pageCard}>
        <Center page inline>
          <div style={child}>both modifiers</div>
        </Center>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

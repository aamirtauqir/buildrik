import React from "react";
import { createRoot } from "react-dom/client";
import { Frame, type FrameRatio } from "../editor/shared/vibcoder/Frame";
import { sectionLabel } from "./_galleryStyles";

const containerCard: React.CSSProperties = {
  background: "var(--buildrick-surface, #fff)",
  border: "1px solid var(--buildrick-border, #e5e7eb)",
  borderRadius: 6,
  padding: 12,
  maxWidth: 320,
};

/**
 * Solid-color block as media stand-in; vendored CSS forces width/height
 * 100% + object-fit:cover on a `div` child, so this fills the Frame.
 */
const block: React.CSSProperties = {
  background:
    "linear-gradient(135deg, var(--buildrick-accent, #2D6DFF) 0%, #6A9BFF 100%)",
  color: "var(--buildrick-text-on-accent, #fff)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 600,
};

function Demo() {
  const ratios: FrameRatio[] = ["1:1", "16:9", "4:3", "3:2"];
  return (
    <>
      {ratios.map((r) => (
        <React.Fragment key={r}>
          <h2
            style={{
              ...sectionLabel,
              marginTop: r === "1:1" ? 0 : 24,
            }}
          >
            ratio = {r}
          </h2>
          <div style={containerCard}>
            <Frame ratio={r}>
              <div style={block}>{r}</div>
            </Frame>
          </div>
        </React.Fragment>
      ))}
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

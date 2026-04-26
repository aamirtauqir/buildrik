import React from "react";
import { createRoot } from "react-dom/client";
import { HelperText } from "../editor/shared/vibcoder/HelperText";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 360 };
const field = { display: "flex" as const, flexDirection: "column" as const, gap: 4 };
const fieldMock = {
  padding: "6px 10px",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontFamily: "inherit",
};

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default (muted)</h2>
      <div style={stackWide}>
        <div style={field}>
          <input style={fieldMock} defaultValue="Home" />
          <HelperText>Shown in browser tab and search results.</HelperText>
        </div>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>error</h2>
      <div style={stackWide}>
        <div style={field}>
          <input style={fieldMock} defaultValue="Too short" />
          <HelperText tone="error" aria-live="polite">
            Must be at least 70 characters.
          </HelperText>
        </div>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>success</h2>
      <div style={stackWide}>
        <div style={field}>
          <input style={fieldMock} defaultValue="/pricing" />
          <HelperText tone="success">Slug is available.</HelperText>
        </div>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>warning</h2>
      <div style={stackWide}>
        <div style={field}>
          <input style={fieldMock} defaultValue="acme.dev" />
          <HelperText tone="warning">
            DNS not yet verified — propagation can take up to 24h.
          </HelperText>
        </div>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

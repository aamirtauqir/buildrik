import React from "react";
import { createRoot } from "react-dom/client";
import { Badge } from "../editor/shared/vibcoder/Badge";

const sectionLabel = {
  fontSize: 12,
  margin: "0 0 8px",
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const row = {
  display: "flex" as const,
  gap: 8,
  alignItems: "center" as const,
  flexWrap: "wrap" as const,
};

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>variants</h2>
      <div style={row}>
        <Badge variant="published">Published</Badge>
        <Badge variant="draft">Draft</Badge>
        <Badge variant="issues">Issues</Badge>
        <Badge variant="unsaved">Unsaved</Badge>
        <Badge variant="syncing">Syncing</Badge>
        <Badge variant="new">New</Badge>
        <Badge variant="premium">Premium</Badge>
        <Badge variant="count">12</Badge>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>with dot</h2>
      <div style={row}>
        <Badge variant="published" dot>Published</Badge>
        <Badge variant="draft" dot>Draft</Badge>
        <Badge variant="issues" dot>Issues</Badge>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

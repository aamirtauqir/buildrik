import React from "react";
import { createRoot } from "react-dom/client";
import { Tag } from "../editor/shared/vibcoder/Tag";

const sectionLabel = {
  fontSize: 12,
  margin: "0 0 8px",
  opacity: 0.6,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

const row = {
  display: "flex" as const,
  gap: 12,
  alignItems: "center" as const,
  flexWrap: "wrap" as const,
};

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>variants</h2>
      <div style={row}>
        <Tag>neutral</Tag>
        <Tag variant="accent">accent</Tag>
        <Tag variant="success">success</Tag>
        <Tag variant="warning">warning</Tag>
        <Tag variant="error">error</Tag>
        <Tag variant="ink">ink</Tag>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>sizes</h2>
      <div style={row}>
        <Tag size="sm">sm</Tag>
        <Tag size="md">md (default)</Tag>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>states (selectable)</h2>
      <div style={row}>
        <Tag selectable>off</Tag>
        <Tag selectable aria-pressed="true">on (aria-pressed)</Tag>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

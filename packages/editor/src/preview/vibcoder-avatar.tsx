import React from "react";
import { createRoot } from "react-dom/client";
import { Avatar } from "../editor/shared/vibcoder/Avatar";

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
      <h2 style={sectionLabel}>variants (md)</h2>
      <div style={row}>
        <Avatar>SK</Avatar>
        <Avatar variant="neutral">N</Avatar>
        <Avatar variant="ink">K</Avatar>
        <Avatar variant="success">S</Avatar>
        <Avatar variant="warning">W</Avatar>
        <Avatar solid>X</Avatar>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>sizes</h2>
      <div style={row}>
        <Avatar size="xs">S</Avatar>
        <Avatar size="sm">SM</Avatar>
        <Avatar>MD</Avatar>
        <Avatar size="lg">LG</Avatar>
        <Avatar size="xl">XL</Avatar>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>presence dots</h2>
      <div style={row}>
        <Avatar presence="online">SK</Avatar>
        <Avatar presence="away">SK</Avatar>
        <Avatar presence="offline">SK</Avatar>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>image</h2>
      <div style={row}>
        <Avatar src="https://i.pravatar.cc/64?img=12" alt="Dev" size="lg" />
        <Avatar src="https://i.pravatar.cc/64?img=24" alt="Dev" presence="online" size="lg" />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

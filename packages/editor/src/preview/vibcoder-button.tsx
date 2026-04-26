import React from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../editor/shared/vibcoder/Button";

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
      <h2 style={sectionLabel}>variants × sizes</h2>
      <div style={row}>
        <Button variant="primary" size="sm">
          primary sm
        </Button>
        <Button variant="primary" size="md">
          primary md
        </Button>
        <Button variant="primary" size="lg">
          primary lg
        </Button>
      </div>
      <div style={{ ...row, marginTop: 12 }}>
        <Button variant="secondary">secondary</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="danger">danger</Button>
        <Button variant="publish">publish</Button>
      </div>
      <div style={{ ...row, marginTop: 12 }}>
        <Button disabled>disabled</Button>
        <Button busy>busy</Button>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

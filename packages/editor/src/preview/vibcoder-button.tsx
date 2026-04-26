import React from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../editor/shared/vibcoder/Button";
import { sectionLabel, flexRow } from "./_galleryStyles";

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>variants × sizes</h2>
      <div style={flexRow}>
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
      <div style={{ ...flexRow, marginTop: 12 }}>
        <Button variant="secondary">secondary</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="danger">danger</Button>
        <Button variant="publish">publish</Button>
      </div>
      <div style={{ ...flexRow, marginTop: 12 }}>
        <Button disabled>disabled</Button>
        <Button busy>busy</Button>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

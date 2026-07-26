import React from "react";
import { createRoot } from "react-dom/client";
import { Stack } from "../editor/shared/vibcoder/Stack";
import { sectionLabel } from "./_galleryStyles";

const tile: React.CSSProperties = {
  background: "var(--bk-bg-subtle, #f3f4f6)",
  border: "1px solid var(--bk-border)",
  borderRadius: 4,
  padding: "8px 12px",
  fontSize: 13,
};

const containerCard: React.CSSProperties = {
  background: "var(--bk-bg-panel, #fff)",
  border: "1px solid var(--bk-border)",
  borderRadius: 6,
  padding: 12,
  maxWidth: 360,
};

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default (gap = md)</h2>
      <div style={containerCard}>
        <Stack>
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Stack>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>gap = xs</h2>
      <div style={containerCard}>
        <Stack gap="xs">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Stack>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>gap = sm</h2>
      <div style={containerCard}>
        <Stack gap="sm">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Stack>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>gap = md (explicit, same as default)</h2>
      <div style={containerCard}>
        <Stack gap="md">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Stack>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>gap = lg</h2>
      <div style={containerCard}>
        <Stack gap="lg">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Stack>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>gap = xl</h2>
      <div style={containerCard}>
        <Stack gap="xl">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Stack>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>separator (hairline between children)</h2>
      <div style={containerCard}>
        <Stack separator>
          <div style={tile}>Section A</div>
          <div style={tile}>Section B</div>
          <div style={tile}>Section C</div>
        </Stack>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>long content (10+ children)</h2>
      <div style={containerCard}>
        <Stack gap="sm">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} style={tile}>
              Row {i + 1}
            </div>
          ))}
        </Stack>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

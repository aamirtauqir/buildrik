import React from "react";
import { createRoot } from "react-dom/client";
import { Cluster } from "../editor/shared/vibcoder/Cluster";
import { sectionLabel } from "./_galleryStyles";

const tile: React.CSSProperties = {
  background: "var(--buildrick-surface-2, #f3f4f6)",
  border: "1px solid var(--buildrick-border)",
  borderRadius: 4,
  padding: "8px 12px",
  fontSize: 13,
};

const containerCard: React.CSSProperties = {
  background: "var(--buildrick-surface, #fff)",
  border: "1px solid var(--buildrick-border)",
  borderRadius: 6,
  padding: 12,
  maxWidth: 520,
};

const narrowCard: React.CSSProperties = {
  ...containerCard,
  maxWidth: 240,
};

/**
 * Tiles with mixed heights so cross-axis alignment differences are visible.
 */
const shortTile: React.CSSProperties = { ...tile, padding: "4px 10px" };
const tallTile: React.CSSProperties = { ...tile, padding: "20px 12px" };
const baselineTile: React.CSSProperties = {
  ...tile,
  padding: "8px 12px",
  fontSize: 22,
};

function MixedHeightChildren() {
  return (
    <>
      <div style={shortTile}>short</div>
      <div style={tile}>medium</div>
      <div style={tallTile}>tall</div>
      <div style={baselineTile}>Big</div>
    </>
  );
}

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default (gap = md, align = center)</h2>
      <div style={containerCard}>
        <Cluster>
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>gap = xs</h2>
      <div style={containerCard}>
        <Cluster gap="xs">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>gap = sm</h2>
      <div style={containerCard}>
        <Cluster gap="sm">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>
        gap = md (explicit, same as default)
      </h2>
      <div style={containerCard}>
        <Cluster gap="md">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>gap = lg</h2>
      <div style={containerCard}>
        <Cluster gap="lg">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>gap = xl</h2>
      <div style={containerCard}>
        <Cluster gap="xl">
          <div style={tile}>One</div>
          <div style={tile}>Two</div>
          <div style={tile}>Three</div>
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>align = start</h2>
      <div style={containerCard}>
        <Cluster align="start">
          <MixedHeightChildren />
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>
        align = center (explicit, same as default)
      </h2>
      <div style={containerCard}>
        <Cluster align="center">
          <MixedHeightChildren />
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>align = end</h2>
      <div style={containerCard}>
        <Cluster align="end">
          <MixedHeightChildren />
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>align = baseline</h2>
      <div style={containerCard}>
        <Cluster align="baseline">
          <MixedHeightChildren />
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>align = stretch</h2>
      <div style={containerCard}>
        <Cluster align="stretch">
          <MixedHeightChildren />
        </Cluster>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>
        wrap demo (many tags in narrow container)
      </h2>
      <div style={narrowCard}>
        <Cluster gap="sm">
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} style={tile}>
              tag-{i + 1}
            </div>
          ))}
        </Cluster>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

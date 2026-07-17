import React from "react";
import { createRoot } from "react-dom/client";
import { Grid, type GridCols, type GridGap } from "../editor/shared/vibcoder/Grid";
import { sectionLabel } from "./_galleryStyles";

const tile: React.CSSProperties = {
  background: "var(--buildrick-surface-2, #f3f4f6)",
  border: "1px solid var(--buildrick-border)",
  borderRadius: 4,
  padding: "12px 8px",
  fontSize: 13,
  textAlign: "center" as const,
};

const containerCard: React.CSSProperties = {
  background: "var(--buildrick-surface, #fff)",
  border: "1px solid var(--buildrick-border)",
  borderRadius: 6,
  padding: 12,
  maxWidth: 720,
};

const wideCard: React.CSSProperties = {
  ...containerCard,
  maxWidth: 960,
};

function Tiles({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={tile}>
          {i + 1}
        </div>
      ))}
    </>
  );
}

/**
 * Ragged-height tiles to make the dense-vs-non-dense difference visible.
 */
function RaggedTiles() {
  const heights = [40, 80, 40, 60, 120, 40, 60, 40, 80, 40, 60, 40];
  return (
    <>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{ ...tile, height: h, lineHeight: `${h - 16}px` }}
        >
          {i + 1}
        </div>
      ))}
    </>
  );
}

function Demo() {
  const numericCols: GridCols[] = [2, 3, 4, 6, 12];
  const gaps: GridGap[] = ["xs", "sm", "md", "lg", "xl"];

  return (
    <>
      <h2 style={sectionLabel}>cols = auto (auto-fit, minmax 220px)</h2>
      <div style={wideCard}>
        <Grid cols="auto">
          <Tiles count={12} />
        </Grid>
      </div>

      {numericCols.map((c) => (
        <React.Fragment key={`cols-${c}`}>
          <h2 style={{ ...sectionLabel, marginTop: 24 }}>cols = {c}</h2>
          <div style={c === 12 ? wideCard : containerCard}>
            <Grid cols={c}>
              <Tiles count={12} />
            </Grid>
          </div>
        </React.Fragment>
      ))}

      {gaps.map((g) => (
        <React.Fragment key={`gap-${g}`}>
          <h2 style={{ ...sectionLabel, marginTop: 24 }}>
            gap = {g}
            {g === "md" ? " (explicit, same as default)" : ""}
          </h2>
          <div style={containerCard}>
            <Grid cols={4} gap={g}>
              <Tiles count={12} />
            </Grid>
          </div>
        </React.Fragment>
      ))}

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>
        ragged heights — dense = false (default)
      </h2>
      <div style={containerCard}>
        <Grid cols={4}>
          <RaggedTiles />
        </Grid>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>
        ragged heights — dense = true
      </h2>
      <div style={containerCard}>
        <Grid cols={4} dense>
          <RaggedTiles />
        </Grid>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

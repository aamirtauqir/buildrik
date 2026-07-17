import { createRoot } from "react-dom/client";
import { TileMeta } from "../editor/shared/vibcoder/TileMeta";
import { StatusDot } from "../editor/shared/vibcoder/Spinner";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 16, maxWidth: 480 };

const tileFrame = {
  width: 160,
  border: "1px solid var(--bd-border)",
  borderRadius: 8,
  overflow: "hidden" as const,
};

const thumbBox = {
  height: 90,
  background: "var(--bd-bg-subtle)",
};

function Demo() {
  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>default — title + meta + action</h2>
      <div style={tileFrame}>
        <div style={thumbBox} />
        <TileMeta title="Marketing site" meta="Edited 3h ago">
          <button type="button" aria-label="more">
            ⋯
          </button>
        </TileMeta>
      </div>

      <h2 style={sectionLabel}>title-only (omit meta + action)</h2>
      <div style={tileFrame}>
        <div style={thumbBox} />
        <TileMeta title="Untitled draft" />
      </div>

      <h2 style={sectionLabel}>--inline (single-row, sub hidden)</h2>
      <div style={tileFrame}>
        <div style={thumbBox} />
        <TileMeta title="Inline tile" meta="suppressed" variant="inline">
          <button type="button" aria-label="more">
            ⋯
          </button>
        </TileMeta>
      </div>

      <h2 style={sectionLabel}>--centered (template tile, no action)</h2>
      <div style={tileFrame}>
        <div style={thumbBox} />
        <TileMeta title="Landing template" variant="centered" />
      </div>

      <h2 style={sectionLabel}>--with-status (caller composes leading dot)</h2>
      {/*
        The .bd-tile-meta--with-status > .bd-status-dot CSS rule targets a
        StatusDot as the FIRST child of the root. Wrapper template renders
        __body first, so this gallery shows the variant flag alongside a
        manually-composed StatusDot inside __action — the most ergonomic
        Phase 2 path until a leading slot is added.
      */}
      <div style={tileFrame}>
        <div style={thumbBox} />
        <TileMeta title="Live document" meta="3 collaborators" variant="with-status">
          <StatusDot pulse style={{ color: /* @lint-hex-policy: dev gallery StatusDot demo color */ "#22C55E" }} />
        </TileMeta>
      </div>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

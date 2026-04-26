import React from "react";
import { createRoot } from "react-dom/client";
import { SurfaceHead } from "../editor/shared/vibcoder/SurfaceHead";
import { IconButton } from "../editor/shared/vibcoder/IconButton";
import { Icon } from "../editor/shared/vibcoder/Icon";
import { Tag } from "../editor/shared/vibcoder/Tag";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 24, maxWidth: 600 };

function Demo() {
  return (
    <>
      <h2 style={sectionLabel}>default (title only)</h2>
      <div style={stackWide}>
        <SurfaceHead title="Page Settings" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>with eyebrow + meta</h2>
      <div style={stackWide}>
        <SurfaceHead
          title="Connect a custom domain"
          eyebrow="STEP 2"
          meta="updated just now"
        />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>full layout (eyebrow + title + meta + tag + actions)</h2>
      <div style={stackWide}>
        <SurfaceHead
          title="Pricing page"
          eyebrow="DRAFT"
          meta="last edited 2h ago"
          tag={<Tag>v3</Tag>}
        >
          <IconButton size="sm" aria-label="Settings">
            <Icon name="settings" />
          </IconButton>
          <IconButton size="sm" aria-label="Close">
            <Icon name="close" />
          </IconButton>
        </SurfaceHead>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>variants</h2>
      <div style={stackWide}>
        <SurfaceHead title="Small variant" size="sm" meta="compact header" />
        <SurfaceHead title="Large variant" size="lg" meta="hero-style header" />
        <SurfaceHead title="Flush (no border-bottom)" variant="flush" />
        <SurfaceHead title="Subtle (tinted background)" variant="subtle" />
        <SurfaceHead title="Centered" variant="centered" meta="aligned to center">
          <IconButton size="sm" aria-label="Action">
            <Icon name="check" />
          </IconButton>
        </SurfaceHead>
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

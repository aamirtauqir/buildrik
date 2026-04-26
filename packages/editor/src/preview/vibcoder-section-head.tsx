import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { SectionHead } from "../editor/shared/vibcoder/SectionHead";
import { Icon } from "../editor/shared/vibcoder/Icon";
import { IconButton } from "../editor/shared/vibcoder/IconButton";
import { sectionLabel, stack } from "./_galleryStyles";

const stackP = { ...stack, gap: 4 };

function Demo() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <h2 style={sectionLabel}>default (title only)</h2>
      <div style={stackP}>
        <SectionHead title="Layout" />
        <SectionHead title="Typography" />
        <SectionHead title="Colors" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>with count</h2>
      <div style={stackP}>
        <SectionHead title="Pages" count={12} />
        <SectionHead title="Components" count={47} />
        <SectionHead title="Empty group" count={0} />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>with indicator + actions (controlled open)</h2>
      <div style={stackP}>
        <SectionHead
          title="Spacing"
          open={open}
          indicator={<Icon name="chevron-right" />}
          onClick={() => setOpen((x) => !x)}
        >
          <IconButton size="xs" aria-label="Add spacing token">
            <Icon name="plus" />
          </IconButton>
        </SectionHead>
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>variants</h2>
      <div style={stackP}>
        <SectionHead title="Small" size="sm" count={3} />
        <SectionHead title="Bordered" variant="bordered" />
        <SectionHead title="Inset (no horizontal padding)" variant="inset" />
        <SectionHead title="Ink (full-width tone)" variant="ink" count={9} />
        <SectionHead title="Inline title (sentence case)" variant="inline-title" />
      </div>

      <h2 style={{ ...sectionLabel, marginTop: 24 }}>disabled</h2>
      <div style={stackP}>
        <SectionHead title="Locked section" disabled count={2} />
      </div>
    </>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

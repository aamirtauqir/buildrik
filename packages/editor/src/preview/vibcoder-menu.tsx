import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Menu, MenuGroup, MenuLabel, MenuItem } from "../editor/shared/vibcoder/Menu";
import { sectionLabel, stack } from "./_galleryStyles";

const stackWide = { ...stack, gap: 24, maxWidth: 360 };

function Demo() {
  // MenuItem `selected` is caller-controlled (no internal useState).
  // Gallery uses local useState to drive a single-select demo. Phase 2
  // does not ship keyboard-nav — Phase 3 organism (CommandPalette) wires it.
  const [selectedView, setSelectedView] = useState("recent");

  return (
    <div style={stackWide}>
      <h2 style={sectionLabel}>file menu — groups + label + slots</h2>
      <Menu>
        <MenuLabel>File</MenuLabel>
        <MenuGroup>
          <MenuItem icon={<span>+</span>} kbd="⌘N">
            New project
          </MenuItem>
          <MenuItem
            selected={selectedView === "recent"}
            onClick={() => setSelectedView("recent")}
            icon={<span>↻</span>}
            kbd="⌘O"
          >
            Open recent
          </MenuItem>
          <MenuItem icon={<span>↑</span>} kbd="⌘⇧S">
            Save as…
          </MenuItem>
        </MenuGroup>
        <MenuGroup>
          <MenuItem icon={<span>⤴</span>} chevron={<span>›</span>}>
            Export
          </MenuItem>
          <MenuItem disabled icon={<span>⛓</span>}>
            Share (locked)
          </MenuItem>
        </MenuGroup>
        <MenuGroup>
          <MenuItem danger icon={<span>×</span>}>
            Delete project
          </MenuItem>
        </MenuGroup>
      </Menu>

      <small style={{ opacity: 0.6 }}>
        selectedView={selectedView}
      </small>
    </div>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

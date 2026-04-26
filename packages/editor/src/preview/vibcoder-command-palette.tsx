/**
 * CommandPalette gallery — uses DemoTrigger per Phase 3 Contract E5.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { DemoTrigger } from "./_lib/DemoTrigger";
import {
  CommandPalette,
  CommandPaletteInput,
  CommandPaletteList,
  CommandPaletteItem,
  CommandPaletteSection,
  CommandPaletteEmpty,
  OverlayMount,
} from "../editor/shared/vibcoder";
import { sectionLabel, stack } from "./_galleryStyles";

const COMMANDS = [
  { group: "Navigation", id: "go-home", label: "Go to home" },
  { group: "Navigation", id: "go-search", label: "Open search" },
  { group: "Edit", id: "copy", label: "Copy selection" },
  { group: "Edit", id: "paste", label: "Paste" },
  { group: "Edit", id: "undo", label: "Undo" },
];

function Demo() {
  return (
    <OverlayMount>
      <div style={stack}>
        <p style={sectionLabel}>Type to filter, ↑↓ to navigate, Enter to select</p>
        <DemoTrigger label="Open palette (⌘K)">
          {(open, setOpen) => (
            <CommandPalette
              open={open}
              onOpenChange={setOpen}
              label="Command palette"
            >
              <CommandPaletteInput placeholder="Type a command..." />
              <CommandPaletteList>
                <CommandPaletteEmpty>No results found.</CommandPaletteEmpty>
                <CommandPaletteSection heading="Navigation">
                  {COMMANDS.filter((c) => c.group === "Navigation").map((c) => (
                    <CommandPaletteItem
                      key={c.id}
                      value={c.label}
                      onSelect={() => {
                        setOpen(false);
                      }}
                    >
                      {c.label}
                    </CommandPaletteItem>
                  ))}
                </CommandPaletteSection>
                <CommandPaletteSection heading="Edit">
                  {COMMANDS.filter((c) => c.group === "Edit").map((c) => (
                    <CommandPaletteItem
                      key={c.id}
                      value={c.label}
                      onSelect={() => {
                        setOpen(false);
                      }}
                    >
                      {c.label}
                    </CommandPaletteItem>
                  ))}
                </CommandPaletteSection>
              </CommandPaletteList>
            </CommandPalette>
          )}
        </DemoTrigger>
      </div>
    </OverlayMount>
  );
}

const root = document.getElementById("react-root");
if (root) createRoot(root).render(<Demo />);

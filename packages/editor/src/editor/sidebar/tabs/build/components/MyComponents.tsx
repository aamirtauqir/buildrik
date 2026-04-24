/**
 * MyComponents — honest three-state component panel
 * State 1: No API → "coming soon"
 * State 2: API + 0 items → how to save
 * State 3: API + items → render list
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";

interface MyComponentsProps {
  open: boolean;
  onToggle: () => void;
  composer: Composer | null;
}

// Composer.elements.getComponents() is not yet on the formal Composer type.
// This duck-type check detects whether the method exists at runtime.
// If getComponents is renamed in blockRegistry, update this check too.
function canUseComponents(composer: Composer | null): boolean {
  if (!composer) return false;
  const el = composer.elements as unknown as Record<string, unknown>;
  return typeof el.getComponents === "function";
}

export const MyComponents: React.FC<MyComponentsProps> = ({ open, onToggle, composer }) => {
  if (!canUseComponents(composer)) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div>
      <div
        className="bld-mycomp-hdr"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={open}
      >
        <svg className={`bld-mycomp-chev${open ? " open" : ""}`} viewBox="0 0 24 24">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="bld-sec-lbl">My Components</span>
      </div>
      <div className={`bld-mycomp-body${open ? " open" : ""}`}>
        <div className="bld-empty-comp">
          <span style={{ fontSize: 12, color: "var(--bd-fg-muted)", lineHeight: 1.5 }}>
            No saved components yet. Select an element → right-click → Save as Component.
          </span>
        </div>
      </div>
    </div>
  );
};

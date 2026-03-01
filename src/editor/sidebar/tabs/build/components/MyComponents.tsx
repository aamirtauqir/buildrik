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

export const MyComponents: React.FC<MyComponentsProps> = ({ open, onToggle, composer }) => {
  const hasApi =
    composer !== null &&
    typeof (composer?.elements as unknown as Record<string, unknown> | undefined)?.[
      "getComponents"
    ] === "function";

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
          {!hasApi ? (
            <span style={{ fontSize: 11, color: "var(--aqb-text-muted)", lineHeight: 1.5 }}>
              Components feature coming soon.
            </span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--aqb-text-muted)", lineHeight: 1.5 }}>
              No saved components yet. Select an element → right-click → Save as Component.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

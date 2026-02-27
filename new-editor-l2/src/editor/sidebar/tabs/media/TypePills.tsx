/**
 * Media Tab — Type Filter Pills
 * Shared by Library and Discovery views.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TYPE_PILLS } from "./mediaData";
import type { TypePillsProps } from "./mediaTypes";

export function TypePills({ activeType, counts, discMode, onTypeChange }: TypePillsProps) {
  return (
    <div className={`med-type-pills${discMode ? " disc-mode" : ""}`} role="tablist">
      {TYPE_PILLS.map(({ type, label, icon }) => (
        <button
          key={type}
          role="tab"
          aria-selected={activeType === type}
          className={`med-pill${activeType === type ? " active" : ""}`}
          data-type={type}
          onClick={() => onTypeChange(type)}
        >
          <span className="med-pill-icon" aria-hidden="true">
            {icon}
          </span>
          {label}
          {!discMode && <span className="med-pill-count">{counts[type]}</span>}
        </button>
      ))}
    </div>
  );
}

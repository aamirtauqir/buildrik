/**
 * Media Tab — Type Filter Pills
 * Shared by Library and Discovery views. Uses Lucide icons.
 * @license BSD-3-Clause
 */

import { Image, LayoutGrid, Shapes, Type, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { TYPE_PILLS } from "../data/mediaData";
import type { TypePillsProps } from "../data/mediaTypes";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutGrid,
  Image,
  Video,
  Shapes,
  Type,
};

export function TypePills({ activeType, counts, discMode, onTypeChange }: TypePillsProps) {
  return (
    <div className={`med-type-pills${discMode ? " disc-mode" : ""}`} role="tablist">
      {TYPE_PILLS.map(({ type, label, lucideIcon }) => {
        const Icon = ICON_MAP[lucideIcon];
        return (
          <button
            key={type}
            role="tab"
            aria-selected={activeType === type}
            className={`med-pill${activeType === type ? " active" : ""}`}
            data-type={type}
            onClick={() => onTypeChange(type)}
          >
            {Icon && (
              <span className="med-pill-icon" aria-hidden="true">
                <Icon size={12} />
              </span>
            )}
            {label}
            {!discMode && <span className="med-pill-count">{counts[type]}</span>}
          </button>
        );
      })}
    </div>
  );
}

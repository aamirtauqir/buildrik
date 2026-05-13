import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * TypePills — horizontal filter chips for media type (All / Img / Vid / Ico / Fnt).
 * Emits onTypeChange with the new filter. `counts` populate small badges.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaTypeFilter, TypeCounts } from "../data/mediaTypes";

interface TypePillsProps {
  activeType: MediaTypeFilter;
  counts: TypeCounts;
  /** When true, hide count badges (discovery surfaces don't track them). */
  discMode?: boolean;
  onTypeChange(type: MediaTypeFilter): void;
}

const PILLS: Array<{ key: MediaTypeFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "img", label: "Images" },
  { key: "vid", label: "Video" },
  { key: "ico", label: "Icons" },
  { key: "fnt", label: "Fonts" },
];

export function TypePills({
  activeType,
  counts,
  discMode = false,
  onTypeChange,
}: TypePillsProps) {
  return (
    <div className="med-type-pills" role="tablist" aria-label="Filter by media type">
      {PILLS.map((p) => {
        const isActive = p.key === activeType;
        const count = counts[p.key];
        return (
          <Button
            key={p.key}
            type="button"
            role="tab"
            size="sm"
            variant="ghost"
            aria-selected={isActive}
            className={`med-type-pill${isActive ? " med-type-pill--active" : ""}`}
            onClick={() => onTypeChange(p.key)}
          >
            {p.label}
            {!discMode && count > 0 ? (
              <span className="med-type-pill__count">{count}</span>
            ) : null}
          </Button>
        );
      })}
    </div>
  );
}

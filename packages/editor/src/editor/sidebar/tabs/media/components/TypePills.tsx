/**
 * TypePills — horizontal filter chips for media type (All / Img / Vid / Ico / Fnt).
 * Emits onTypeChange with the new filter. `counts` populate small badges.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaTypeFilter, TypeCounts } from "../data/mediaTypes";
import { Button } from "flowbite-react";

interface TypePillsProps {
  activeType: MediaTypeFilter;
  counts: TypeCounts;
  /** When true, hide count badges (discovery surfaces don't track them). */
  discMode?: boolean;
  onTypeChange(type: MediaTypeFilter): void;
}

// Labels match the file's intent doc above (All / Img / Vid / Ico / Fnt).
// Short labels let all 5 pills fit beside the "+ Stock" button at the
// narrow Media-panel width without horizontal-scroll clipping the last
// pill. `title` exposes the full word for hover + screen readers.
const PILLS: Array<{ key: MediaTypeFilter; label: string; title: string }> = [
  { key: "all", label: "All", title: "All" },
  { key: "img", label: "Img", title: "Images" },
  { key: "vid", label: "Vid", title: "Video" },
  { key: "ico", label: "Ico", title: "Icons" },
  { key: "fnt", label: "Fnt", title: "Fonts" },
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
            size="xs"
            color="light"
            aria-selected={isActive}
            aria-label={p.title}
            title={p.title}
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

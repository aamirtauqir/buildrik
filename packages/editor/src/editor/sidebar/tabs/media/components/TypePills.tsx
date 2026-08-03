/**
 * TypePills — the media-type filter chips. Figma `144:13` (pills `144:14`-`144:25`).
 *
 * The board changed two things about this row and both are load-bearing:
 *
 * 1. **Full words, not abbreviations.** It reads `image 128 · video 6 · svg 24 ·
 *    icon 370`, where this used to render `All / Img / Vid / Ico / Fnt`. The
 *    abbreviations existed to fit five pills beside a "+ Stock" button; the
 *    board moved Stock to the footer, so the width they were buying is free.
 * 2. **The count is mono.** `data/11 · mono small` — Geist Mono 500 with
 *    `tabular-nums`. A count that reflows as it changes is the jitter the
 *    section headers were fixed for (board 16:16), and this row updates on
 *    every upload.
 *
 * `svg` is this codebase's `ico` bucket and `icon` is its `fnt` bucket: the
 * board names the file kinds a user recognises, the data model names its own
 * buckets. The mapping lives here, once, rather than being renamed through the
 * state layer.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Chip } from "@/editor/chrome-ui";
import type { MediaTypeFilter, TypeCounts } from "../data/mediaTypes";

interface TypePillsProps {
  activeType: MediaTypeFilter;
  counts: TypeCounts;
  /** When true, hide count badges (discovery surfaces don't track them). */
  discMode?: boolean;
  onTypeChange(type: MediaTypeFilter): void;
}

/**
 * `all` keeps its chip even though the board's mock does not draw one: without
 * it a filtered drawer has no way back to everything, and the board's own
 * `Media · filtered` state has to return somewhere.
 */
const PILLS: Array<{ key: MediaTypeFilter; label: string; title: string }> = [
  { key: "all", label: "all", title: "All media" },
  { key: "img", label: "image", title: "Images" },
  { key: "vid", label: "video", title: "Video" },
  { key: "ico", label: "svg", title: "Icons and SVG" },
  { key: "fnt", label: "icon", title: "Fonts and icon sets" },
];

export function TypePills({
  activeType,
  counts,
  discMode = false,
  onTypeChange,
}: TypePillsProps) {
  return (
    <div
      className="med-type-pills tw:flex tw:items-center tw:gap-2 tw:overflow-x-auto tw:px-4 tw:py-1 tw:text-[11px] tw:leading-4"
      role="tablist"
      aria-label="Filter by media type"
      data-testid="media-type-chips"
    >
      {PILLS.map((p) => {
        const isActive = p.key === activeType;
        const count = counts[p.key];
        return (
          <Chip
            key={p.key}
            role="tab"
            selected={isActive}
            label={p.label}
            count={discMode ? undefined : count}
            aria-label={p.title}
            title={p.title}
            data-testid={`media-type-chip-${p.key}`}
            className={isActive ? "med-type-pill med-type-pill--active" : "med-type-pill"}
            onClick={() => onTypeChange(p.key)}
          />
        );
      })}
    </div>
  );
}

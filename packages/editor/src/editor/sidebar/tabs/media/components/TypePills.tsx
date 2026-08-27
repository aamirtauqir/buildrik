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
import type { MediaBucket, TypeCounts } from "../data/mediaTypes";

interface TypePillsProps {
  /** Board 145:2 caption: "Type pills are a multi-select filter" — empty = all. */
  selectedTypes: ReadonlySet<MediaBucket>;
  counts: TypeCounts;
  /** When true, hide count badges (discovery surfaces don't track them). */
  discMode?: boolean;
  onToggle(type: MediaBucket): void;
}

/**
 * No `all` pill: the filter is multi-select, so deselecting every pill IS
 * "everything" — the board draws exactly these four (144:14-144:25).
 */
const PILLS: Array<{ key: MediaBucket; label: string; title: string }> = [
  { key: "img", label: "image", title: "Images" },
  { key: "vid", label: "video", title: "Video" },
  { key: "ico", label: "svg", title: "Icons and SVG" },
  { key: "fnt", label: "icon", title: "Fonts and icon sets" },
];

export function TypePills({
  selectedTypes,
  counts,
  discMode = false,
  onToggle,
}: TypePillsProps) {
  return (
    <div
      className="med-type-pills tw:flex tw:items-center tw:gap-2 tw:overflow-x-auto tw:px-4 tw:py-1 tw:text-[11px] tw:leading-4"
      role="group"
      aria-label="Filter by media type"
      data-testid="media-type-chips"
    >
      {PILLS.map((p) => {
        const isActive = selectedTypes.has(p.key);
        const count = counts[p.key];
        /* A pill printing `0` is a filter whose only possible result is "No
           assets matching this filter" — and that state has no way out of it,
           so the chip walked the user into a dead end it had already told them
           about. Disabled, with the reason, rather than hidden: the row would
           otherwise change shape on every upload, which is the jitter the mono
           count exists to avoid.

           An ACTIVE pill stays enabled even at zero. Deleting the last SVG
           while filtered to SVG must not strip the control that clears it. */
        const isDeadFilter = !discMode && count === 0 && !isActive;
        return (
          <Chip
            key={p.key}
            aria-pressed={isActive}
            selected={isActive}
            label={p.label}
            count={discMode ? undefined : count}
            aria-label={p.title}
            disabled={isDeadFilter}
            title={isDeadFilter ? `No ${p.label} files in this library yet` : p.title}
            data-testid={`media-type-chip-${p.key}`}
            countTestId={`media-type-count-${p.key}`}
            className={isActive ? "med-type-pill med-type-pill--active" : "med-type-pill"}
            onClick={() => onToggle(p.key)}
          />
        );
      })}
    </div>
  );
}

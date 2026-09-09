/**
 * BrandPreview — what the brand LOOKS like, above the list of places to change it.
 *
 * The Brand panel is the design-system surface and it opened as nine rows of
 * text with counts: `Tokens 4 › Presets 18 › Starters 6 ›`. Measured live at
 * 1440x900, the panel contained ZERO colour swatches and no type specimen — a
 * brand screen showing none of the brand. Ledger row R10.
 *
 * This is the smallest thing that answers it: the palette as swatches and the
 * two type slots as specimens, read from the same registries the rows count, so
 * it moves with an unsaved edit rather than lagging a save.
 *
 * It is a PREVIEW, not a control. Every swatch is a button only in the sense
 * that it carries its own name and value in a title — editing still happens in
 * Tokens, one row below. Adding editing here would put two writers on one
 * value, which is the thing the drill-in structure exists to prevent.
 *
 * `var(--buildrick-design-*)` is used deliberately for the type specimens: this
 * directory is the one place Gate 3 excludes, because the Design Tab's job IS
 * to display the customer's own tokens.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DesignToken } from "@/engine/designSystem/types";

export interface BrandPreviewProps {
  /** Colour tokens, already filtered to the panel's current mode. */
  colors: readonly DesignToken[];
}

/** Enough to read the palette, few enough to stay one row at 320px. */
const MAX_SWATCHES = 10;

const SPECIMENS: Array<{ label: string; varName: string }> = [
  { label: "Heading", varName: "--buildrick-design-font-heading" },
  { label: "Body", varName: "--buildrick-design-font-body" },
];

export function BrandPreview({ colors }: BrandPreviewProps) {
  const shown = colors.slice(0, MAX_SWATCHES);
  const more = colors.length - shown.length;

  return (
    /* 16/12 inset and an 8px column gap — 1691:7341 and its four siblings
       (7219, 7280, 7402). The band shipped at `px-2 pb-3`: 8px in from a body
       that added 12 of its own, so the swatches sat 20 from the panel edge
       while every list row below them sat at 16 + 12. */
    <section
      className="tw:flex tw:flex-col tw:gap-2 tw:px-4 tw:py-3"
      aria-label="Brand preview"
      data-testid="brand-preview"
    >
      {shown.length > 0 && (
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5" data-testid="brand-preview-swatches">
          {shown.map((t) => (
            <span
              key={t.id}
              /* The value is the whole point, so it is the title — a swatch
                 nobody can name is decoration. */
              title={`${t.friendlyName ?? t.name} — ${t.value}`}
              style={{ background: t.value }}
              /* A real 1px `--bk-gray-200` edge, which is what 1691:7343..7346
                 draw. The inset box-shadow it replaced was an 8%-ink hairline
                 that vanished on any dark swatch — the case the edge exists
                 for is a light one on a white panel, and that is the one it
                 rendered weakest on. */
              className="tw:size-5 tw:flex-none tw:rounded tw:border tw:border-[var(--bk-gray-200)]"
            />
          ))}
          {more > 0 && (
            <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)] tw:tabular-nums">
              +{more}
            </span>
          )}
        </div>
      )}

      {/* The board has no wrapper here: 1691:7347 (Heading) and 1691:7350
          (Body) are peers of the swatch row inside the band's own 8px column
          gap, and each is `leading-[normal]` with an 8px gap of its own. The
          `gap-0.5` sub-column made the two specimens 2px apart inside an
          otherwise 8px rhythm. */}
      {SPECIMENS.map((s) => (
        <div
          key={s.label}
          data-testid={`brand-specimen-${s.label.toLowerCase()}`}
          className="tw:flex tw:items-baseline tw:gap-2 tw:min-w-0 tw:leading-[normal]"
        >
          <span
            aria-hidden="true"
            style={{ fontFamily: `var(${s.varName})` }}
            data-testid={`brand-specimen-aa-${s.label.toLowerCase()}`}
            className="tw:flex-none tw:text-[15px] tw:text-[var(--bk-ink)]"
          >
            Aa
          </span>
          <span
            data-testid={`brand-specimen-label-${s.label.toLowerCase()}`}
            className="tw:truncate tw:text-[11px] tw:text-[var(--bk-ink-soft)]"
          >
            {s.label}
          </span>
        </div>
      ))}
    </section>
  );
}

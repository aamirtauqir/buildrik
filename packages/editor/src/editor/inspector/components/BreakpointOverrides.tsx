/**
 * BreakpointOverrides — board 160:208 (Inspector · breakpoint-override).
 *
 * Above the sections, every property this breakpoint overrides: what it is set
 * to here, what the base says, and one control to drop back to it.
 *
 * The only sign of an override used to be a 5px dot on the breakpoint pill. It
 * said something was different without saying what, what it used to be, or how
 * to undo it — so a tablet-only padding written weeks ago was invisible until
 * someone opened the tablet view and read every row.
 *
 * @license BSD-3-Clause
 */

import { RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "../../../engine";
import { BREAKPOINTS } from "../../../shared/constants/breakpoints";
import { EVENTS } from "../../../shared/constants/events";
import type { BreakpointId } from "../../../shared/types/breakpoints";

/**
 * What this breakpoint overrides, read from the engine and kept current by the
 * engine's own event.
 *
 * Deriving it from the inspector's `styles` state does not work, and looked
 * like it did: that state updates optimistically the moment a control is
 * touched, 300ms before the debounced write reaches the engine, so a memo
 * keyed on it recomputes while the engine still knows nothing — and then never
 * again. The strip stayed empty after a real override, and the pill's override
 * dot with it.
 */
export function useBreakpointOverrides(
  composer: Composer | null | undefined,
  elementId: string | null | undefined,
  breakpoint: BreakpointId
): [string, string][] {
  const read = React.useCallback((): [string, string][] => {
    if (!composer?.styles || !elementId || breakpoint === "desktop") return [];
    return Object.entries(composer.styles.getBreakpointStyle(elementId, breakpoint));
  }, [composer, elementId, breakpoint]);

  const [overrides, setOverrides] = React.useState<[string, string][]>(read);

  React.useEffect(() => {
    setOverrides(read());
    if (!composer) return;
    const onChange = () => setOverrides(read());
    composer.on(EVENTS.STYLE_CHANGED, onChange);
    return () => {
      composer.off(EVENTS.STYLE_CHANGED, onChange);
    };
  }, [composer, read]);

  return overrides;
}

export interface BreakpointOverridesProps {
  composer: Composer | null | undefined;
  elementId: string;
  breakpoint: BreakpointId;
}

/** "padding-top" → "Padding top". */
function humanise(property: string): string {
  const words = property.replace(/^--/, "").split("-").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const BreakpointOverrides: React.FC<BreakpointOverridesProps> = ({
  composer,
  elementId,
  breakpoint,
}) => {
  const overrides = useBreakpointOverrides(composer, elementId, breakpoint);

  if (overrides.length === 0) return null;

  const breakpointName = BREAKPOINTS[breakpoint]?.name ?? breakpoint;
  const base = composer?.elements?.getElement(elementId)?.getStyles?.() ?? {};

  /* Board 4418:113785 — "⚠ 6 tablet overrides · Revert all": one line that
     says how much this breakpoint changes and one control that drops the lot,
     above the per-property rows (G2-142). One transaction, one undo step. */
  const revertAll = () => {
    composer?.beginTransaction?.(`revert-all-${breakpoint}`);
    try {
      for (const [property] of overrides) {
        composer?.styles?.removeBreakpointStyleProperty(elementId, breakpoint, property);
      }
    } finally {
      composer?.endTransaction?.();
    }
  };

  return (
    <div className="tw:flex tw:flex-col" data-testid="breakpoint-overrides">
      <div
        className="tw:flex tw:items-center tw:justify-between tw:bg-[var(--bk-warning-tint)] tw:px-4 tw:py-1.5 tw:text-[11px]/[16px] tw:text-[var(--bk-warning-text)]"
        data-testid="breakpoint-overrides-summary"
      >
        <span>
          ⚠ {overrides.length} {breakpointName.toLowerCase()} override{overrides.length === 1 ? "" : "s"}
        </span>
        <Button
          color="light"
          size="xs"
          data-testid="breakpoint-overrides-revert-all"
          className="tw:h-6 tw:min-h-0 tw:border-transparent tw:bg-transparent tw:px-1 tw:text-[11px] tw:font-medium tw:text-[var(--bk-warning-text)] tw:hover:text-[var(--bk-ink)]"
          onClick={revertAll}
        >
          Revert all
        </Button>
      </div>
      {overrides.map(([property, value]) => (
        <div key={property} data-testid={`breakpoint-override-${property}`}>
          {/* Board 160:305 uses the SAME 96px-label / 1fr-control grid every
              other property row uses (16 + 96 + 8 = 120, where its control
              starts) — the row used to run its own 72px label column and a
              subtle-tint value chip instead of the standard white/bordered
              field, reading as a different, unrelated control type. The 2px
              accent bar is a `border-left`, which ADDS to box width, so the
              left inset is 14px, not 16 — 14 + the border's own 2 lands
              content at the same x16 every other row uses. The label column
              and the right inset are `.bdi-row-ctrl`'s own 95 and 20, for the
              same reason it uses them: the board fixes the CONTROL at 120..280
              and says nothing about the label's width, so the pixel the
              panel's left rule spends comes out of the label column. At 96/16
              this control measured 163. */}
          <div
            data-testid="breakpoint-override-row"
            className="tw:grid tw:items-center tw:gap-2 tw:border-l-2 tw:border-[var(--bk-accent)] tw:py-[3px] tw:pl-[14px] tw:pr-5"
            style={{ gridTemplateColumns: "95px 1fr" }}
          >
            <span data-testid="breakpoint-override-label" className="tw:text-[12px]/[18px] tw:text-[var(--bk-ink-muted)]">
              {humanise(property)}
            </span>
            <span data-testid="breakpoint-override-control" className="tw:relative tw:flex tw:h-7 tw:items-center tw:rounded-md tw:border tw:border-[var(--bk-border)] tw:bg-white tw:pl-2 tw:pr-6 tw:text-[12px]/[18px] tw:text-[var(--bk-ink)]">
              {value}
              <Button
                color="light"
                size="xs"
                className="tw:absolute tw:right-0.5 tw:top-1/2 tw:h-auto tw:min-h-0 tw:-translate-y-1/2 tw:border-transparent tw:bg-transparent tw:p-1 tw:text-[var(--bk-accent)]"
                aria-label={`Revert ${humanise(property).toLowerCase()} to base`}
                title={`Revert to base`}
                onClick={() => {
                  composer?.beginTransaction?.(`revert-${property}-${breakpoint}`);
                  try {
                    composer?.styles?.removeBreakpointStyleProperty(elementId, breakpoint, property);
                  } finally {
                    composer?.endTransaction?.();
                  }
                }}
              >
                <RotateCcw size={12} aria-hidden="true" />
              </Button>
            </span>
          </div>
          <p data-testid="breakpoint-override-note" className="tw:m-0 tw:bg-[var(--bk-accent-tint)] tw:px-4 tw:py-2 tw:text-[11px]/[16px] tw:text-[var(--bk-accent)]">
            Overridden on {breakpointName} — Base is {base[property] || "not set"}
          </p>
        </div>
      ))}
    </div>
  );
};

export default BreakpointOverrides;

/**
 * RailCoach — the first-run coach mark over the left icon rail.
 *
 * Board 65:2 draws it ("Everything you build lives behind these six." ·
 * Got it); the S1.1 family owns its dismissal. It was never built —
 * CanvasEmptyCTA's header deferred it here for two arcs.
 *
 * Positioning: chrome-ui Portal + a hand-measured anchor on
 * `[data-testid="rail"]`. HintTooltip is the right shape but the wrong
 * contract — hover-driven, pointer-events:none bubble — so a "Got it" button
 * inside it would be unclickable; this copies its measure-then-place pattern
 * instead of the component. The rail itself is overflow:hidden, which is
 * exactly what the Portal escapes.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Portal } from "@/editor/chrome-ui";
import { STORAGE_KEYS } from "@/shared/constants/storageKeys";
import { safeGet, safeSet } from "@/shared/utils/safeStorage";

const GAP = 12;

export function railCoachDismissed(): boolean {
  return safeGet(STORAGE_KEYS.ONBOARDING_COACH_DISMISSED) === "1";
}

export interface RailCoachProps {
  onDismiss: () => void;
}

export const RailCoach: React.FC<RailCoachProps> = ({ onDismiss }) => {
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    const place = () => {
      const rail = document.querySelector('[data-testid="rail"]');
      if (!rail) {
        setPos(null);
        return;
      }
      const r = rail.getBoundingClientRect();
      /* Beside the rail, level with its first tool group — not vertically
         centered, which on a 900px canvas floats the bubble beside nothing. */
      setPos({ top: r.top + 96, left: r.right + GAP });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  const dismiss = React.useCallback(() => {
    safeSet(STORAGE_KEYS.ONBOARDING_COACH_DISMISSED, "1");
    onDismiss();
  }, [onDismiss]);

  if (!pos) return null;

  return (
    <Portal>
      <div
        role="note"
        aria-label="Rail introduction"
        data-testid="rail-coach"
        /* Board 65:208 draws a dark bubble at 240, radius 6, 12px padding. The
           size and shape stay; the ink fill does not — DESIGN.md's NO BLACK
           RULE (decision #25) bans near-black chrome surfaces, and the founder
           settled board-vs-DESIGN.md for bubbles in DESIGN.md's favour on
           2026-08-27 (chrome-ui/tooltipTheme.ts). Same surface as the tooltip:
           white, gray-200 hairline, ink-soft text; the overlay shadow lifts it
           off the canvas it sits over. */
        className="tw:fixed tw:z-[var(--bk-z-popover)] tw:flex tw:flex-col tw:gap-1.5 tw:w-60 tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] tw:bg-white tw:p-3 tw:shadow-[var(--bk-shadow-overlay)]"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Arrow toward the rail */}
        <div
          aria-hidden="true"
          className="tw:absolute tw:top-4 tw:-left-[6px] tw:h-2.5 tw:w-2.5 tw:rotate-45 tw:border-b tw:border-l tw:border-[var(--bk-gray-200)] tw:bg-white"
        />
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink-soft)]">
          Everything you build lives behind these six.
        </p>
        {/* The board draws one body line; this second one explains what the six
            actually are, which is the whole point of a coach mark. Kept. */}
        <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
          Insert sections, manage layers and pages, add media and content, and
          set your brand — all from this rail.
        </p>
        <Button
          size="xs"
          variant="link"
          className="tw:h-auto tw:min-h-6 tw:self-start tw:p-0 tw:text-[11px] tw:leading-4 tw:font-normal tw:text-[var(--bk-accent-text)]"
          onClick={dismiss}
          data-testid="rail-coach-got-it"
        >
          Got it
        </Button>
      </div>
    </Portal>
  );
};

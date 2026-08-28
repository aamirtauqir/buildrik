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
        className="tw:fixed tw:z-[var(--bk-z-popover)] tw:w-[264px] tw:rounded-lg tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-elevated)] tw:p-4 tw:shadow-[var(--bk-shadow-overlay)]"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Arrow toward the rail */}
        <div
          aria-hidden="true"
          className="tw:absolute tw:top-4 tw:-left-[5px] tw:h-2.5 tw:w-2.5 tw:rotate-45 tw:border-b tw:border-l tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-elevated)]"
        />
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">
          Everything you build lives behind these six.
        </p>
        <p className="tw:mt-1 tw:mb-3 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
          Insert sections, manage layers and pages, add media and content, and
          set your brand — all from this rail.
        </p>
        <Button size="xs" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </Portal>
  );
};

/**
 * LayerDisplaySettings — design-2l9 board 147:76329: opened by "View" beside
 * the search, it takes the tree's place — "Layer display", the five
 * switches, the footnote and Close. Outside click or Escape closes it too.
 * The fifth row, HTML tags, is owner decision 18.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import type { LayerDisplayPrefs } from "../types";
import { Button, ToggleSwitch } from "@/editor/chrome-ui";

/* The board's off switch is the input-border grey, not flowbite's gray-200,
   and no focus ring blooms around a clicked switch. */
const TOGGLE_THEME = {
  toggle: {
    base: "tw:relative tw:rounded-full tw:after:absolute tw:after:rounded-full tw:after:border tw:after:bg-white tw:after:transition-all tw:group-focus:ring-0 tw:group-focus-visible:ring-2",
    checked: { off: "tw:bg-[var(--bk-border-input)] tw:after:border-transparent" },
  },
};

interface LayerDisplaySettingsProps {
  prefs: LayerDisplayPrefs;
  onChange: (partial: Partial<LayerDisplayPrefs>) => void;
  onClose: () => void;
}

export function LayerDisplaySettings({ prefs, onChange, onClose }: LayerDisplaySettingsProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  useClickOutside(ref, onClose, { closeOnEscape: true });

  const rows: Array<{ label: string; aria: string; checked: boolean; set: (on: boolean) => void }> = [
    { label: "Show dimmed layers", aria: "Show dimmed layers", checked: prefs.showDimmed, set: (on) => onChange({ showDimmed: on }) },
    { label: "Show lock badges", aria: "Show lock badges", checked: prefs.showLockBadges, set: (on) => onChange({ showLockBadges: on }) },
    { label: "Compact rows", aria: "Compact row density", checked: prefs.treeDensity === "compact", set: (on) => onChange({ treeDensity: on ? "compact" : "comfortable" }) },
    { label: "Highlight CMS-bound", aria: "Highlight CMS-bound layers", checked: prefs.highlightCmsBound, set: (on) => onChange({ highlightCmsBound: on }) },
    { label: "Show HTML tags", aria: "Show HTML tags", checked: prefs.showHtmlBadges, set: (on) => onChange({ showHtmlBadges: on }) },
  ];

  return (
    /* design-2l9 147:76329 / 152:79864 (measured 2026-10-27): the tree gives
       way to a white field holding a raised card under the search band —
       2 in from the drawer edges, shadowed, rounded below. Title, then 44-tall
       rows of a 36×20 switch (off = the input-border grey) 12 from its label,
       the footnote, Close. */
    <div
      ref={ref}
      className="tw:absolute tw:inset-0 tw:z-[1000] tw:bg-[var(--bk-bg-panel)]"
      data-testid="layers-display-popover"
      role="dialog"
      aria-label="Layer display settings"
    >
      <div className="tw:mx-0.5 tw:flex tw:flex-col tw:rounded-b-lg tw:bg-[var(--bk-bg-card)] tw:px-3 tw:pt-4 tw:pb-3 tw:[box-shadow:var(--bk-shadow-overlay)]">
        <span className="tw:mb-1 tw:text-[13px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="layers-display-title">
          Layer display
        </span>
        {rows.map((row) => (
          <div key={row.aria} className="tw:flex tw:h-11 tw:items-center tw:gap-3 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
            <ToggleSwitch
              checked={row.checked}
              onChange={row.set}
              aria-label={row.aria}
              sizing="sm"
              theme={TOGGLE_THEME}
              /* The root is a <button>: without these the browser's own
                 grey button fill shows as a box around the switch. */
              className="tw:border-0 tw:bg-transparent tw:p-0 tw:focus:ring-0"
            />
            {/* The words toggle too, like a label — a <label> would also name
                flowbite's hidden checkbox and read the option twice. */}
            <span className="tw:cursor-pointer" aria-hidden="true" onClick={() => row.set(!row.checked)}>
              {row.label}
            </span>
          </div>
        ))}
        {/* Board 147:76329: these are the editor's view of the tree, not the site. */}
        <p className="tw:m-0 tw:mt-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="layers-display-note">
          Personal editor view. Live-site visibility is edited in the Inspector.
        </p>
        <Button
          type="button"
          color="light"
          size="xs"
          data-testid="layers-display-close"
          className="tw:mt-2 tw:h-8 tw:self-start tw:border-transparent tw:bg-transparent tw:px-4 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)] tw:focus:ring-0"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

/**
 * LayerDisplaySettings — v3 board 4418:84113's popover: the drawer's full
 * width under the header, "Display" (14/600 muted), then one 28px row per
 * option — a 44×24 switch, then its 13px label. No close button; outside
 * click or Escape closes it. The fifth row, HTML tags, is owner decision 18.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useClickOutside } from "../../../../shared/hooks/useClickOutside";
import type { LayerDisplayPrefs } from "../types";
import { ToggleSwitch } from "@/editor/chrome-ui";

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
    <div
      ref={ref}
      className="tw:absolute tw:inset-x-0 tw:top-0 tw:z-[1000] tw:flex tw:flex-col tw:gap-2 tw:rounded-lg tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-4 tw:pb-4 tw:pt-4 tw:shadow-[var(--bk-shadow-overlay)]"
      data-testid="layers-display-popover"
      role="dialog"
      aria-label="Layer display settings"
    >
      <span className="tw:text-[14px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="layers-display-title">
        Display
      </span>
      {rows.map((row) => (
        <div key={row.aria} className="tw:flex tw:h-7 tw:items-center tw:gap-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
          <ToggleSwitch checked={row.checked} onChange={row.set} aria-label={row.aria} className="tw:focus:ring-0" />
          {/* The words toggle too, like a label — a <label> would also name
              flowbite's hidden checkbox and read the option twice. */}
          <span className="tw:cursor-pointer" aria-hidden="true" onClick={() => row.set(!row.checked)}>
            {row.label}
          </span>
        </div>
      ))}
    </div>
  );
}

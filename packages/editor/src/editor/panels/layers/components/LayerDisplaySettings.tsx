/**
 * LayerDisplaySettings - Popover for toggling layer display preferences.
 *
 * Receives all data as props (no internal state, no hook imports).
 * Closes on outside click or Escape key.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useClickOutside } from "../../../../shared/hooks/useClickOutside";
import type { LayerDisplayPrefs } from "../types";
import { Button, Checkbox } from "@/editor/chrome-ui";

interface LayerDisplaySettingsProps {
  prefs: LayerDisplayPrefs;
  onChange: (partial: Partial<LayerDisplayPrefs>) => void;
  onClose: () => void;
}

export function LayerDisplaySettings({ prefs, onChange, onClose }: LayerDisplaySettingsProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  useClickOutside(ref, onClose, { closeOnEscape: true });

  return (
    <div
      ref={ref}
      className="bdc-popover bdc-layers-settings"
      data-testid="layers-display-popover"
      role="dialog"
      aria-label="Layer display settings"
    >
      <div className="bdc-popover-h">
        <span data-testid="layers-display-title">Display Settings</span>
        <Button className="bdc-icon-btn" onClick={onClose} aria-label="Close display settings">
          ×
        </Button>
      </div>
      {/* Board 4418:84113's four rows, then the owner's HTML tags (decision 18). */}
      <label className="bdc-toggle-row">
        <span>Show dimmed layers</span>
        <Checkbox
          color="blue"
          className="bdc-switch"
          checked={prefs.showDimmed}
          onChange={(e) => onChange({ showDimmed: e.target.checked })}
          aria-label="Show dimmed layers" />
      </label>
      <label className="bdc-toggle-row">
        <span>Show lock badges</span>
        <Checkbox
          color="blue"
          className="bdc-switch"
          checked={prefs.showLockBadges}
          onChange={(e) => onChange({ showLockBadges: e.target.checked })}
          aria-label="Show lock badges" />
      </label>
      <label className="bdc-toggle-row">
        <span>Compact rows</span>
        <Checkbox
          color="blue"
          className="bdc-switch"
          checked={prefs.treeDensity === "compact"}
          onChange={(e) => onChange({ treeDensity: e.target.checked ? "compact" : "comfortable" })}
          aria-label="Compact row density" />
      </label>
      <label className="bdc-toggle-row">
        <span>Highlight CMS-bound</span>
        <Checkbox
          color="blue"
          className="bdc-switch"
          checked={prefs.highlightCmsBound}
          onChange={(e) => onChange({ highlightCmsBound: e.target.checked })}
          aria-label="Highlight CMS-bound layers" />
      </label>
      <label className="bdc-toggle-row">
        <span>
          Show HTML tags
          <span> div, section, h1…</span>
        </span>
        <Checkbox
          color="blue"
          className="bdc-switch"
          checked={prefs.showHtmlBadges}
          onChange={(e) => onChange({ showHtmlBadges: e.target.checked })}
          aria-label="Show HTML tags" />
      </label>
    </div>
  );
}

/**
 * LayerDisplaySettings - Popover for toggling layer display preferences.
 *
 * Receives all data as props (no internal state, no hook imports).
 * Closes on outside click or Escape key.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Checkbox } from "@/editor/ui";
import { useClickOutside } from "../../../../shared/hooks/useClickOutside";
import type { LayerDisplayPrefs } from "../types";

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
      role="dialog"
      aria-label="Layer display settings"
    >
      <div className="bdc-popover-h">
        <span>Display Settings</span>
        <Button className="bdc-icon-btn" onClick={onClose} aria-label="Close display settings">
          ×
        </Button>
      </div>
      <label className="bdc-toggle-row">
        <span>
          Show HTML tags
          <span> div, section, h1…</span>
        </span>
        <Checkbox
          className="bdc-switch"
          checked={prefs.showHtmlBadges}
          onChange={(e) => onChange({ showHtmlBadges: e.target.checked })}
          aria-label="Show HTML tags" />
      </label>
      <label className="bdc-toggle-row">
        <span>
          Show element IDs
          <span> #abc123 format</span>
        </span>
        <Checkbox
          className="bdc-switch"
          checked={prefs.showElementIds}
          onChange={(e) => onChange({ showElementIds: e.target.checked })}
          aria-label="Show element IDs" />
      </label>
      <label className="bdc-toggle-row">
        <span>Compact rows</span>
        <Checkbox
          className="bdc-switch"
          checked={prefs.treeDensity === "compact"}
          onChange={(e) => onChange({ treeDensity: e.target.checked ? "compact" : "comfortable" })}
          aria-label="Compact row density" />
      </label>
    </div>
  );
}

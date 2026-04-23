/**
 * LayerDisplaySettings - Popover for toggling layer display preferences.
 *
 * Receives all data as props (no internal state, no hook imports).
 * Closes on outside click or Escape key.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { LayerDisplayPrefs } from "../types";

interface LayerDisplaySettingsProps {
  prefs: LayerDisplayPrefs;
  onChange: (partial: Partial<LayerDisplayPrefs>) => void;
  onClose: () => void;
}

export function LayerDisplaySettings({ prefs, onChange, onClose }: LayerDisplaySettingsProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="bdc-popover bdc-layers-settings"
      role="dialog"
      aria-label="Layer display settings"
    >
      <div className="bdc-popover-h">
        <span>Display Settings</span>
        <button className="bdc-icon-btn" onClick={onClose} aria-label="Close display settings">
          ×
        </button>
      </div>

      <label className="bdc-toggle-row">
        <span>
          Show HTML tags
          <span> div, section, h1…</span>
        </span>
        <input
          type="checkbox"
          className="bdc-switch"
          checked={prefs.showHtmlBadges}
          onChange={(e) => onChange({ showHtmlBadges: e.target.checked })}
          aria-label="Show HTML tags"
        />
      </label>

      <label className="bdc-toggle-row">
        <span>
          Show element IDs
          <span> #abc123 format</span>
        </span>
        <input
          type="checkbox"
          className="bdc-switch"
          checked={prefs.showElementIds}
          onChange={(e) => onChange({ showElementIds: e.target.checked })}
          aria-label="Show element IDs"
        />
      </label>

      <label className="bdc-toggle-row">
        <span>Compact rows</span>
        <input
          type="checkbox"
          className="bdc-switch"
          checked={prefs.treeDensity === "compact"}
          onChange={(e) => onChange({ treeDensity: e.target.checked ? "compact" : "comfortable" })}
          aria-label="Compact row density"
        />
      </label>
    </div>
  );
}

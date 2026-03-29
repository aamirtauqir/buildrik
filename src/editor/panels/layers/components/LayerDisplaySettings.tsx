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
      className="aqb-layer-display-settings"
      role="dialog"
      aria-label="Layer display settings"
    >
      <div className="aqb-lds-header">
        <span className="aqb-lds-title">Display Settings</span>
        <button className="aqb-lds-close" onClick={onClose} aria-label="Close display settings">
          ×
        </button>
      </div>

      <label className="aqb-lds-row">
        <span className="aqb-lds-label">
          Show HTML tags
          <span className="aqb-lds-hint">div, section, h1…</span>
        </span>
        <input
          type="checkbox"
          checked={prefs.showHtmlBadges}
          onChange={(e) => onChange({ showHtmlBadges: e.target.checked })}
          aria-label="Show HTML tags"
        />
      </label>

      <label className="aqb-lds-row">
        <span className="aqb-lds-label">
          Show element IDs
          <span className="aqb-lds-hint">#abc123 format</span>
        </span>
        <input
          type="checkbox"
          checked={prefs.showElementIds}
          onChange={(e) => onChange({ showElementIds: e.target.checked })}
          aria-label="Show element IDs"
        />
      </label>

      <label className="aqb-lds-row">
        <span className="aqb-lds-label">Compact rows</span>
        <input
          type="checkbox"
          checked={prefs.treeDensity === "compact"}
          onChange={(e) => onChange({ treeDensity: e.target.checked ? "compact" : "comfortable" })}
          aria-label="Compact row density"
        />
      </label>
    </div>
  );
}

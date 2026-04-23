/**
 * DevModeToggle — toggles visibility of developer-only features.
 * Ported to --bd-* tokens + .bdi-sw-ctrl switch pattern.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface DevModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const DevModeToggle: React.FC<DevModeToggleProps> = ({ enabled, onToggle }) => (
  <div
    style={{ display: "flex", alignItems: "center", gap: 4 }}
    title={enabled ? "Dev mode enabled" : "Enable dev mode"}
  >
    <span
      style={{
        font: "600 9px var(--bd-font)",
        letterSpacing: "0.08em",
        color: enabled ? "var(--bd-accent)" : "var(--bd-fg-muted)",
        textTransform: "uppercase",
      }}
    >
      Dev
    </span>
    <button
      type="button"
      className={`bdi-sw-ctrl${enabled ? "" : " off"}`}
      onClick={() => onToggle(!enabled)}
      aria-pressed={enabled}
      aria-label={enabled ? "Disable developer mode" : "Enable developer mode"}
    >
      <span className="bdi-thumb" aria-hidden="true" />
    </button>
  </div>
);

export default DevModeToggle;

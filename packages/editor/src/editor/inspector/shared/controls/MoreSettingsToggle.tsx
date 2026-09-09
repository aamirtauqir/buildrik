/**
 * MoreSettingsToggle — progressive disclosure. Ported to .bdi-adv.
 *
 * @license BSD-3-Clause
 */

import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/editor/chrome-ui";

export interface MoreSettingsToggleProps {
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  advancedCount?: number;
  collapsedLabel?: string;
  expandedLabel?: string;
}

export const MoreSettingsToggle: React.FC<MoreSettingsToggleProps> = ({
  isOpen,
  onToggle,
  advancedCount,
  collapsedLabel = "More settings",
  expandedLabel = "Less",
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(!isOpen);
  };

  return (
    <Button
      type="button"
      className="bdi-adv"
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-label={isOpen ? expandedLabel : collapsedLabel}
    >
      <span className="bdi-adv-c" aria-hidden="true">
        {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </span>
      {isOpen ? expandedLabel : collapsedLabel}
      {!isOpen && advancedCount && advancedCount > 0 && (
        <span
          style={{
            font: "500 11px var(--bk-font-mono)",
            /* MEASURED 2026-09-08: --bk-ink-muted on --bk-bg-subtle is 4.39:1
               at 11px, under the 4.5 floor. ink-soft on the same chip is
               6.78:1. Same pair, same fix, as `.bdi-seg button` and
               `.bdi-adv-c` in inspector.css. */
            color: "var(--bk-ink-soft)",
            background: "var(--bk-bg-subtle)",
            padding: "0 4px",
            borderRadius: 3,
            marginLeft: 2,
          }}
        >
          {advancedCount}
        </span>
      )}
    </Button>
  );
};

export default MoreSettingsToggle;

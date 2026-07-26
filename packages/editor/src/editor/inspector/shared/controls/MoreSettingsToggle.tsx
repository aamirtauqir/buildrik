/**
 * MoreSettingsToggle — progressive disclosure. Ported to .bdi-adv.
 *
 * @license BSD-3-Clause
 */

import { ChevronDown, ChevronRight } from "lucide-react";
import * as React from "react";
import { Button } from "@/editor/ui";

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
            font: "500 9.5px var(--bk-font-mono)",
            color: "var(--bk-ink-muted)",
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

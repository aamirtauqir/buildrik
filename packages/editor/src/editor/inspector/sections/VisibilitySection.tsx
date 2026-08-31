/**
 * Visibility Section — per-breakpoint show/hide toggles.
 * Ported to .bdi-sw-row + .bdi-sw-ctrl pattern per comp-inspector.v1.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { BREAKPOINTS as SHARED_BREAKPOINTS } from "../../../shared/constants/breakpoints";
import { Section, type SectionTier } from "../shared/controls/Section";
import { Button } from "@/editor/chrome-ui";

export interface VisibilitySectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  tier?: SectionTier;
}

const VISIBILITY_BREAKPOINTS = (["desktop", "tablet", "mobile"] as const).map((id) => {
  const bp = SHARED_BREAKPOINTS[id];
  return {
    id: bp.id,
    label: bp.name,
  };
});

export const VisibilitySection: React.FC<VisibilitySectionProps> = ({
  styles: elementStyles,
  onChange,
  isOpen,
  onToggle,
  tier = "tertiary",
}) => {
  const getVisibility = (breakpointId: string): boolean => {
    const hideKey = `--hide-${breakpointId}`;
    return elementStyles[hideKey] !== "true";
  };

  const toggleVisibility = (breakpointId: string) => {
    const hideKey = `--hide-${breakpointId}`;
    const isCurrentlyVisible = getVisibility(breakpointId);
    onChange(hideKey, isCurrentlyVisible ? "true" : "");
  };

  const hiddenCount = VISIBILITY_BREAKPOINTS.filter((bp) => !getVisibility(bp.id)).length;

  return (
    <Section
      title="Visibility"
      icon="Eye"
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-visibility"
      preview={
        hiddenCount > 0 ? (
          <span
            style={{
              font: "500 11px var(--bk-font-mono)",
              color: "var(--bk-warning)",
              background: "rgba(217, 119, 6, 0.12)",
              padding: "1px 5px",
              borderRadius: 3,
            }}
          >
            hidden on {hiddenCount}
          </span>
        ) : undefined
      }
    >
      {VISIBILITY_BREAKPOINTS.map((bp) => {
        const isVisible = getVisibility(bp.id);
        return (
          <div key={bp.id} className="bdi-sw-row">
            <span>Show on {bp.label}</span>
            <Button
              type="button"
              className={`bdi-sw-ctrl${isVisible ? "" : " off"}`}
              onClick={() => toggleVisibility(bp.id)}
              aria-label={`${isVisible ? "Visible" : "Hidden"} on ${bp.label}`}
              aria-pressed={isVisible}
              title={isVisible ? `Hide on ${bp.label}` : `Show on ${bp.label}`}
            >
              <span className="bdi-thumb" aria-hidden="true" />
            </Button>
          </div>
        );
      })}
    </Section>
  );
};

export default VisibilitySection;

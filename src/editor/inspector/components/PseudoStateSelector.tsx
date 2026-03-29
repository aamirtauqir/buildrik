/**
 * PseudoStateSelector
 * Renders the Default / :hover / :focus / :active / :disabled state selector.
 * Shows a colored dot on states that have at least one style override.
 *
 * Extracted from styles/index.tsx renderPseudoStateSelector (ARCH-01 fix).
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PseudoStateId } from "../../../shared/types";

export interface PseudoStateSelectorProps {
  currentPseudoState: PseudoStateId;
  onChange: (state: PseudoStateId) => void;
  /** Set of pseudo-states that have at least one overridden property */
  statesWithOverrides?: Set<PseudoStateId>;
}

const STATE_META: Record<
  PseudoStateId,
  { label: string; ariaLabel: string; tooltip: string; rawColor: string }
> = {
  normal: {
    label: "Default",
    ariaLabel: "Default state",
    tooltip: "Default state — base styles",
    rawColor: "#6c7086",
  },
  hover: {
    label: ":hover",
    ariaLabel: "Hover state — styles when user hovers",
    tooltip: "Mouse over state — styles when user hovers",
    rawColor: "#a855f7",
  },
  focus: {
    label: ":focus",
    ariaLabel: "Focus state — styles when element is focused",
    tooltip: "Keyboard focus state — styles when element is focused",
    rawColor: "#3b82f6",
  },
  active: {
    label: ":active",
    ariaLabel: "Active state — styles while clicking",
    tooltip: "Click state — styles while mouse button is held",
    rawColor: "#22c55e",
  },
  disabled: {
    label: ":disabled",
    ariaLabel: "Disabled state — styles when interaction is blocked",
    tooltip: "Disabled state — styles when interaction is blocked",
    rawColor: "#6b7280",
  },
};

export const PseudoStateSelector: React.FC<PseudoStateSelectorProps> = ({
  currentPseudoState,
  onChange,
  statesWithOverrides = new Set(),
}) => {
  const states = Object.keys(STATE_META) as PseudoStateId[];

  return (
    <div
      role="group"
      aria-label="Element state selector"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "var(--aqb-space-2) var(--aqb-space-3)",
        marginTop: 8,
        background: "rgba(0,0,0,0.2)",
        borderRadius: 6,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: "var(--aqb-text-tertiary)",
          marginRight: 4,
          flexShrink: 0,
        }}
      >
        State:
      </span>
      {states.map((state) => {
        const meta = STATE_META[state];
        const isActive = currentPseudoState === state;
        const hasOverride = statesWithOverrides.has(state);

        return (
          <button
            key={state}
            type="button"
            onClick={() => onChange(state)}
            aria-label={meta.ariaLabel}
            aria-pressed={isActive}
            title={meta.tooltip}
            style={{
              flex: 1,
              position: "relative" as const,
              padding: "6px 8px",
              background: isActive ? `${meta.rawColor}20` : "transparent",
              border: isActive ? `1px solid ${meta.rawColor}50` : "1px solid transparent",
              borderRadius: 6,
              color: isActive ? meta.rawColor : "var(--aqb-text-tertiary)",
              fontSize: "var(--aqb-text-xs)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "var(--aqb-transition-fast)",
              textAlign: "center" as const,
            }}
          >
            {meta.label}
            {hasOverride && (
              <span
                data-testid={`override-dot-${state}`}
                aria-hidden="true"
                title={`Has custom :${state} styles`}
                style={{
                  position: "absolute" as const,
                  top: 3,
                  right: 3,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: meta.rawColor,
                  display: "block",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PseudoStateSelector;

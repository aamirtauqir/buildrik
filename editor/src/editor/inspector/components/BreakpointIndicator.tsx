/**
 * BreakpointIndicator
 * Shows a banner when editing non-desktop breakpoint styles.
 * Extracted from styles/index.tsx renderBreakpointIndicator (ARCH-01 fix).
 * @license BSD-3-Clause
 */

import { Tablet, Smartphone } from "lucide-react";
import * as React from "react";
import { BREAKPOINTS } from "../../../shared/constants/breakpoints";
import type { BreakpointId } from "../../../shared/types/breakpoints";

export interface BreakpointIndicatorProps {
  currentBreakpoint: BreakpointId;
}

export const BreakpointIndicator: React.FC<BreakpointIndicatorProps> = ({ currentBreakpoint }) => {
  if (currentBreakpoint === "desktop") return null;

  const isTablet = currentBreakpoint === "tablet";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        marginTop: 12,
        borderRadius: 6,
        fontSize: "var(--aqb-text-sm)",
        fontWeight: 600,
        transition: "var(--aqb-transition-fast)",
        background: isTablet ? "rgba(245, 158, 11, 0.15)" : "rgba(236, 72, 153, 0.15)",
        border: isTablet
          ? "1px solid rgba(245, 158, 11, 0.3)"
          : "1px solid rgba(236, 72, 153, 0.3)",
        color: isTablet ? "#f59e0b" : "#ec4899",
      }}
    >
      {isTablet ? (
        <Tablet size={14} aria-hidden="true" />
      ) : (
        <Smartphone size={14} aria-hidden="true" />
      )}
      <span>
        Editing styles for <strong>{BREAKPOINTS[currentBreakpoint].name}</strong>
      </span>
      <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.8 }}>
        &le;{BREAKPOINTS[currentBreakpoint].maxWidth}px
      </span>
    </div>
  );
};

export default BreakpointIndicator;

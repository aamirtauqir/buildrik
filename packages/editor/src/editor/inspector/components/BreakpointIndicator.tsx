/**
 * BreakpointIndicator
 * Clickable chip showing the current breakpoint; opens an inline switcher menu.
 * Replaces the old read-only banner (ARCH-01 + Sprint 3 upgrade).
 * @license BSD-3-Clause
 */

import { Monitor, Tablet, Smartphone, ChevronDown } from "lucide-react";
import * as React from "react";
import { BREAKPOINTS, BREAKPOINT_ORDER } from "../../../shared/constants/breakpoints";
import type { BreakpointId } from "../../../shared/types/breakpoints";

export interface BreakpointIndicatorProps {
  currentBreakpoint: BreakpointId;
  onBreakpointChange?: (bp: BreakpointId) => void;
  /** Shows a dot when the current breakpoint has element-specific overrides */
  hasOverride?: boolean;
}

const BP_ICONS: Record<BreakpointId, React.ReactNode> = {
  desktop: <Monitor size={13} aria-hidden="true" />,
  tablet: <Tablet size={13} aria-hidden="true" />,
  mobile: <Smartphone size={13} aria-hidden="true" />,
};

const BP_COLORS: Record<BreakpointId, { bg: string; border: string; text: string }> = {
  desktop: {
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.3)",
    text: "#818cf8",
  },
  tablet: {
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
    text: "#f59e0b",
  },
  mobile: {
    bg: "rgba(236,72,153,0.12)",
    border: "rgba(236,72,153,0.3)",
    text: "#ec4899",
  },
};

export const BreakpointIndicator: React.FC<BreakpointIndicatorProps> = ({
  currentBreakpoint,
  onBreakpointChange,
  hasOverride = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const color = BP_COLORS[currentBreakpoint];
  const label = BREAKPOINTS[currentBreakpoint].name;

  const handleSelect = (bp: BreakpointId) => {
    setOpen(false);
    if (bp !== currentBreakpoint) onBreakpointChange?.(bp);
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", marginTop: 8, display: "inline-block" }}
    >
      {/* Chip trigger */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Current breakpoint: ${label}. Click to switch.`}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 9px",
          background: color.bg,
          border: `1px solid ${color.border}`,
          borderRadius: 6,
          color: color.text,
          fontSize: "var(--aqb-text-xs, 11px)",
          fontWeight: 600,
          cursor: onBreakpointChange ? "pointer" : "default",
          transition: "var(--aqb-transition-fast, opacity 0.15s)",
          position: "relative",
        }}
      >
        {BP_ICONS[currentBreakpoint]}
        <span>{label}</span>
        {hasOverride && (
          <span
            data-testid="breakpoint-override-dot"
            aria-hidden="true"
            title={`Has custom styles for ${label}`}
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: color.text,
              flexShrink: 0,
            }}
          />
        )}
        {onBreakpointChange && (
          <ChevronDown
            size={11}
            aria-hidden="true"
            style={{
              opacity: 0.7,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s",
            }}
          />
        )}
      </button>

      {/* Dropdown menu */}
      {open && onBreakpointChange && (
        <div
          role="listbox"
          aria-label="Select breakpoint"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            background: "var(--aqb-surface-elevated, #1a1d27)",
            border: "1px solid var(--aqb-border, rgba(255,255,255,0.08))",
            borderRadius: 8,
            padding: 4,
            minWidth: 150,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {BREAKPOINT_ORDER.map((bp) => {
            const isActive = bp === currentBreakpoint;
            const c = BP_COLORS[bp];
            const bpLabel = BREAKPOINTS[bp].name;
            const maxW = BREAKPOINTS[bp].maxWidth;
            return (
              <button
                key={bp}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(bp)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "6px 10px",
                  background: isActive ? c.bg : "transparent",
                  border: isActive ? `1px solid ${c.border}` : "1px solid transparent",
                  borderRadius: 6,
                  color: isActive ? c.text : "var(--aqb-text-secondary, rgba(255,255,255,0.6))",
                  fontSize: "var(--aqb-text-xs, 11px)",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "var(--aqb-transition-fast, opacity 0.15s)",
                }}
              >
                {BP_ICONS[bp]}
                <span style={{ flex: 1 }}>{bpLabel}</span>
                {maxW !== undefined && (
                  <span
                    style={{
                      fontSize: 10,
                      opacity: 0.5,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    &le;{maxW}px
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BreakpointIndicator;

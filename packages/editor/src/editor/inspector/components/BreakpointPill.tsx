/**
 * BreakpointPill — D6 Stage 1 extraction (audit-remediation 2026-05-08).
 *
 * Lifted out of ProInspector.tsx (was inline at lines 80-196). Renders
 * the breakpoint chooser pill that anchors the BPR (breakpoint +
 * pseudo-state strip). Owns its own `open` state and pointerdown
 * outside-click listener.
 *
 * Note on the listener: it intentionally uses `pointerdown` rather
 * than the shared `useClickOutside` hook (which uses `mousedown`).
 * `pointerdown` fires for both touch and mouse — relevant on hybrid
 * laptops where the inspector chrome can be touched. Don't migrate.
 *
 * @license BSD-3-Clause
 */

import { Button } from "@/editor/shared/vibcoder/Button";
import { ChevronDown, Monitor, Tablet, Smartphone } from "lucide-react";
import * as React from "react";
import {
  BREAKPOINTS,
  BREAKPOINT_ORDER,
} from "../../../shared/constants/breakpoints";
import type { BreakpointId } from "../../../shared/types/breakpoints";

const BP_ICONS: Record<BreakpointId, React.ReactNode> = {
  desktop: <Monitor size={11} aria-hidden="true" />,
  tablet: <Tablet size={11} aria-hidden="true" />,
  mobile: <Smartphone size={11} aria-hidden="true" />,
};

export interface BreakpointPillProps {
  current: BreakpointId;
  onChange?: (bp: BreakpointId) => void;
  hasOverride?: boolean;
}

export const BreakpointPill: React.FC<BreakpointPillProps> = ({
  current,
  onChange,
  hasOverride,
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const meta = BREAKPOINTS[current];

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <Button
        type="button"
        className="bdi-bpr-pill"
        onClick={() => onChange && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Breakpoint: ${meta.name}`}
        style={{
          border: "none",
          cursor: onChange ? "pointer" : "default",
        }}
      >
        {BP_ICONS[current]}
        <span>
          {meta.name}
          {meta.maxWidth !== undefined ? ` · ≤${meta.maxWidth}` : " · 1200+"}
        </span>
        {hasOverride && (
          <span
            aria-hidden="true"
            style={{
              width: 5,
              height: 5,
              borderRadius: "var(--bd-radius-full)",
              background: "var(--bd-accent)",
            }}
          />
        )}
        {onChange && <ChevronDown size={10} aria-hidden="true" style={{ opacity: 0.7 }} />}
      </Button>
      {open && onChange && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            background: "var(--buildrick-bg-card)",
            border: "1px solid var(--bd-border)",
            borderRadius: 6,
            padding: 4,
            minWidth: 160,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
          }}
        >
          {BREAKPOINT_ORDER.map((bp) => {
            const bpMeta = BREAKPOINTS[bp];
            const active = bp === current;
            return (
              <Button
                key={bp}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setOpen(false);
                  if (bp !== current) onChange(bp);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "5px 8px",
                  background: active ? "var(--bd-accent-tint)" : "transparent",
                  border: "none",
                  borderRadius: 4,
                  color: active ? "var(--bd-accent)" : "var(--bd-fg-primary)",
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--bd-font)",
                }}
              >
                {BP_ICONS[bp]}
                <span style={{ flex: 1 }}>{bpMeta.name}</span>
                {bpMeta.maxWidth !== undefined && (
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--bd-fg-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ≤{bpMeta.maxWidth}px
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

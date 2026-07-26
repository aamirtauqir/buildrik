/**
 * StateDropdown — compact pseudo-state chooser (`Base ▾`).
 *
 * Replaces the StatePills row. Matches Figma node 32-2: pseudo-state is one
 * compact dropdown in the breakpoint/state pill row (`This ▾ · Desktop ▾ ·
 * Base ▾`), not a spread-out row of pills. Base = the normal/default state;
 * the dropdown picks :hover / :focus / :active / :disabled. States that carry
 * overrides at the active breakpoint show an accent dot.
 *
 * Dropdown mechanics mirror BreakpointPill (pointerdown outside-click, listbox).
 *
 * @license BSD-3-Clause
 */

import { Button } from "@/editor/shared/vibcoder/Button";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import type { PseudoStateId } from "../../../shared/types";

const PSEUDO_LABELS: Record<PseudoStateId, string> = {
  normal: "Base",
  hover: ":hover",
  focus: ":focus",
  active: ":active",
  disabled: ":disabled",
};

const ALL_STATES: readonly PseudoStateId[] = ["normal", "hover", "focus", "active", "disabled"];

export interface StateDropdownProps {
  current: PseudoStateId;
  onChange: (s: PseudoStateId) => void;
  withOverrides: Set<PseudoStateId>;
}

export const StateDropdown: React.FC<StateDropdownProps> = ({ current, onChange, withOverrides }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

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
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`State: ${PSEUDO_LABELS[current]}`}
        style={{ border: "none", cursor: "pointer" }}
      >
        <span>{PSEUDO_LABELS[current]}</span>
        {current !== "normal" && (
          <span
            aria-hidden="true"
            style={{ width: 5, height: 5, borderRadius: "var(--bk-radius-full)", background: "currentColor" }}
          />
        )}
        <ChevronDown size={10} aria-hidden="true" style={{ opacity: 0.7 }} />
      </Button>
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            background: "var(--bk-bg-card)",
            border: "1px solid var(--bk-border)",
            borderRadius: 4,
            padding: 4,
            minWidth: 150,
            boxShadow: "var(--bk-shadow-drag)",
          }}
        >
          {ALL_STATES.map((s) => {
            const active = s === current;
            const hasOverride = withOverrides.has(s);
            return (
              <Button
                key={s}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setOpen(false);
                  onChange(s);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "5px 8px",
                  background: active ? "var(--bk-accent-tint)" : "transparent",
                  border: "none",
                  borderRadius: 4,
                  color: active ? "var(--bk-accent)" : "var(--bk-ink)",
                  fontSize: 11,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--bk-font-ui)",
                }}
              >
                <span style={{ flex: 1 }}>{PSEUDO_LABELS[s]}</span>
                {hasOverride && (
                  <span
                    aria-hidden="true"
                    style={{ width: 5, height: 5, borderRadius: "var(--bk-radius-full)", background: "var(--bk-accent)" }}
                  />
                )}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * DSModeToggle — segmented control for switching the Design System surface
 * between Beginner and Pro display modes (spec §4 row 2 + §6.2 + §7.11).
 *
 * Mode is display-only; engine state is identical in either mode. Beginner
 * hides token IDs and mutes empty foundation kinds; Pro exposes everything.
 *
 * Reads/writes `useDSMode()`. Two-segment switcher styled with bd-btn
 * + bd-btn--primary / bd-btn--ghost. Compact (28px tall) for in-panel
 * placement (Design tab top-right per spec wireframe).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { useDSMode, type DSMode } from "../state/DSModeContext";
import { Button } from "@/editor/chrome-ui";
const SEGMENTS: ReadonlyArray<{ value: DSMode; label: string; hint: string }> = [
  { value: "beginner", label: "Beginner", hint: "Friendly · hides token IDs and empty foundations" },
  { value: "pro", label: "Pro", hint: "Full power · token IDs, every kind, off-DS allowed silently" },
];

export interface DSModeToggleProps {
  /** Optional className applied to the outer wrapper (e.g., for spacing in headers). */
  className?: string;
}

export const DSModeToggle: React.FC<DSModeToggleProps> = ({ className }) => {
  const { mode, setMode } = useDSMode();

  return (
    <div
      role="radiogroup"
      aria-label="Design system display mode"
      className={className}
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 2,
        borderRadius: 6,
        background: "var(--bk-bg-subtle)",
        border: "1px solid var(--bk-border)",
      }}
    >
      {SEGMENTS.map((seg) => {
        const active = mode === seg.value;
        return (
          <Button
            key={seg.value}
            type="button"
            color="light"
            size="xs"
            role="radio"
            aria-checked={active}
            title={seg.hint}
            onClick={() => setMode(seg.value)}
            className={`tw:px-2.5 tw:py-1 tw:text-xs tw:rounded tw:select-none tw:[transition:var(--bk-transition-fast)] ${
              active
                ? "tw:bg-blue-700 tw:text-white tw:font-semibold tw:border-blue-700"
                : "tw:bg-transparent tw:text-gray-500 tw:font-medium tw:border-transparent"
            }`}
          >
            {seg.label}
          </Button>
        );
      })}
    </div>
  );
};

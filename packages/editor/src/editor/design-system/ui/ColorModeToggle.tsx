/**
 * Color Mode Toggle — 2-pill seg `[Light][Dark]` per spec D1 (DS prototype
 * full rewrite arc).
 *
 *   - `role="tablist"` container with `aria-label="Color mode"`.
 *   - Each pill: `role="tab"` + `aria-selected`.
 *   - Active pill uses `var(--bk-accent)` bg + white fg; inactive is transparent.
 *   - System mode dropped from UI; composer state preserves auto-detect for
 *     first load. When composer resolves to "dark", Dark pill is active.
 *
 * Wires to:
 *   - composer.colorMode (B.0) — get/set/resolved
 *   - useColorMode hook — subscribes to "colorMode:changed"
 *
 * (ColorModeIconCycle, the icon-cycle sibling, was never mounted and was deleted 2026-09-02.)
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import { useColorMode } from "../state/useColorMode";
import { Button } from "@/editor/chrome-ui";

export interface ColorModeToggleProps {
  composer: Composer;
}

export const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ composer }) => {
  const mode = useColorMode(composer);

  const resolved =
    typeof composer.colorMode.resolved === "function"
      ? composer.colorMode.resolved()
      : mode === "system"
        ? "light"
        : mode;
  const active: "light" | "dark" = resolved === "dark" ? "dark" : "light";

  return (
    <div
      role="tablist"
      aria-label="Color mode"
      data-testid="brand-colour-mode-seg"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 2,
        /* 6, not `--bk-radius-full` — 153:100. A pill track around two
           radius-6 segments left a 12px crescent of `--bk-bg-subtle` at each
           end that belonged to neither segment. */
        borderRadius: 6,
        border: "1px solid var(--bk-border)",
        background: "var(--bk-bg-subtle)",
      }}
    >
      <Pill value="light" label="Light" active={active === "light"} composer={composer} />
      <Pill value="dark" label="Dark" active={active === "dark"} composer={composer} />
    </div>
  );
};

interface PillProps {
  value: "light" | "dark";
  label: string;
  active: boolean;
  composer: Composer;
}

const Pill: React.FC<PillProps> = ({ value, label, active, composer }) => (
  <Button
    type="button"
    color="light"
    size="xs"
    role="tab"
    aria-selected={active}
    data-testid={`brand-colour-mode-seg-${value}`}
    onClick={() => composer.colorMode.set(value)}
    /* Board 153:92: a 28-tall, radius-6 segment — white with ink when
       active, plain when not. The accent-filled pill it replaced measured 32
       tall and 11/600 against the board's 12/400. */
    style={{
      height: 28,
      /* 5/20 and a 18px line — 153:101 / 153:102. A flat `0 12px` measured 24
         wide of inset against the board's 40 and left the two labels touching
         the track's own edge. */
      padding: "5px 20px",
      fontSize: 12,
      lineHeight: "18px",
      fontWeight: 400,
      border: "none",
      borderRadius: 6,
      cursor: "pointer",
      background: active ? "var(--bk-bg-elevated)" : "transparent",
      /* `--bk-ink-soft` for the inactive label, NOT the board's
         `--color/ink-muted`. 153:104 names ink-muted and the track under it is
         `--color/bg-subtle`; that pair MEASURES 4.39:1 — under the 4.5 WCAG AA
         floor, computed by measure.mjs. A board cannot authorise a contrast
         failure, and this is the same substitution DesignTabFooter and the
         Beginner note already document for the same pair on the same fill
         (docs/design-jobs/FIGMA-TO-CODE/CONTRAST-INK-MUTED.md). */
      color: active ? "var(--bk-ink)" : "var(--bk-ink-soft)",
      boxShadow: active ? "var(--bk-shadow-raised)" : "none",
      transition: "background 80ms",
    }} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
  >
    {label}
  </Button>
);

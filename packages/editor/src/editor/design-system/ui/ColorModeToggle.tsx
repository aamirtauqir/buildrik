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
 * Topbar uses ColorModeIconCycle (sibling file) for the icon-cycle path.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import { useColorMode } from "../state/useColorMode";
import { Button } from "flowbite-react";

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
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 2,
        borderRadius: "var(--bk-radius-full)",
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
    onClick={() => composer.colorMode.set(value)}
    style={{
      padding: "3px 12px",
      fontSize: 11,
      fontWeight: 600,
      border: "none",
      borderRadius: "var(--bk-radius-full)",
      cursor: "pointer",
      background: active ? "var(--bk-accent)" : "transparent",
      color: active ? "var(--bk-accent-on)" : "var(--bk-ink-muted)",
      transition: "background 80ms",
    }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
  >
    {label}
  </Button>
);

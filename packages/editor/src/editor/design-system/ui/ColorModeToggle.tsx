/**
 * Color Mode Toggle — 2-pill seg `[Light][Dark]` per spec D1 (DS prototype
 * full rewrite arc).
 *
 * Default render: 2-pill seg used inside the DS panel.
 *   - `role="tablist"` container with `aria-label="Color mode"`.
 *   - Each pill: `role="tab"` + `aria-selected`.
 *   - Active pill uses `var(--bd-accent)` bg + white fg; inactive is transparent.
 *   - System mode dropped from UI; composer state preserves auto-detect for
 *     first load. When composer resolves to "dark", Dark pill is active.
 *
 * Legacy render: `renderTrigger` slot kept for the Topbar IconButton wrapper
 * (icon cycle Sun→Moon→Monitor). Removing it would break Topbar's tooltip
 * `asChild` ref-forwarding pattern; new DS panel mount supplies no slot and
 * gets the seg.
 *
 * Wires to:
 *   - composer.colorMode (B.0) — get/set/resolved
 *   - composer.on("colorMode:changed") — external sync
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import type { ThemeMode } from "../types";

const NEXT_MODE: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const MODE_LABEL: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function IconSun() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconMonitor() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

const ICON: Record<ThemeMode, React.ComponentType> = {
  light: IconSun,
  dark: IconMoon,
  system: IconMonitor,
};

export interface ColorModeToggleProps {
  composer: Composer;
  /**
   * Legacy icon-cycle render slot (Topbar). When supplied, behaves like the
   * pre-arc icon button: click cycles light → dark → system → light. New DS
   * panel mount omits this and gets the 2-pill seg instead.
   */
  renderTrigger?: (args: { onClick: () => void; ariaLabel: string; children: React.ReactNode }) => React.ReactNode;
}

export const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ composer, renderTrigger }) => {
  const [mode, setMode] = React.useState<ThemeMode>(() => composer.colorMode.get());

  React.useEffect(() => {
    const sync = () => setMode(composer.colorMode.get());
    composer.on("colorMode:changed", sync);
    return () => {
      composer.off("colorMode:changed", sync);
    };
  }, [composer]);

  // Legacy icon-cycle render path (Topbar IconButton wrapper).
  if (renderTrigger) {
    const Icon = ICON[mode];
    const ariaLabel = `Color mode: ${MODE_LABEL[mode]} — click to switch to ${MODE_LABEL[NEXT_MODE[mode]]}`;
    const handleClick = () => composer.colorMode.set(NEXT_MODE[mode]);
    return <>{renderTrigger({ onClick: handleClick, ariaLabel, children: <Icon /> })}</>;
  }

  // Default render: 2-pill seg [Light][Dark] for DS panel header.
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
        borderRadius: 9999,
        border: "1px solid var(--bd-border)",
        background: "var(--bd-bg-subtle)",
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
  <button
    type="button"
    role="tab"
    aria-selected={active}
    onClick={() => composer.colorMode.set(value)}
    style={{
      padding: "3px 12px",
      fontSize: 11,
      fontWeight: 600,
      border: "none",
      borderRadius: 9999,
      cursor: "pointer",
      background: active ? "var(--bd-accent)" : "transparent",
      color: active ? "#fff" : "var(--bd-fg-muted)",
      transition: "background 80ms",
    }}
  >
    {label}
  </button>
);

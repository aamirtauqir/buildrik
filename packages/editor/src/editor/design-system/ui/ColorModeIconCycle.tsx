/**
 * Color Mode Icon Cycle — Topbar render-slot wrapper for an icon button that
 * cycles `light → dark → light` on click.
 *
 *   - System mode is never user-set per spec D1 (composer auto-detects on
 *     first load only). The icon shown reflects the current resolved mode.
 *   - Uses `renderTrigger` slot so the Topbar can wrap with its IconButton
 *     primitive + Tooltip's `asChild` ref-forwarding pattern.
 *
 * Wires to:
 *   - composer.colorMode (B.0) — get/set
 *   - useColorMode hook — subscribes to "colorMode:changed"
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import type { ThemeMode } from "../types";
import { useColorMode } from "../state/useColorMode";

const NEXT_MODE: Record<ThemeMode, "light" | "dark"> = {
  light: "dark",
  dark: "light",
  // System is never user-set (D1) but if composer auto-detects it on first
  // load, the first click should land on Light.
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

export interface ColorModeIconCycleProps {
  composer: Composer;
  /**
   * Render slot supplied by Topbar — wraps the trigger with IconButton +
   * Tooltip's `asChild` ref-forwarding pattern.
   */
  renderTrigger: (args: { onClick: () => void; ariaLabel: string; children: React.ReactNode }) => React.ReactNode;
}

export const ColorModeIconCycle: React.FC<ColorModeIconCycleProps> = ({ composer, renderTrigger }) => {
  const mode = useColorMode(composer);
  const Icon = mode === "dark" ? IconMoon : IconSun;
  const next = NEXT_MODE[mode];
  const ariaLabel = `Color mode: ${MODE_LABEL[mode]} — click to switch to ${MODE_LABEL[next]}`;
  const handleClick = () => composer.colorMode.set(next);
  return <>{renderTrigger({ onClick: handleClick, ariaLabel, children: <Icon /> })}</>;
};

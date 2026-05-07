/**
 * useGlobalModals — D4b Stage 1 extraction (audit-remediation 2026-05-08).
 *
 * Lifted out of useStudioModals.ts. Holds the 3 application-level
 * modals that have no payload: command palette, shortcuts, project
 * settings. They're "global" because they affect the whole studio,
 * not a specific element/asset/page.
 *
 * Returns the flat field shape useStudioModals already exposes — the
 * composer in useStudioModals merges it with the other two sub-hooks
 * and the `closeAll` utility, so consumers see no change.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface UseGlobalModalsReturn {
  // Shortcuts modal
  showShortcuts: boolean;
  setShowShortcuts: React.Dispatch<React.SetStateAction<boolean>>;
  toggleShortcuts: () => void;
  closeShortcuts: () => void;

  // Project Settings modal
  showProjectSettings: boolean;
  openProjectSettings: () => void;
  closeProjectSettings: () => void;

  // Command Palette modal
  showCommandPalette: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

export function useGlobalModals(): UseGlobalModalsReturn {
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [showProjectSettings, setShowProjectSettings] = React.useState(false);
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);

  const toggleShortcuts = React.useCallback(() => {
    setShowShortcuts((prev) => !prev);
  }, []);
  const closeShortcuts = React.useCallback(() => setShowShortcuts(false), []);

  const openProjectSettings = React.useCallback(() => setShowProjectSettings(true), []);
  const closeProjectSettings = React.useCallback(() => setShowProjectSettings(false), []);

  const openCommandPalette = React.useCallback(() => setShowCommandPalette(true), []);
  const closeCommandPalette = React.useCallback(() => setShowCommandPalette(false), []);

  return {
    showShortcuts,
    setShowShortcuts,
    toggleShortcuts,
    closeShortcuts,
    showProjectSettings,
    openProjectSettings,
    closeProjectSettings,
    showCommandPalette,
    openCommandPalette,
    closeCommandPalette,
  };
}

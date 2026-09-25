/**
 * useGlobalModals — D4b Stage 1 extraction (audit-remediation 2026-05-08).
 *
 * Lifted out of useStudioModals.ts. Holds the application-level modal with
 * no payload: keyboard shortcuts. "Global" because it affects the whole
 * studio, not a specific element/asset/page.
 *
 * Returns the flat field shape useStudioModals already exposes — the
 * composer in useStudioModals merges it with the other two sub-hooks
 * and the `closeAll` utility, so consumers see no change.
 *
 * FC-11: Project Settings used to live here as a `showProjectSettings` flag
 * that StudioModals converted straight back into `openLeftPanelToTab("settings")`
 * and cleared — a modal prop with no modal. AquibraStudio now calls
 * `state.openLeftPanelToTab("settings")` directly from both doors (⌃, and
 * the site menu's "Site settings" row), the same route S and ⌘K already used.
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
}

export function useGlobalModals(): UseGlobalModalsReturn {
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  const toggleShortcuts = React.useCallback(() => {
    setShowShortcuts((prev) => !prev);
  }, []);
  const closeShortcuts = React.useCallback(() => setShowShortcuts(false), []);

  return {
    showShortcuts,
    setShowShortcuts,
    toggleShortcuts,
    closeShortcuts,
  };
}

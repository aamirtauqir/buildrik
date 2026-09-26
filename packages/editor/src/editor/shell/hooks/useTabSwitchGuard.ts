/**
 * useTabSwitchGuard — wraps a left-panel tab switch so it prompts instead of
 * silently discarding a staged edit tracked in `shellDirtyRegistry` (B-1).
 *
 * One hook, one dialog, one chokepoint: AquibraStudio wraps
 * `state.setLeftPanelTab` (the function StudioPanels calls for the rail,
 * `ui:switch-tab` and `UI_PANEL_OPEN`) and `state.openLeftPanelToTab` (the
 * function ⌘H, ⇧A, the command palette and every `onOpen*` deep link call)
 * with the same `guard`, so every one of those surfaces goes through this.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { shellDirty } from "../shellDirtyRegistry";

export interface TabSwitchGuardDialogProps {
  open: boolean;
  onKeepEditing: () => void;
  onLeaveAnyway: () => void;
}

export interface UseTabSwitchGuardResult {
  /** Runs `perform` immediately when nothing is dirty; otherwise opens the
   *  confirm dialog and defers `perform` until "Leave anyway". */
  guard: (perform: () => void) => void;
  dialogProps: TabSwitchGuardDialogProps;
}

export function useTabSwitchGuard(): UseTabSwitchGuardResult {
  const pendingRef = React.useRef<(() => void) | null>(null);
  const [open, setOpen] = React.useState(false);

  const guard = React.useCallback((perform: () => void) => {
    if (!shellDirty.get()) {
      perform();
      return;
    }
    pendingRef.current = perform;
    setOpen(true);
  }, []);

  const onKeepEditing = React.useCallback(() => {
    pendingRef.current = null;
    setOpen(false);
  }, []);

  const onLeaveAnyway = React.useCallback(() => {
    const perform = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    // Confirmed leave — every domain drops clean so the switch that just
    // happened doesn't immediately re-block the NEXT one on state a "Leave
    // anyway" already discarded.
    shellDirty.reset();
    perform?.();
  }, []);

  return { guard, dialogProps: { open, onKeepEditing, onLeaveAnyway } };
}

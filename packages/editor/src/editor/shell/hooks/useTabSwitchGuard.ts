/**
 * useTabSwitchGuard — wraps the shell's two left-panel tab-switch sinks so a
 * switch that would unmount unsaved work prompts instead of silently
 * discarding it (B-1).
 *
 * One hook, one dialog, one chokepoint: AquibraStudio hands every door the
 * guarded `setLeftPanelTab` (the rail, `ui:switch-tab`, StudioPanels' open
 * requests) and the guarded `openLeftPanelToTab` (⌘H, ⇧A, the palette,
 * `UI_PANEL_OPEN`, every `onOpen*` deep link) this returns.
 *
 * What is NOT a guarded switch, and so never prompts:
 *   - the same tab (and sub-tab) — nothing unmounts;
 *   - a tab the sink will refuse (`isTabAllowed` false — the VIEWER gate that
 *     lives inside useStudioState): it goes straight to the sink, which
 *     no-ops, and `onSwitched` is not run;
 *   - Brand's staged edits alone — they live in TokenRegistryProvider and
 *     survive the switch (`shellDirty.blocksTabSwitch()` leaves them out;
 *     the exit guard and beforeunload still count them).
 *
 * "Leave anyway" runs the deferred switch and nothing else: each surface owns
 * its registry entry and clears it when it actually unmounts.
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

export interface TabSwitchSinks {
  leftPanelTab: string;
  leftPanelSubTabs: Record<string, string>;
  setLeftPanelTab: (tab: string) => void;
  openLeftPanelToTab: (primaryTab: string, subTab?: string) => void;
  /** The sink's own gate (VIEWER). A refused switch is not guarded. */
  isTabAllowed: (tab: string) => boolean;
}

export interface UseTabSwitchGuardResult {
  /** `onSwitched` runs only once the switch actually happens — a door's
   *  side effects (open the drawer, hand a request down) must not land on a
   *  switch the user kept away from. */
  setLeftPanelTab: (tab: string, onSwitched?: () => void) => void;
  openLeftPanelToTab: (primaryTab: string, subTab?: string, onSwitched?: () => void) => void;
  dialogProps: TabSwitchGuardDialogProps;
}

export function useTabSwitchGuard({
  leftPanelTab,
  leftPanelSubTabs,
  setLeftPanelTab,
  openLeftPanelToTab,
  isTabAllowed,
}: TabSwitchSinks): UseTabSwitchGuardResult {
  const pendingRef = React.useRef<(() => void) | null>(null);
  const [open, setOpen] = React.useState(false);

  const guard = React.useCallback((switchesAway: boolean, perform: () => void) => {
    if (!switchesAway || !shellDirty.blocksTabSwitch()) {
      perform();
      return;
    }
    pendingRef.current = perform;
    setOpen(true);
  }, []);

  const guardedSetLeftPanelTab = React.useCallback(
    (tab: string, onSwitched?: () => void) => {
      if (!isTabAllowed(tab)) return setLeftPanelTab(tab);
      guard(tab !== leftPanelTab, () => {
        setLeftPanelTab(tab);
        onSwitched?.();
      });
    },
    [guard, isTabAllowed, leftPanelTab, setLeftPanelTab],
  );

  const guardedOpenLeftPanelToTab = React.useCallback(
    (primaryTab: string, subTab?: string, onSwitched?: () => void) => {
      if (!isTabAllowed(primaryTab)) return openLeftPanelToTab(primaryTab, subTab);
      const sameView = primaryTab === leftPanelTab && subTab === leftPanelSubTabs[primaryTab];
      guard(!sameView, () => {
        openLeftPanelToTab(primaryTab, subTab);
        onSwitched?.();
      });
    },
    [guard, isTabAllowed, leftPanelTab, leftPanelSubTabs, openLeftPanelToTab],
  );

  const onKeepEditing = React.useCallback(() => {
    pendingRef.current = null;
    setOpen(false);
  }, []);

  const onLeaveAnyway = React.useCallback(() => {
    const perform = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    perform?.();
  }, []);

  return {
    setLeftPanelTab: guardedSetLeftPanelTab,
    openLeftPanelToTab: guardedOpenLeftPanelToTab,
    dialogProps: { open, onKeepEditing, onLeaveAnyway },
  };
}

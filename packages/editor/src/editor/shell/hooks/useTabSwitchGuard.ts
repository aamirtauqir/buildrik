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
 * Closing the drawer is guarded too (EDT-007): it unmounts the CMS workspace
 * and an open record sheet with it, so a dirty record asks through this same
 * dialog. Settings stays mounted in a closed drawer, so it is not asked about
 * there, and "Leave anyway" on a close discards only the record.
 *
 * What is NOT a guarded switch, and so never prompts:
 *   - the same tab (and sub-tab) — nothing unmounts;
 *   - a tab the sink will refuse (`isTabAllowed` false — the VIEWER gate that
 *     lives inside useStudioState): it goes straight to the sink, which
 *     no-ops, and `onSwitched` is not run;
 *
 * "Leave anyway" first runs each dirty surface's registered discard (Settings
 * rolls back its live composer writes, a record sheet resets its fields), then
 * switches. The copy promises loss only when every dirty surface can discard;
 * otherwise it says "may discard some of them". (Brand has nothing to guard
 * since its edits autosave — spec §4.)
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { shellDirty, type DirtyDomain } from "../shellDirtyRegistry";

export interface TabSwitchGuardDialogProps {
  open: boolean;
  body: string;
  leaveLabel: string;
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
  /** Told which domains' discards threw during "Leave anyway" — the switch
   *  still happens; those domains stay dirty. */
  onDiscardFailed: (domains: DirtyDomain[]) => void;
  isLeftPanelOpen: boolean;
  setIsLeftPanelOpen: (open: boolean) => void;
}

/* What a drawer close unmounts: the CMS workspace (StudioPanels'
   `cmsWorkspaceOpen` needs the drawer open) and its record sheet. */
const DRAWER_CLOSE_LOSES: readonly DirtyDomain[] = ["cms-record"];

export interface UseTabSwitchGuardResult {
  /** `onSwitched` runs only once the switch actually happens — a door's
   *  side effects (open the drawer, hand a request down) must not land on a
   *  switch the user kept away from. */
  setLeftPanelTab: (tab: string, onSwitched?: () => void) => void;
  openLeftPanelToTab: (primaryTab: string, subTab?: string, onSwitched?: () => void) => void;
  /** The drawer ✕, the active rail icon, the canvas background click. */
  toggleLeftPanel: () => void;
  closeLeftPanel: () => void;
  dialogProps: TabSwitchGuardDialogProps;
}

/** The confirm's words, read when it opens: loss is promised only when every
 *  dirty surface will really discard on "Leave anyway". */
function leaveCopy(only?: readonly DirtyDomain[]): { body: string; leaveLabel: string } {
  if (shellDirty.everyDirtyDiscards(only)) {
    return { body: "You have unsaved changes. Switching away will lose them.", leaveLabel: "Leave and lose changes" };
  }
  return {
    body: "You have unsaved changes. Switching away may discard some of them.",
    leaveLabel: "Leave anyway",
  };
}

export function useTabSwitchGuard({
  leftPanelTab,
  leftPanelSubTabs,
  setLeftPanelTab,
  openLeftPanelToTab,
  isTabAllowed,
  onDiscardFailed,
  isLeftPanelOpen,
  setIsLeftPanelOpen,
}: TabSwitchSinks): UseTabSwitchGuardResult {
  /* `only` is what the pending exit unmounts (undefined: every domain). */
  const pendingRef = React.useRef<{ perform: () => void; only?: readonly DirtyDomain[] } | null>(null);
  const [prompt, setPrompt] = React.useState<{ body: string; leaveLabel: string } | null>(null);

  const guard = React.useCallback((switchesAway: boolean, perform: () => void, only?: readonly DirtyDomain[]) => {
    if (!switchesAway || !(only ? shellDirty.anyDirty(only) : shellDirty.get())) {
      perform();
      return;
    }
    pendingRef.current = { perform, only };
    setPrompt(leaveCopy(only));
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

  const closeLeftPanel = React.useCallback(() => {
    guard(isLeftPanelOpen, () => setIsLeftPanelOpen(false), DRAWER_CLOSE_LOSES);
  }, [guard, isLeftPanelOpen, setIsLeftPanelOpen]);

  const toggleLeftPanel = React.useCallback(() => {
    if (isLeftPanelOpen) closeLeftPanel();
    else setIsLeftPanelOpen(true);
  }, [closeLeftPanel, isLeftPanelOpen, setIsLeftPanelOpen]);

  const onKeepEditing = React.useCallback(() => {
    pendingRef.current = null;
    setPrompt(null);
  }, []);

  const onLeaveAnyway = React.useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setPrompt(null);
    const failed = shellDirty.discardDirty(pending?.only);
    pending?.perform();
    if (failed.length > 0) onDiscardFailed(failed);
  }, [onDiscardFailed]);

  return {
    setLeftPanelTab: guardedSetLeftPanelTab,
    openLeftPanelToTab: guardedOpenLeftPanelToTab,
    toggleLeftPanel,
    closeLeftPanel,
    dialogProps: {
      open: prompt !== null,
      body: prompt?.body ?? "",
      leaveLabel: prompt?.leaveLabel ?? "",
      onKeepEditing,
      onLeaveAnyway,
    },
  };
}

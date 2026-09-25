/**
 * FullPageRouter — Routes fullpage-mode tabs: Templates, Settings, Design
 * (`mode: "fullpage"` in tabsConfig) and Assets (`mode: "panel"`, but
 * portaled full-page via the `mediaFullPage` override — StudioPanels.tsx).
 * History is a right-column mode (Publish/Review/History/Activity swap in
 * for the Inspector), never fullpage, and has no case here.
 * Renders inside LayoutShell.FullPage slot when a fullpage tab is active.
 *
 * FC-7 — THE THREE TAKEOVER SHAPES
 * ---------------------------------
 * The studio has exactly three ways a surface can take over from the normal
 * rail+drawer+canvas+inspector layout. They read as one family (all replace
 * the editing chrome, all close on their own Escape) but they are NOT
 * interchangeable — each is load-bearing for a different reason:
 *
 * 1. Full-screen portal (Templates · Assets · Settings · Design — the cases
 *    below). Rendered via chrome-ui's `Portal` into the overlay root,
 *    `position: fixed; inset: 0`, OUTSIDE LayoutShell's grid entirely — the
 *    rail disappears too. Each screen builds its own 256px nav with its own
 *    `‹ Back to canvas`, owns its own Escape and its own confirm dialogs
 *    (an unsaved-draft guard, for Settings). Used when the surface is a
 *    whole workspace in its own right, not a canvas-editing mode.
 *
 * 2. CMS canvas region (`cmsWorkspaceOpen`, StudioPanels.tsx). Rendered
 *    in-place inside `LayoutShell.Canvas` (`tw:absolute tw:inset-0` over the
 *    canvas content, NOT a Portal) — the rail and drawer stay mounted and
 *    interactive beside it; only the canvas + inspector are replaced. Used
 *    because CMS editing is still "in the site" (the drawer's other tabs —
 *    Pages, Layers — stay reachable while you edit a record).
 *
 * 3. Compare overlay (`CompareHost.tsx`). Rendered once by the shell through
 *    chrome-ui's `OverlayMount` (Gate 22's overlay-root primitive, not a
 *    bare `Portal` and not an in-canvas region) — full-canvas, opened by
 *    `UI_COMPARE_OPEN` from any of its three doors (Review, History,
 *    Publish history). Used because Compare is transient and door-agnostic:
 *    nothing owns "the Compare tab", so it has no tab id and no rail slot to
 *    replace — an overlay is the only shape that fits a surface with no home
 *    tab.
 *
 * Rule of thumb for new takeovers: if it's a workspace someone opens as a
 * destination (has its own rail-adjacent identity) → shape 1. If it's an
 * editing mode that should still show the rest of the drawer → shape 2. If
 * it's transient and reachable from more than one unrelated door → shape 3.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { ImageEditorOptions } from "../shell/hooks/useStudioModals";
import type { EditsSnapshot } from "@shared/types/media";
import type { Composer } from "../../engine";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { IconConfig } from "../../shared/types/media";
import { Portal } from "@/editor/chrome-ui";
import type { SettingsOpenRequest } from "./tabs/settings/types";
import type { TemplatesOpenRequest } from "./tabs/templates/TemplatesTab";

// Lazy-loaded fullpage tab components
const TemplatesTab = React.lazy(() => import("./tabs/templates/TemplatesTab"));
const LibraryManager = React.lazy(() =>
  import("../media/LibraryManager").then((m) => ({ default: m.LibraryManager }))
);
const SettingsTab = React.lazy(() => import("./tabs/settings/SettingsTab"));
const BrandWorkspace = React.lazy(() => import("@/editor/design-system/ui/BrandWorkspace"));

/** Props shared across all fullpage tabs (no pin concept in fullpage mode) */
export interface FullPageCommonProps {
  onHelpClick?: () => void;
  onClose: () => void;
  onOpenImageEditor?: (
    imageSrc: string,
    onSave: (editedSrc: string, edits: EditsSnapshot) => void | Promise<void>,
    options?: ImageEditorOptions,
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
}

export interface FullPageRouterProps {
  activeTab: GroupedTabId;
  /** Deep-link screen inside the active fullpage tab. */
  activeSubTab?: string;
  composer: Composer | null;
  commonTabProps: FullPageCommonProps;
  onSwitchToAdd?: () => void;
  onSwitchToDesign?: () => void;
  projectId?: string | null;
  onSettingsDirtyChange?: (dirty: boolean) => void;
  /** `ui:settings-open` — the screen (and repair draft) Settings opens on. */
  settingsOpen?: SettingsOpenRequest | null;
  onTemplatesSwitchTab?: (tab: string) => void;
  /** `ui:browse-templates` — New-page name (#19), a template to preview, or
   *  replace mode (4428:149355). */
  templatesOpen?: TemplatesOpenRequest | null;
}

export const FullPageRouter: React.FC<FullPageRouterProps> = ({
  activeTab,
  activeSubTab,
  composer,
  commonTabProps,
  onSwitchToAdd,
  onSwitchToDesign,
  projectId,
  onSettingsDirtyChange,
  settingsOpen,
  onTemplatesSwitchTab,
  templatesOpen,
}) => {
  switch (activeTab) {
    /* Decision #24 — board 4418:54134 is edge-to-edge like Settings: the
       view's own sidebar carries `‹ Back to canvas`. Same portal, same reason
       (the view owns its Escape and its dialogs). */
    case "templates":
      return (
        <Portal>
          <div
            className="tw:fixed tw:inset-0 tw:z-[var(--bk-z-overlay)] tw:bg-[var(--bk-bg-panel)]"
            data-testid="tpl-host"
          >
            <TemplatesTab
              composer={composer}
              onTemplateUsed={onSwitchToAdd}
              onSwitchTab={onTemplatesSwitchTab}
              request={templatesOpen}
              onClose={commonTabProps.onClose}
            />
          </div>
        </Portal>
      );

    /* Clone 3695:45155 — the Asset library is edge-to-edge: no rail, no
       topbar, its own Close. The V1 board (1159:4593) drew it inside the
       shell's 1380×844 band, which is what the LayoutShell slot gives; the
       Clone frames are 1440×900 with the SMART rail at x=0. So the library
       does not render into the slot at all — it portals a fixed host into the
       overlay root (Gate 22: `Portal`, not OverlayMount — the library owns
       its Escape and its modals, and a scrim it never asked for would close
       it on a stray click). */
    case "assets":
      return composer ? (
        <Portal>
          <div className="mgr-host" data-testid="mgr-host">
            <LibraryManager
              composer={composer}
              onClose={commonTabProps.onClose}
              onOpenImageEditor={commonTabProps.onOpenImageEditor}
            />
          </div>
        </Portal>
      ) : null;

    /* Clone 3397:32011 — Settings is edge-to-edge the same way the library
       is: a 256 sidebar at x=0 whose `‹ Back to canvas` is the one door out,
       and a 1184 pane, which is the full 1440. Inside the slot it would have
       been 1123 under a topbar whose own `‹ Exit` sat beside Back to canvas.
       Same portal, same reason it is not an OverlayMount: the tab owns its
       Escape, its guard and its dialogs. */
    case "settings":
      return (
        <Portal>
          <div
            className="tw:fixed tw:inset-0 tw:z-[var(--bk-z-overlay)] tw:bg-[var(--bk-bg-panel)]"
            data-testid="set-host"
          >
            <SettingsTab
              initialScreen={activeSubTab}
              composer={composer}
              projectId={projectId}
              onDirtyChange={onSettingsDirtyChange}
              openRequest={settingsOpen}
              onOpenDesignTab={onSwitchToDesign}
              onClose={commonTabProps.onClose}
            />
          </div>
        </Portal>
      );

    /* Board 7315:80955 — Brand is a full-canvas workspace (owner decision
       OD-1, 2026-09-21): its own 256 nav with `‹ Back to canvas`, a pane and
       a preview column across the full 1440. Same portal as Settings, for the
       same reason it is not an OverlayMount: the workspace owns its Escape,
       its unsaved-draft guard and its dialogs. */
    case "design":
      return (
        <Portal>
          <div
            className="tw:fixed tw:inset-0 tw:z-[var(--bk-z-overlay)] tw:bg-[var(--bk-bg-panel)]"
            data-testid="brand-host"
          >
            <BrandWorkspace
              composer={composer}
              projectId={projectId}
              initialPage={activeSubTab}
              onClose={commonTabProps.onClose}
            />
          </div>
        </Portal>
      );

    default:
      return null;
  }
};

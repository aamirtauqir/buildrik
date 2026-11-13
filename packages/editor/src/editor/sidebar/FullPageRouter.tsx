/**
 * FullPageRouter — Routes fullpage-mode tabs: Templates, Settings, Design
 * (`mode: "fullpage"` in tabsConfig) and Assets (`mode: "panel"`, but
 * full-page via the `mediaFullPage` override — StudioPanels.tsx).
 * History is a right-column mode (Publish/Review/History/Activity swap in
 * for the Inspector), never fullpage, and has no case here.
 * Renders inside LayoutShell.FullPage slot when a fullpage tab is active.
 *
 * FC-7 — THE TAKEOVER SHAPES
 * ---------------------------
 * The studio has three ways a surface can take over from the normal
 * rail+drawer+canvas+inspector layout. They read as one family (all replace
 * the editing chrome, all close on their own Escape) but they are NOT
 * interchangeable — each is load-bearing for a different reason:
 *
 * 1. Resource area (Assets · Settings · Brand · Templates — the in-place
 *    cases below;
 *    CMS is the same family, see 2). Rendered where this router is mounted:
 *    LayoutShell's fullpage slot, which spans the drawer, canvas and
 *    inspector columns while the canvas stays mounted (visibility:hidden)
 *    underneath. The topbar, the rail and the bottom bar's "Editor keeps
 *    {page} open — return with ‹ Back to Editor" stay around it (2L9 boards
 *    B6-A01, B6-B01, B8-S01: Topbar 0–56 · Workspace 56–868 · BottomBar
 *    868–900). Each screen still builds its own nav with its own way back,
 *    owns its own Escape and its own confirm dialogs (Settings' unsaved-draft
 *    guard). Used when the surface is a whole workspace in its own right.
 *    (Until design-2l9 C-10/D-10/E-10 these portaled a `fixed inset-0` host
 *    over the whole window, rail and topbar included.)
 *
 *    Templates joined them in design-2l9 C-17: the 2L9 boards (222:43842,
 *    223:44891) draw it in place — topbar, rail and the bottom bar's
 *    "‹ Back to Editor" stay. (It was an edge-to-edge portal, 4418:54134.)
 *
 * 2. CMS canvas region (`cmsWorkspaceOpen`, StudioPanels.tsx). Rendered
 *    in-place inside `LayoutShell.Canvas` (`tw:absolute tw:inset-0` over the
 *    canvas content, NOT a Portal) — the rail AND drawer stay mounted and
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
import type { Composer } from "@/engine";
import type { GroupedTabId } from "../rail/tabsConfig";
import type { IconConfig } from "@/shared/types/media";
import { Button, SkeletonBlock } from "@/editor/chrome-ui";
import { InspectorErrorBoundary } from "../inspector/components/InspectorErrorBoundary";
import type { SettingsOpenRequest } from "./tabs/settings/types";
import type { TemplatesOpenRequest } from "./tabs/templates/TemplatesTab";

// Lazy-loaded fullpage tab components
const TemplatesTab = React.lazy(() => import("./tabs/templates/TemplatesTab"));
const LibraryManager = React.lazy(() =>
  import("../media/LibraryManager").then((m) => ({ default: m.LibraryManager }))
);
const SettingsTab = React.lazy(() => import("./tabs/settings/SettingsTab"));
const ComponentsTab = React.lazy(() => import("./tabs/ComponentsTab"));
const loadBrandWorkspace = () => import("@/editor/design-system/ui/BrandWorkspace");

/* The resource-area host: fills the fullpage slot, in place. */
const RESOURCE_HOST = "tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:bg-[var(--bk-bg-panel)]";

/** B6-B42 — Brand's skeleton while its chunk loads. */
const BrandLoading: React.FC = () => (
  <div className="tw:flex tw:min-h-0 tw:flex-1" data-testid="brand-loading" aria-busy="true" aria-label="Loading Brand">
    <div className="tw:flex tw:w-64 tw:flex-none tw:flex-col tw:gap-3 tw:border-r tw:border-[var(--bk-border)] tw:p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonBlock key={i} className="tw:h-4 tw:w-40" />
      ))}
    </div>
    <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-4 tw:p-6">
      <SkeletonBlock className="tw:h-6 tw:w-48" />
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBlock key={i} className="tw:h-16 tw:w-full" />
      ))}
    </div>
  </div>
);

/** B6-B56 (server) / B6-B57 (offline, first load) — Brand did not load. */
const BrandLoadFailed: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return (
    <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:p-6">
      <div role="alert" className="tw:flex tw:max-w-[360px] tw:flex-col tw:items-start tw:gap-2" data-testid="brand-load-failed">
        <span className="tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:text-[var(--bk-ink)]">
          {offline ? "You’re offline" : "Couldn’t load Brand"}
        </span>
        <span className="tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
          {offline
            ? "Brand needs a connection to load the first time. Reconnect and try again."
            : "Something went wrong on our side. Your site and its colors are not affected."}
        </span>
        <Button variant="primary" size="xs" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </div>
  );
};

/* Brand's lazy mount owns its own load states (D-10). A rejected
   `React.lazy` stays rejected, so Retry builds a fresh one. */
const BrandHost: React.FC<{
  composer: Composer | null;
  projectId?: string | null;
  initialPage?: string;
  onClose: () => void;
}> = ({ composer, projectId, initialPage, onClose }) => {
  const [attempt, setAttempt] = React.useState(0);
  const BrandWorkspace = React.useMemo(() => React.lazy(loadBrandWorkspace), [attempt]);
  return (
    /* No data-bk-surface: Brand edits are composer writes, so ⌘Z/⌘⇧Z must
       reach the engine (CommandCenter's full-page guard would refuse them). */
    <div className={RESOURCE_HOST} data-testid="brand-host">
      <InspectorErrorBoundary key={attempt} fallback={<BrandLoadFailed onRetry={() => setAttempt((n) => n + 1)} />}>
        <React.Suspense fallback={<BrandLoading />}>
          <BrandWorkspace composer={composer} projectId={projectId} initialPage={initialPage} onClose={onClose} />
        </React.Suspense>
      </InspectorErrorBoundary>
    </div>
  );
};

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
  settingsOpen,
  onTemplatesSwitchTab,
  templatesOpen,
}) => {
  switch (activeTab) {
    /* Templates (222:43842, 223:44891 — C-17), Assets (B6-A01 199:37199),
       Site settings (B8-S01 238:9980) and Brand (B6-B01) are the resource
       area (shape 1 above): in place, inside the shell. Each owns its Escape,
       its guard and its dialogs; Templates, Assets and Settings also own the
       keyboard (data-bk-surface, CommandCenter). */
    case "templates":
      return (
        <div className={RESOURCE_HOST} data-testid="tpl-host" data-bk-surface="fullpage">
          <TemplatesTab
            composer={composer}
            onTemplateUsed={onSwitchToAdd}
            onSwitchTab={onTemplatesSwitchTab}
            request={templatesOpen}
            onClose={commonTabProps.onClose}
          />
        </div>
      );

    case "assets":
      return composer ? (
        <div className={RESOURCE_HOST} data-testid="mgr-host" data-bk-surface="fullpage">
          <LibraryManager
            composer={composer}
            onClose={commonTabProps.onClose}
            onOpenImageEditor={commonTabProps.onOpenImageEditor}
          />
        </div>
      ) : null;

    /* 2L9 215:43588 (B6-K02): Components is a resource area. No
       data-bk-surface, like Brand: detach and delete are composer writes and
       their ⌘Z must reach the composer. */
    case "components":
      return (
        <div className={RESOURCE_HOST} data-testid="comp-host">
          <ComponentsTab composer={composer} onClose={commonTabProps.onClose} />
        </div>
      );

    case "settings":
      return (
        <div className={RESOURCE_HOST} data-testid="set-host" data-bk-surface="fullpage">
          <SettingsTab
            initialScreen={activeSubTab}
            composer={composer}
            projectId={projectId}
            openRequest={settingsOpen}
            onOpenDesignTab={onSwitchToDesign}
            onClose={commonTabProps.onClose}
          />
        </div>
      );

    case "design":
      return (
        <BrandHost
          composer={composer}
          projectId={projectId}
          initialPage={activeSubTab}
          onClose={commonTabProps.onClose}
        />
      );

    default:
      return null;
  }
};

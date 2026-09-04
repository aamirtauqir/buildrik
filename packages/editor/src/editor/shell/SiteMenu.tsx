/**
 * Site menu — the ⋯ overflow in the topbar.
 *
 * Figma: successor to `popover/site-menu` 642:3664 — regrouped per the topbar
 * redesign plan (docs/plans/2026-07-30-topbar-complete-redesign.md §3; node
 * update pending T1). Five named groups, no "More" dump:
 *
 *   Site       — settings · version history · publish history · export code
 *   Build      — templates · components · design system · plugins
 *   Share      — enter view mode · view live site · copy live URL · share preview link
 *   Workspace  — invite · account · start collaboration (flag-gated)
 *   (footer)   — keyboard shortcuts
 *
 * Moved OUT to the bar's tool cluster (plan §2): Preview, Comments, Issues.
 * Removed (D8): "Exit to dashboard" — the bar's ‹ Exit is always visible; a
 * second door in the overflow was dead weight.
 *
 * The view-mode row has now been named three times. D9 renamed "Preview as
 * client" → "Open client view"; 2026-08-23 renamed it again to "Enter view
 * mode", because both earlier names claimed an audience that never receives
 * this surface. A client is sent /share/<token> or /review/<token> — the row
 * below this one, and the review round respectively. This row is the owner
 * looking at their own draft with the editor out of the way, which is what
 * Figma calls view mode. Board 642:3664 still carries the D9 copy; the board
 * is being updated in the same arc, so if it disagrees, the board is stale.
 *
 * A group renders only when at least one of its rows is present (eng D8) —
 * the Share group is all-conditional and an empty MenuGroup div would still
 * draw its border-top.
 *
 * Ask AI keeps a row ONLY in the legacy four-tool-rail mode (its single home
 * is the rail's ✨ AI tab); the row retires with that mode.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconButton, Menu, MenuGroup, MenuItem, MenuLabel, Popover, SiteMenuIcon } from "@/editor/chrome-ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

export interface SiteMenuProps {
  // ── Site ──────────────────────────────────────────────────────────────────
  onOpenSiteSettings?: () => void;
  onOpenHistory?: () => void;
  /**
   * Opens the Review panel — the same door the topbar pill opens.
   *
   * The pill was the ONLY door, and `REVIEW_PILL.none` is null: revoke a round
   * without sending a new one and the pill disappears, taking the panel with
   * it. The rail has no Review tab either (6 tabs, none of them Review), so
   * the panel — its comments, its round history, Compare — became unreachable
   * without a database write. Reached live doing exactly that. A status
   * indicator that vanishes with the status cannot also be the navigation.
   */
  onOpenReview?: () => void;
  /**
   * Opens the Publish panel — board 641:2652, a 320-wide drawer surface with
   * the environment rows, the since-last-deploy change list, the last deploy
   * and the pre-publish wizard behind its CTA.
   *
   * It had no door. `StudioHeader` took an `onOpenPublish` prop and spent it
   * on `publishNow = onVercelPublish ?? onOpenPublish ?? handleExport`, where
   * `onVercelPublish` is a plain `useCallback` in `AquibraStudio` and is
   * therefore never undefined — so the panel opener could only ever fire in a
   * build with publishing turned off. Nothing else in the editor switched to
   * the publish tab: not the rail (publish has no rail zone by design), not
   * the command palette, not `ui:switch-tab`. The whole panel was unreachable.
   *
   * The topbar keeps its fast path to `PublishConfirmModal` — that is
   * deliberate, and it shares `PublishConfirmFacts` with the wizard's confirm
   * step so the two cannot drift. This is the panel's own door, next to the
   * publish history it belongs with.
   */
  onOpenPublish?: () => void;
  onOpenPublishHistory?: () => void;
  /** Take the site down. Only offered while a published URL exists; the
   *  Publish panel hosts the confirm. unpublishSite was fully built with
   *  Vercel teardown and exposed only in the dashboard, so taking a site down
   *  meant leaving the editor. */
  onUnpublish?: () => void;
  onExportCode?: () => void;
  // ── Build ─────────────────────────────────────────────────────────────────
  onOpenTemplates?: () => void;
  onOpenComponents?: () => void;
  onOpenDesignSystem?: () => void;
  onOpenPlugins?: () => void;
  // ── Share ─────────────────────────────────────────────────────────────────
  readOnlyView?: boolean;
  /** Client-view toggle is a full-page navigation, so the container owns it —
   *  it must pass through the dirty-exit guard (F1) like every other exit. */
  onToggleReadOnlyView?: () => void;
  /** Live URL once the site has been published. */
  publishedUrl?: string | null;
  /** Copying can fail (no clipboard on insecure origins), so the container
   *  owns it — this menu has no way to tell the user it didn't work. */
  onCopyLiveUrl?: () => void;
  /**
   * The site this menu belongs to, for the dashboard hand-offs that need one.
   * Board 642:3401's "Share preview link" is the case: the flow exists — the
   * dashboard's ShareDraftModal, on `siteDetail.sharing.create` — and the
   * editor had no way to reach it.
   */
  siteId?: string | null;
  // ── Workspace ─────────────────────────────────────────────────────────────
  /** Collaboration is flag-gated; when it is on, the session has to be startable. */
  onStartCollaboration?: () => void;
  /** Legacy four-tool rail only — the rail's ✨ AI tab is the canonical home. */
  onAskAI?: () => void;
  // ── Footer ────────────────────────────────────────────────────────────────
  /** Open Keyboard Shortcuts panel (`?`) */
  onOpenShortcuts?: () => void;
  /** Re-open the getting-started checklist. Omitted in view mode — a viewer is
   *  not being onboarded into a build they cannot make. */
  onReplayOnboarding?: () => void;
}

function openDashboard(path: string) {
  window.open(`${DASHBOARD_URL}${path}`, "_blank", "noopener,noreferrer");
}

/**
 * F6 (OV#5): ⌘H is macOS's OS-level window-hide — the browser never sees the
 * keydown, so advertising it is a lie. The handler (useEditorShortcuts:88)
 * accepts ctrl OR meta on every platform; the hint shows the chord that
 * actually works where the user is.
 */
const IS_MAC = typeof navigator !== "undefined" && /Mac|iP(hone|ad|od)/.test(navigator.platform);
const HISTORY_KBD = IS_MAC ? "⌃H" : "Ctrl H";
/**
 * T9 (F22): ⌘, is the browser's own Preferences accelerator on macOS — Chrome,
 * Safari and Firefox all take it before the page, exactly like ⌘H above. Same
 * fix, same reason: the handler already accepts ctrl OR meta, so the control
 * chord is the one that reaches us, and the hint says so.
 */
const SETTINGS_KBD = IS_MAC ? "⌃," : "Ctrl ,";
/* This row printed "?", which opens the CANVAS cheat sheet (board 815:4518) —
   a different screen from the one this row opens. Measured in the editor: "?"
   drew "⌨️ Keyboard Shortcuts · SELECTION · Select element", while this row and
   ⌘/ drew "Keyboard Shortcuts · PANELS · Open Insert panel". Print the chord
   that opens THIS one. */
const SHORTCUTS_KBD = IS_MAC ? "⌘/" : "Ctrl /";

export const SiteMenu: React.FC<SiteMenuProps> = ({
  onOpenSiteSettings,
  onOpenHistory,
  onOpenReview,
  onOpenPublish,
  onOpenPublishHistory,
  onUnpublish,
  onExportCode,
  onOpenTemplates,
  onOpenComponents,
  onOpenDesignSystem,
  onOpenPlugins,
  readOnlyView = false,
  onToggleReadOnlyView,
  publishedUrl,
  onCopyLiveUrl,
  siteId,
  onStartCollaboration,
  onAskAI,
  onOpenShortcuts,
  onReplayOnboarding,
}) => {
  const [open, setOpen] = React.useState(false);
  const run = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };

  const hasSite = Boolean(
    onOpenSiteSettings || onOpenHistory || onOpenReview || onOpenPublish || onOpenPublishHistory || onExportCode,
  );
  const hasBuild = Boolean(onOpenTemplates || onOpenComponents || onOpenDesignSystem || onOpenPlugins);
  const hasShare = Boolean(onToggleReadOnlyView || publishedUrl || siteId);

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label="Site menu"
      trigger={
        <IconButton label="Site menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <SiteMenuIcon />
        </IconButton>
      }
    >
      <Menu label="Site menu">
        {hasSite && (
          <MenuGroup>
            <MenuLabel>Site</MenuLabel>
            {onOpenSiteSettings ? (
              <MenuItem kbd={SETTINGS_KBD} onClick={run(onOpenSiteSettings)}>
                Site settings
              </MenuItem>
            ) : null}
            {onOpenHistory ? (
              <MenuItem kbd={HISTORY_KBD} onClick={run(onOpenHistory)}>
                Version history
              </MenuItem>
            ) : null}
            {onOpenReview ? <MenuItem onClick={run(onOpenReview)}>Review</MenuItem> : null}
            {onOpenPublish ? <MenuItem onClick={run(onOpenPublish)}>Publish panel</MenuItem> : null}
            {onOpenPublishHistory ? (
              <MenuItem onClick={run(onOpenPublishHistory)}>Publish history</MenuItem>
            ) : null}
            {onUnpublish && publishedUrl ? (
              <MenuItem onClick={run(onUnpublish)}>Unpublish site…</MenuItem>
            ) : null}
            {onExportCode ? <MenuItem onClick={run(onExportCode)}>Export code</MenuItem> : null}
          </MenuGroup>
        )}

        {/* Board 642:3401's second group. Both are real dashboard surfaces —
            the Health Score panel and Recent Activity on the site's overview —
            that the editor simply had no door to. They deep-link to their own
            section rather than to the page, so each lands where its label
            says it will. */}
        {siteId && !readOnlyView && (
          <MenuGroup>
            <MenuItem onClick={run(() => openDashboard(`/dashboard/sites/${siteId}#site-health`))}>
              Site health
            </MenuItem>
            <MenuItem onClick={run(() => openDashboard(`/dashboard/sites/${siteId}#activity-log`))}>
              Activity log
            </MenuItem>
          </MenuGroup>
        )}

        {hasBuild && (
          <MenuGroup>
            <MenuLabel>Build</MenuLabel>
            {/* The design labels Templates "T", which is also the device-switcher
                chip (W · D · T · M) on the canvas toolbar. Showing a shortcut the
                product cannot honour is worse than showing none, so it is omitted
                until Figma resolves the collision. */}
            {onOpenTemplates ? <MenuItem onClick={run(onOpenTemplates)}>Templates</MenuItem> : null}
            {onOpenComponents ? (
              <MenuItem kbd="⇧A" onClick={run(onOpenComponents)}>
                Components
              </MenuItem>
            ) : null}
            {/* "Brand", not "Design system". This row and the rail's Brand
                button are the SAME destination — both land on tab "design"
                (AquibraStudio.tsx:509) and the panel that opens is headed
                "Brand". Two names for one screen is a door the user has to
                learn twice. Measured live 2026-09-04. */}
            {onOpenDesignSystem ? <MenuItem onClick={run(onOpenDesignSystem)}>Brand</MenuItem> : null}
            {onOpenPlugins ? <MenuItem onClick={run(onOpenPlugins)}>Plugins</MenuItem> : null}
          </MenuGroup>
        )}

        {hasShare && (
          <MenuGroup>
            <MenuLabel>Share</MenuLabel>
            {onToggleReadOnlyView ? (
              <MenuItem onClick={run(onToggleReadOnlyView)}>
                {readOnlyView ? "Exit view mode" : "Enter view mode"}
              </MenuItem>
            ) : null}
            {publishedUrl ? (
              <MenuItem onClick={run(() => window.open(publishedUrl, "_blank", "noopener,noreferrer"))}>
                View live site
              </MenuItem>
            ) : null}
            {publishedUrl && onCopyLiveUrl ? <MenuItem onClick={run(onCopyLiveUrl)}>Copy live URL</MenuItem> : null}
            {/* Board 642:3401. A private link to the current DRAFT — a
                different thing from the live URL above it, and the one a
                client is sent before anything is published. The flow is the
                dashboard's ShareDraftModal; this hands off to it directly,
                the way "Invite teammates" below hands off to team settings,
                rather than landing the user on a page to hunt for a button. */}
            {siteId && !readOnlyView ? (
              <MenuItem onClick={run(() => openDashboard(`/dashboard/sites/${siteId}?share=1`))}>
                Share preview link
              </MenuItem>
            ) : null}
          </MenuGroup>
        )}

        {/* Workspace doors belong to whoever owns the workspace. In view mode
            the menu keeps only the way back out — the mode is for looking at
            the draft, not for administering the workspace from it. */}
        {readOnlyView ? null : (
        <MenuGroup>
          <MenuLabel>Workspace</MenuLabel>
          <MenuItem onClick={run(() => openDashboard("/dashboard/settings/team"))}>Invite teammates</MenuItem>
          <MenuItem onClick={run(() => openDashboard("/dashboard/settings/account"))}>Account settings</MenuItem>
          {onStartCollaboration ? (
            <MenuItem onClick={run(onStartCollaboration)}>Start collaboration</MenuItem>
          ) : null}
          {onAskAI ? <MenuItem onClick={run(onAskAI)}>Ask AI</MenuItem> : null}
        </MenuGroup>
        )}

        {onOpenShortcuts || onReplayOnboarding ? (
          <MenuGroup>
            {onReplayOnboarding ? (
              <MenuItem onClick={run(onReplayOnboarding)}>Getting started</MenuItem>
            ) : null}
            {onOpenShortcuts ? (
              <MenuItem kbd={SHORTCUTS_KBD} onClick={run(onOpenShortcuts)}>
                Keyboard shortcuts
              </MenuItem>
            ) : null}
          </MenuGroup>
        ) : null}
      </Menu>
    </Popover>
  );
};

export default SiteMenu;

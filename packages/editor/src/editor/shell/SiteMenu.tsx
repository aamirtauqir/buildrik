/**
 * Site menu — the ⋯ overflow in the topbar. Board 4418:126034 (C5 G1-016,
 * G1-020, G1-025; owner rule 2026-09-24: anything visual, the board wins).
 *
 *   THIS SITE          Site settings ⌘, · Export site… · Duplicate site ·
 *                      Issues · Activity log · Command palette ⌘K ·
 *                      Enter view mode · Keyboard shortcuts · Share preview link
 *   COLLABORATE        Start collaboration (PLANNED while the flag is off) ·
 *                      Unpublish site…
 *   LEAVES THE EDITOR  View live site ↗ · Invite teammates ↗ · Account settings ↗
 *
 * The panel doors that used to live here (Version history, Review, Publish
 * panel, Publish history, Templates, Components, Brand) are not on the board:
 * each keeps its own door — rail, topbar CTA/chip, save pill, ⌘K and its
 * chord. Plugins and Ask AI are gone (owner, G1-020 / G1-025).
 *
 * Three rows are NOT on the board and stay anyway (owner rule 2026-09-24:
 * parity never silently removes a capability; each is logged in the
 * designer notes): Getting started (the only way to replay the tour),
 * Copy live URL, and Site health ↗ (the dashboard's health score).
 *
 * In view mode the menu keeps only the way back out — the mode is for looking
 * at the draft, not for administering the site from it.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconButton, Menu, MenuGroup, MenuItem, MenuLabel, Popover, SiteMenuIcon } from "@/editor/chrome-ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { PreviewShareModal } from "./PreviewShareModal";

export interface SiteMenuProps {
  onOpenSiteSettings?: () => void;
  onExportCode?: () => void;
  /** Duplicate this site (`sites.duplicate`); the container reports the result. */
  onDuplicateSite?: () => void;
  /** The Issues panel (C3: the topbar chip that opened it is gone). */
  onOpenIssues?: () => void;
  /** The row's tooltip — the issue count sentence (`formatIssueSummary`). */
  issuesTitle?: string;
  /** History · Activity, in the editor (B6, G1-019). */
  onOpenActivity?: () => void;
  onOpenCommandPalette?: () => void;
  readOnlyView?: boolean;
  /** View mode is a full-page navigation, so the container owns it — it must
   *  pass through the dirty-exit guard (F1) like every other exit. */
  onToggleReadOnlyView?: () => void;
  onOpenShortcuts?: () => void;
  /** The site the share link is minted for. */
  siteId?: string | null;
  /** Collaboration is flag-gated. Absent while the flag is off (the row is
   *  drawn PLANNED, disabled) and while a session is already running. */
  onStartCollaboration?: () => void;
  /** The collab flag — decides between the live row and the PLANNED one. */
  collabEnabled?: boolean;
  /** Take the site down; offered while a published URL exists and the role
   *  allows it. The Publish panel hosts the typed confirm. */
  onUnpublish?: () => void;
  /** Live URL once the site has been published. */
  publishedUrl?: string | null;
  /** Replays the onboarding tour — off-board, kept (see the header). */
  onReplayOnboarding?: () => void;
  /** Copies the live URL — off-board, kept (see the header). */
  onCopyLiveUrl?: () => void;
}

function openDashboard(path: string) {
  window.open(`${DASHBOARD_URL}${path}`, "_blank", "noopener,noreferrer");
}

/**
 * F6/T9: ⌘, and ⌘/ belong to the browser on macOS; the handlers accept ctrl OR
 * meta everywhere, so the hint shows the chord that actually reaches the page.
 */
const IS_MAC = typeof navigator !== "undefined" && /Mac|iP(hone|ad|od)/.test(navigator.platform);
const SETTINGS_KBD = IS_MAC ? "⌃," : "Ctrl ,";
const PALETTE_KBD = IS_MAC ? "⌘K" : "Ctrl K";
const SHORTCUTS_KBD = IS_MAC ? "⌘/" : "Ctrl /";

const PLANNED = "tw:ml-auto tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-[0.04em] tw:text-[var(--bk-ink-muted)]";

export const SiteMenu: React.FC<SiteMenuProps> = ({
  onReplayOnboarding,
  onCopyLiveUrl,
  onOpenSiteSettings,
  onExportCode,
  onDuplicateSite,
  onOpenIssues,
  issuesTitle,
  onOpenActivity,
  onOpenCommandPalette,
  readOnlyView = false,
  onToggleReadOnlyView,
  onOpenShortcuts,
  siteId,
  onStartCollaboration,
  collabEnabled = false,
  onUnpublish,
  publishedUrl,
}) => {
  const [open, setOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const run = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };

  return (
    <>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        placement="bottom-end"
        label="Site menu"
        trigger={
          <IconButton
            label="Site menu"
            /* Board 4418:123573: the ⋯ is 28, not the 32 icon default. */
            className="tw:h-7 tw:w-7"
            data-testid="site-menu-trigger"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <SiteMenuIcon />
          </IconButton>
        }
      >
        <Menu label="Site menu" data-testid="site-menu">
          {readOnlyView ? (
            onToggleReadOnlyView ? (
              <MenuGroup>
                <MenuItem onClick={run(onToggleReadOnlyView)}>Exit view mode</MenuItem>
              </MenuGroup>
            ) : null
          ) : (
            <>
              <MenuGroup>
                <MenuLabel>This site</MenuLabel>
                {onOpenSiteSettings ? (
                  <MenuItem kbd={SETTINGS_KBD} onClick={run(onOpenSiteSettings)} data-testid="site-menu-site-settings">
                    Site settings
                  </MenuItem>
                ) : null}
                {onExportCode ? (
                  <MenuItem onClick={run(onExportCode)} data-testid="site-menu-export-code">
                    Export site…
                  </MenuItem>
                ) : null}
                {onDuplicateSite ? (
                  <MenuItem onClick={run(onDuplicateSite)} data-testid="site-menu-duplicate">
                    Duplicate site
                  </MenuItem>
                ) : null}
                {onOpenIssues ? (
                  <MenuItem onClick={run(onOpenIssues)} title={issuesTitle} data-testid="site-menu-issues">
                    Issues
                  </MenuItem>
                ) : null}
                {onOpenActivity ? (
                  <MenuItem onClick={run(onOpenActivity)} data-testid="site-menu-activity-log">
                    Activity log
                  </MenuItem>
                ) : null}
                {onOpenCommandPalette ? (
                  <MenuItem kbd={PALETTE_KBD} onClick={run(onOpenCommandPalette)} data-testid="site-menu-command-palette">
                    Command palette
                  </MenuItem>
                ) : null}
                {onToggleReadOnlyView ? (
                  <MenuItem onClick={run(onToggleReadOnlyView)}>Enter view mode</MenuItem>
                ) : null}
                {onOpenShortcuts ? (
                  <MenuItem kbd={SHORTCUTS_KBD} onClick={run(onOpenShortcuts)} data-testid="site-menu-shortcuts">
                    Keyboard shortcuts
                  </MenuItem>
                ) : null}
                {siteId ? (
                  <MenuItem onClick={run(() => setShareOpen(true))} data-testid="site-menu-share">
                    Share preview link
                  </MenuItem>
                ) : null}
                {publishedUrl && onCopyLiveUrl ? (
                  <MenuItem onClick={run(onCopyLiveUrl)} data-testid="site-menu-copy-live-url">
                    Copy live URL
                  </MenuItem>
                ) : null}
                {onReplayOnboarding ? (
                  <MenuItem onClick={run(onReplayOnboarding)} data-testid="site-menu-getting-started">
                    Getting started
                  </MenuItem>
                ) : null}
              </MenuGroup>

              <MenuGroup>
                <MenuLabel>Collaborate</MenuLabel>
                {onStartCollaboration ? (
                  <MenuItem onClick={run(onStartCollaboration)} data-testid="site-menu-collab">
                    Start collaboration
                  </MenuItem>
                ) : !collabEnabled ? (
                  <MenuItem disabled data-testid="site-menu-collab">
                    <span className="tw:flex tw:w-full tw:items-center">
                      Start collaboration
                      <span className={PLANNED}>Planned</span>
                    </span>
                  </MenuItem>
                ) : null}
                {onUnpublish && publishedUrl ? (
                  <MenuItem danger onClick={run(onUnpublish)} data-testid="site-menu-unpublish">
                    Unpublish site…
                  </MenuItem>
                ) : null}
              </MenuGroup>

              <MenuGroup>
                <MenuLabel>Leaves the editor</MenuLabel>
                {publishedUrl ? (
                  <MenuItem onClick={run(() => window.open(publishedUrl, "_blank", "noopener,noreferrer"))}>
                    View live site ↗
                  </MenuItem>
                ) : null}
                {siteId ? (
                  <MenuItem
                    onClick={run(() => openDashboard(`/dashboard/sites/${siteId}#site-health`))}
                    data-testid="site-menu-site-health"
                  >
                    Site health ↗
                  </MenuItem>
                ) : null}
                <MenuItem onClick={run(() => openDashboard("/dashboard/settings/team"))}>Invite teammates ↗</MenuItem>
                <MenuItem onClick={run(() => openDashboard("/dashboard/settings/account"))}>Account settings ↗</MenuItem>
              </MenuGroup>
            </>
          )}
        </Menu>
      </Popover>
      {siteId && shareOpen ? <PreviewShareModal open={shareOpen} onOpenChange={setShareOpen} siteId={siteId} /> : null}
    </>
  );
};

export default SiteMenu;

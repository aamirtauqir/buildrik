/**
 * Site menu — the ⋯ overflow in the topbar. Figma `popover/site-menu` 642:3664.
 *
 * The first three groups are the design, item for item, in its order: the four
 * site-level destinations, the three library/help entries, then the way out.
 *
 * The fourth group is not in the design. Each item in it is the only way to
 * reach a feature the product already ships, so deleting them to match the
 * mock would have removed working surfaces from the UI rather than redesigning
 * them. They are grouped and labelled apart so the designed set stays the
 * primary one, and so the gap is visible in the product instead of buried in a
 * commit message. Every one of them is a Figma to-do, not a code to-do.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconButton, Menu, MenuGroup, MenuItem, MenuLabel, Popover, SiteMenuIcon } from "@/editor/ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

export interface SiteMenuProps {
  // ── Figma 642:3664, in order ──────────────────────────────────────────────
  onOpenSiteSettings?: () => void;
  onOpenHistory?: () => void;
  onOpenPublishHistory?: () => void;
  onExportCode?: () => void;
  onOpenTemplates?: () => void;
  onOpenComponents?: () => void;
  onOpenShortcuts?: () => void;
  onExit: () => void;

  // ── Not in the design; kept because nothing else reaches them ─────────────
  /**
   * Shell state 7 — the in-shell preview overlay. ⌘P is a different feature: it
   * flips `composer.setPreviewMode()` on the canvas. This entry is the only way
   * to reach the overlay, so it moved here rather than disappearing with the
   * topbar button.
   */
  onPreview?: () => void;
  /** Blocking + advisory issues on this page. */
  issueCount?: number;
  onOpenIssues?: () => void;
  /** Only reachable from the bar in the legacy four-tool rail. */
  onAskAI?: () => void;
  /** Collaboration is flag-gated; when it is on, the session has to be startable. */
  onStartCollaboration?: () => void;
  onOpenDesignSystem?: () => void;
  onOpenPlugins?: () => void;
  /** Live URL once the site has been published. */
  publishedUrl?: string | null;
  /** Copying can fail (no clipboard on insecure origins), so the container
   *  owns it — this menu has no way to tell the user it didn't work. */
  onCopyLiveUrl?: () => void;
  clientView?: boolean;
  /** Client-view toggle is a full-page navigation, so the container owns it —
   *  it must pass through the dirty-exit guard (F1) like every other exit. */
  onToggleClientView?: () => void;
}

function openDashboard(path: string) {
  window.open(`${DASHBOARD_URL}${path}`, "_blank", "noopener,noreferrer");
}

export const SiteMenu: React.FC<SiteMenuProps> = ({
  onOpenSiteSettings,
  onOpenHistory,
  onOpenPublishHistory,
  onExportCode,
  onOpenTemplates,
  onOpenComponents,
  onOpenShortcuts,
  onExit,
  onPreview,
  issueCount = 0,
  onOpenIssues,
  onAskAI,
  onStartCollaboration,
  onOpenDesignSystem,
  onOpenPlugins,
  publishedUrl,
  onCopyLiveUrl,
  clientView = false,
  onToggleClientView,
}) => {
  const [open, setOpen] = React.useState(false);
  const run = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label="Site menu"
      trigger={
        <IconButton label="Site menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <SiteMenuIcon />
        </IconButton>
      }
    >
      <Menu label="Site menu">
        <MenuGroup>
          {onOpenSiteSettings ? (
            <MenuItem kbd="⌘," onClick={run(onOpenSiteSettings)}>
              Site settings
            </MenuItem>
          ) : null}
          {onOpenHistory ? (
            <MenuItem kbd="⌘H" onClick={run(onOpenHistory)}>
              Version history
            </MenuItem>
          ) : null}
          {onOpenPublishHistory ? (
            <MenuItem onClick={run(onOpenPublishHistory)}>Publish history</MenuItem>
          ) : null}
          {onExportCode ? <MenuItem onClick={run(onExportCode)}>Export code</MenuItem> : null}
        </MenuGroup>

        <MenuGroup>
          {/* The design labels this "T", which is also its own device-switcher
              chip (W · D · T · M) on the canvas toolbar. Showing a shortcut the
              product cannot honour is worse than showing none, so it is omitted
              until Figma resolves the collision. */}
          {onOpenTemplates ? <MenuItem onClick={run(onOpenTemplates)}>Templates</MenuItem> : null}
          {onOpenComponents ? (
            <MenuItem kbd="⇧A" onClick={run(onOpenComponents)}>
              Components
            </MenuItem>
          ) : null}
          {onOpenShortcuts ? (
            <MenuItem kbd="?" onClick={run(onOpenShortcuts)}>
              Keyboard shortcuts
            </MenuItem>
          ) : null}
        </MenuGroup>

        <MenuGroup>
          <MenuItem onClick={run(onExit)}>Exit to dashboard</MenuItem>
        </MenuGroup>

        <MenuGroup>
          <MenuLabel>More</MenuLabel>
          {onPreview ? <MenuItem onClick={run(onPreview)}>Preview site</MenuItem> : null}
          {onOpenIssues ? (
            <MenuItem onClick={run(onOpenIssues)}>
              {issueCount > 0 ? `Issues (${issueCount})` : "Issues"}
            </MenuItem>
          ) : null}
          {onOpenDesignSystem ? <MenuItem onClick={run(onOpenDesignSystem)}>Design system</MenuItem> : null}
          {onOpenPlugins ? <MenuItem onClick={run(onOpenPlugins)}>Plugins</MenuItem> : null}
          {publishedUrl ? (
            <MenuItem onClick={run(() => window.open(publishedUrl, "_blank", "noopener,noreferrer"))}>
              View live site
            </MenuItem>
          ) : null}
          {publishedUrl && onCopyLiveUrl ? <MenuItem onClick={run(onCopyLiveUrl)}>Copy live URL</MenuItem> : null}
          {onToggleClientView ? (
            <MenuItem onClick={run(onToggleClientView)}>
              {clientView ? "Exit client view" : "Preview as client"}
            </MenuItem>
          ) : null}
          {onAskAI ? <MenuItem onClick={run(onAskAI)}>Ask AI</MenuItem> : null}
          {onStartCollaboration ? (
            <MenuItem onClick={run(onStartCollaboration)}>Start collaboration</MenuItem>
          ) : null}
          <MenuItem onClick={run(() => openDashboard("/dashboard/settings/team"))}>Invite teammates</MenuItem>
          <MenuItem onClick={run(() => openDashboard("/dashboard/settings/account"))}>Account settings</MenuItem>
        </MenuGroup>
      </Menu>
    </Popover>
  );
};

export default SiteMenu;

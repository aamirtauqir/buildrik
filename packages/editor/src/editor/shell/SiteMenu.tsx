/**
 * Site menu — the ⋯ overflow in the topbar.
 *
 * Figma: successor to `popover/site-menu` 642:3664 — regrouped per the topbar
 * redesign plan (docs/plans/2026-07-30-topbar-complete-redesign.md §3; node
 * update pending T1). Five named groups, no "More" dump:
 *
 *   Site       — settings · version history · publish history · export code
 *   Build      — templates · components · design system · plugins
 *   Share      — open client view · view live site · copy live URL
 *   Workspace  — invite · account · start collaboration (flag-gated)
 *   (footer)   — keyboard shortcuts
 *
 * Moved OUT to the bar's tool cluster (plan §2): Preview, Comments, Issues.
 * Removed (D8): "Exit to dashboard" — the bar's ‹ Exit is always visible; a
 * second door in the overflow was dead weight. Renamed (D9): "Preview as
 * client" → "Open client view".
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
import { IconButton, Menu, MenuGroup, MenuItem, MenuLabel, Popover, SiteMenuIcon } from "@/editor/ui";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

export interface SiteMenuProps {
  // ── Site ──────────────────────────────────────────────────────────────────
  onOpenSiteSettings?: () => void;
  onOpenHistory?: () => void;
  onOpenPublishHistory?: () => void;
  onExportCode?: () => void;
  // ── Build ─────────────────────────────────────────────────────────────────
  onOpenTemplates?: () => void;
  onOpenComponents?: () => void;
  onOpenDesignSystem?: () => void;
  onOpenPlugins?: () => void;
  // ── Share ─────────────────────────────────────────────────────────────────
  clientView?: boolean;
  /** Client-view toggle is a full-page navigation, so the container owns it —
   *  it must pass through the dirty-exit guard (F1) like every other exit. */
  onToggleClientView?: () => void;
  /** Live URL once the site has been published. */
  publishedUrl?: string | null;
  /** Copying can fail (no clipboard on insecure origins), so the container
   *  owns it — this menu has no way to tell the user it didn't work. */
  onCopyLiveUrl?: () => void;
  // ── Workspace ─────────────────────────────────────────────────────────────
  /** Collaboration is flag-gated; when it is on, the session has to be startable. */
  onStartCollaboration?: () => void;
  /** Legacy four-tool rail only — the rail's ✨ AI tab is the canonical home. */
  onAskAI?: () => void;
  // ── Footer ────────────────────────────────────────────────────────────────
  /** Open Keyboard Shortcuts panel (`?`) */
  onOpenShortcuts?: () => void;
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

export const SiteMenu: React.FC<SiteMenuProps> = ({
  onOpenSiteSettings,
  onOpenHistory,
  onOpenPublishHistory,
  onExportCode,
  onOpenTemplates,
  onOpenComponents,
  onOpenDesignSystem,
  onOpenPlugins,
  clientView = false,
  onToggleClientView,
  publishedUrl,
  onCopyLiveUrl,
  onStartCollaboration,
  onAskAI,
  onOpenShortcuts,
}) => {
  const [open, setOpen] = React.useState(false);
  const run = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };

  const hasSite = Boolean(onOpenSiteSettings || onOpenHistory || onOpenPublishHistory || onExportCode);
  const hasBuild = Boolean(onOpenTemplates || onOpenComponents || onOpenDesignSystem || onOpenPlugins);
  const hasShare = Boolean(onToggleClientView || publishedUrl);

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
              <MenuItem kbd="⌘," onClick={run(onOpenSiteSettings)}>
                Site settings
              </MenuItem>
            ) : null}
            {onOpenHistory ? (
              <MenuItem kbd={HISTORY_KBD} onClick={run(onOpenHistory)}>
                Version history
              </MenuItem>
            ) : null}
            {onOpenPublishHistory ? (
              <MenuItem onClick={run(onOpenPublishHistory)}>Publish history</MenuItem>
            ) : null}
            {onExportCode ? <MenuItem onClick={run(onExportCode)}>Export code</MenuItem> : null}
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
            {onOpenDesignSystem ? <MenuItem onClick={run(onOpenDesignSystem)}>Design system</MenuItem> : null}
            {onOpenPlugins ? <MenuItem onClick={run(onOpenPlugins)}>Plugins</MenuItem> : null}
          </MenuGroup>
        )}

        {hasShare && (
          <MenuGroup>
            <MenuLabel>Share</MenuLabel>
            {onToggleClientView ? (
              <MenuItem onClick={run(onToggleClientView)}>
                {clientView ? "Exit client view" : "Open client view"}
              </MenuItem>
            ) : null}
            {publishedUrl ? (
              <MenuItem onClick={run(() => window.open(publishedUrl, "_blank", "noopener,noreferrer"))}>
                View live site
              </MenuItem>
            ) : null}
            {publishedUrl && onCopyLiveUrl ? <MenuItem onClick={run(onCopyLiveUrl)}>Copy live URL</MenuItem> : null}
          </MenuGroup>
        )}

        <MenuGroup>
          <MenuLabel>Workspace</MenuLabel>
          <MenuItem onClick={run(() => openDashboard("/dashboard/settings/team"))}>Invite teammates</MenuItem>
          <MenuItem onClick={run(() => openDashboard("/dashboard/settings/account"))}>Account settings</MenuItem>
          {onStartCollaboration ? (
            <MenuItem onClick={run(onStartCollaboration)}>Start collaboration</MenuItem>
          ) : null}
          {onAskAI ? <MenuItem onClick={run(onAskAI)}>Ask AI</MenuItem> : null}
        </MenuGroup>

        {onOpenShortcuts ? (
          <MenuGroup>
            <MenuItem kbd="?" onClick={run(onOpenShortcuts)}>
              Keyboard shortcuts
            </MenuItem>
          </MenuGroup>
        ) : null}
      </Menu>
    </Popover>
  );
};

export default SiteMenu;

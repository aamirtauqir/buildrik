import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * SettingsTab — prototype-aligned shell.
 *
 * Layout: 140px snav + 1fr pane. Central dirty counter + sticky savebar.
 * Branding renders a placeholder linking to the Palette tab (no embedded
 * DesignSystemTab chrome).
 *
 * Spec: docs/reference/left-panel/tab-settings.html
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelShell } from "@shared/ui/panel";
import { usePanelNavigation } from "../../shared/usePanelNavigation";
import {
  type SettingsTabProps,
  type PlanTier,
  SCREEN_PLAN_REQUIREMENTS,
  SiteSettingsIcon,
  IntegrationsIcon,
  TourIcon,
  SeoIcon,
  BillingIcon,
  DesignSystemIcon,
  SiteSettingsScreen,
  LockedScreen,
  AnalyticsScreen,
  AdvancedScreen,
  SeoScreen,
  IntegrationsHub,
  ComingSoonScreen,
  RedirectsScreen,
  SettingsNavGuard,
} from "./index";
import "./settings.css";

// ─── Nav definition ──────────────────────────────────────────────────────────
//
// A1 day-1: nav reshuffle to 10 in-tab sections + 8 workspace deep-links,
// per locked prototype at:
//   ~/.gstack/projects/aamirtauqir-buildrik/designs/settings-industrial-20260507/prototype.html
//
// In-tab sections live in 3 groups (SITE / DISTRIBUTION / PLUMBING). The 4th
// group (WORKSPACE) is deep-link only — clicking opens the dashboard URL.
//
// Existing screens reused: General/Branding/SEO/Analytics/Custom code (Advanced)/Integrations.
// Stubs: Localization/Redirects/Headers/Forms — render ComingSoonScreen until Phase B ships.

type InTabNavId =
  | "general" | "branding" | "seo"
  | "analytics" | "localization"
  | "custom-code" | "redirects" | "headers" | "forms" | "integrations";

type NavGroupId = "site" | "distribution" | "plumbing";

interface NavDef {
  id: InTabNavId;
  title: string;
  subtitle?: string;
  group: NavGroupId;
  icon: React.FC;
}

const NAV: NavDef[] = [
  // SITE
  { id: "general", title: "General", subtitle: "Project metadata", group: "site", icon: SiteSettingsIcon },
  { id: "branding", title: "Branding", subtitle: "Colors, type, favicon", group: "site", icon: DesignSystemIcon },
  { id: "seo", title: "SEO", subtitle: "Search & social preview", group: "site", icon: SeoIcon },
  // DISTRIBUTION
  { id: "analytics", title: "Analytics", subtitle: "GA4, Plausible, PostHog, Pixel", group: "distribution", icon: IntegrationsIcon },
  { id: "localization", title: "Localization", subtitle: "Locale claim and preview", group: "distribution", icon: IntegrationsIcon },
  // PLUMBING
  { id: "custom-code", title: "Custom code", subtitle: "Head, body, CSS injections", group: "plumbing", icon: IntegrationsIcon },
  { id: "redirects", title: "Redirects", subtitle: "301 / 302 + 404 suggester", group: "plumbing", icon: IntegrationsIcon },
  { id: "headers", title: "Headers", subtitle: "CSP, HSTS, security policy", group: "plumbing", icon: IntegrationsIcon },
  { id: "forms", title: "Forms", subtitle: "Submissions inbox + config", group: "plumbing", icon: IntegrationsIcon },
  { id: "integrations", title: "Integrations", subtitle: "Third-party OAuth", group: "plumbing", icon: IntegrationsIcon },
];

const GROUP_LABELS: Record<NavGroupId, string> = {
  site: "SITE",
  distribution: "DISTRIBUTION",
  plumbing: "PLUMBING",
};

// Workspace deep-links — open dashboard URLs in new tab. Not in-tab screens.
const DASHBOARD_URL = (import.meta as { env?: { VITE_DASHBOARD_URL?: string } }).env?.VITE_DASHBOARD_URL || "http://localhost:3000";

interface WorkspaceLink {
  id: string;
  title: string;
  /** path appended to ${DASHBOARD_URL}/sites/${siteId}/ — or workspace-scoped if siteId omitted */
  path: string;
  scope: "site" | "workspace";
}

const WORKSPACE_LINKS: WorkspaceLink[] = [
  { id: "domains", title: "Domains", path: "domains", scope: "site" },
  { id: "members", title: "Members", path: "/workspace/members", scope: "workspace" },
  { id: "billing", title: "Billing", path: "/workspace/billing", scope: "workspace" },
  { id: "api-tokens", title: "API tokens", path: "/workspace/api-tokens", scope: "workspace" },
  { id: "webhooks", title: "Webhooks", path: "/workspace/webhooks", scope: "workspace" },
  { id: "environments", title: "Environments", path: "/workspace/environments", scope: "workspace" },
  { id: "audit-log", title: "Audit log", path: "/workspace/audit-log", scope: "workspace" },
  { id: "versions", title: "Versions", path: "versions", scope: "site" },
];

function buildWorkspaceUrl(link: WorkspaceLink, siteId: string | null): string {
  if (link.scope === "workspace") return `${DASHBOARD_URL}${link.path}`;
  if (!siteId) return `${DASHBOARD_URL}/dashboard`; // graceful fallback when siteId unknown
  return `${DASHBOARD_URL}/dashboard/sites/${siteId}/${link.path}`;
}

const SETTINGS_SCREENS = NAV.map(({ id, title }) => ({ id, title }));

// ─── Branding placeholder (V1 — replaces DesignSystemTab delegate) ───────────

interface BrandingPlaceholderProps {
  onOpenPalette?: () => void;
}
const BrandingPlaceholder: React.FC<BrandingPlaceholderProps> = ({ onOpenPalette }) => (
  <div className="bd-set-section">
    <h3 className="bd-set-section-h">Design tokens</h3>
    <div className="bd-set-section-d">
      Colors, typography, spacing, and other brand tokens live in the Palette tab.
    </div>
    <div className="bd-set-branding-placeholder">
      <div className="bd-set-branding-placeholder-t">Open Palette to edit tokens</div>
      <div className="bd-set-branding-placeholder-d">
        Palette owns the design system for this project. Changes there apply to every page.
      </div>
      <Button
        type="button"
        className="bd-set-btn pri"
        onClick={onOpenPalette}
        disabled={!onOpenPalette}
      >
        Open Palette →
      </Button>
    </div>
  </div>
);

// ─── Module-scope helpers ─────────────────────────────────────────────────────

function isScreenLocked(screenId: string, userPlan: PlanTier): boolean {
  const required = SCREEN_PLAN_REQUIREMENTS[screenId];
  if (!required) return false;
  return required === "pro" ? userPlan === "starter" : userPlan !== "enterprise";
}

// ─── Component ───────────────────────────────────────────────────────────────

export const SettingsTab: React.FC<
  SettingsTabProps & {
    /**
     * Optional: switch to the Palette (`design`) tab. When absent, the Branding
     * section's "Open Palette →" button renders disabled. TODO: thread from
     * FullPageRouter once a tab-switch handle exists there.
     */
    onOpenDesignTab?: () => void;
  }
> = ({
  composer,
  isPinned: _isPinned,
  onPinToggle: _onPinToggle,
  onHelpClick,
  onClose,
  userPlan = "starter",
  onReplayTour,
  projectId,
  onDirtyChange,
  onOpenDesignTab,
}) => {
  const { currentScreen, navigateTo } = usePanelNavigation({
    storageKey: `settings-panel${projectId ? `-${projectId}` : ""}`,
    screens: SETTINGS_SCREENS,
    defaultScreen: "general",
  });

  const [screenIsDirty, setScreenIsDirty] = React.useState(false);
  const [dirtyCount, setDirtyCount] = React.useState(0);
  const [guardOpen, setGuardOpen] = React.useState(false);
  const pendingNavRef = React.useRef<InTabNavId | null>(null);
  const [resetKey, setResetKey] = React.useState(0);

  React.useEffect(() => {
    setScreenIsDirty(false);
    setDirtyCount(0);
    setGuardOpen(false);
  }, [currentScreen]);

  React.useEffect(() => {
    onDirtyChange?.(screenIsDirty);
  }, [screenIsDirty, onDirtyChange]);

  const handleScreenDirty = React.useCallback((dirty: boolean) => {
    setScreenIsDirty(dirty);
    setDirtyCount(dirty ? 1 : 0);
  }, []);

  const handleNav = React.useCallback(
    (nextId: InTabNavId) => {
      if (nextId === currentScreen) return;
      if (screenIsDirty) {
        pendingNavRef.current = nextId;
        setGuardOpen(true);
        return;
      }
      navigateTo(nextId);
    },
    [currentScreen, screenIsDirty, navigateTo]
  );

  const handleDiscard = React.useCallback(() => {
    setResetKey((k) => k + 1);
    setScreenIsDirty(false);
    setDirtyCount(0);
  }, []);

  const handleSave = React.useCallback(() => {
    if (!composer) return;
    const maybePromise = composer.saveProject?.();
    if (!maybePromise) {
      setScreenIsDirty(false);
      setDirtyCount(0);
      return;
    }
    maybePromise
      .then(() => {
        setScreenIsDirty(false);
        setDirtyCount(0);
      })
      .catch((err) => {
        console.error("[settings] save failed", err);
        // Leave dirty state so savebar stays visible
      });
  }, [composer]);

  const current = NAV.find((n) => n.id === currentScreen) ?? NAV[0];

  const renderContent = (): React.ReactNode => {
    if (isScreenLocked(currentScreen, userPlan)) {
      const requiredPlan = SCREEN_PLAN_REQUIREMENTS[currentScreen];
      return <LockedScreen variant={requiredPlan} />;
    }
    switch (currentScreen) {
      case "general":
        return <SiteSettingsScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "branding":
        return <BrandingPlaceholder onOpenPalette={onOpenDesignTab} />;
      case "seo":
        return <SeoScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "analytics":
        return <AnalyticsScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "custom-code":
        return <AdvancedScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "integrations":
        return <IntegrationsHub composer={composer} onDirtyChange={handleScreenDirty} />;
      // A1 day-3 partial: Redirects is real; Localization/Headers/Forms still stubs.
      case "localization":
        return <ComingSoonScreen title="Localization" phase="Phase B" description="Locale claim with hierarchical fallback (e.g. fr-FR → fr → site default) and per-locale preview switcher." />;
      case "redirects":
        return <RedirectsScreen projectId={projectId} onDirtyChange={handleScreenDirty} />;
      case "headers":
        return <ComingSoonScreen title="Headers / Security" phase="Phase B" description="CSP, HSTS, X-Frame-Options, password gate config. Headers applied at published-site middleware layer." />;
      case "forms":
        return <ComingSoonScreen title="Forms" phase="Phase B" description="Form submissions inbox with cursor pagination, spam scoring, bulk actions, mail handoff for replies." />;
      default:
        return null;
    }
  };

  const renderRow = (n: NavDef) => {
    const active = currentScreen === n.id;
    const locked = isScreenLocked(n.id, userPlan);
    const Icon = n.icon;
    return (
      <Button
        key={n.id}
        type="button"
        onClick={() => handleNav(n.id)}
        className={`bd-set-snav-row${active ? " on" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        <span className="bd-set-snav-icon">
          <Icon />
        </span>
        <span className="bd-set-snav-label">{n.title}</span>
        {locked ? <span className="bd-set-snav-badge">Pro</span> : null}
      </Button>
    );
  };

  // Workspace deep-links: open dashboard URL in new tab.
  // Only renders when projectId is known (siteId equivalent) for site-scoped links.
  const renderWorkspaceLink = (link: WorkspaceLink) => (
    <a
      key={link.id}
      href={buildWorkspaceUrl(link, projectId ?? null)}
      target="_blank"
      rel="noopener noreferrer"
      className="bd-set-snav-row bd-set-snav-row-external"
    >
      <span className="bd-set-snav-icon" aria-hidden>↗</span>
      <span className="bd-set-snav-label">{link.title}</span>
      <span className="bd-set-snav-arrow" aria-hidden>open</span>
    </a>
  );

  // Group rows by group id for rendering, preserving NAV array order within each group.
  const navByGroup: Record<NavGroupId, NavDef[]> = { site: [], distribution: [], plumbing: [] };
  NAV.forEach((n) => navByGroup[n.group].push(n));

  return (
    <PanelShell>
      <div className="bd-set-panel-h">
        <div className="bd-set-panel-h-ttl">
          <h2>{current.title}</h2>
          {current.subtitle ? <span className="bd-set-panel-sub">{current.subtitle}</span> : null}
        </div>
        <div className="bd-set-panel-acts">
          {onHelpClick ? (
            <Button
              type="button"
              className="bd-set-icon-btn"
              onClick={onHelpClick}
              aria-label="Help"
              title="Help"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 17v-.5 M12 8a2 2 0 012 2c0 2-2 2-2 3.5" />
              </svg>
            </Button>
          ) : null}
          {onClose ? (
            <Button
              type="button"
              className="bd-set-icon-btn"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </Button>
          ) : null}
        </div>
      </div>
      <PanelShell.Content noScroll>
        <div className="bd-set-root">
          <nav className="bd-set-snav" aria-label="Settings sections">
            <div className="bd-set-snav-h">Settings</div>
            <div className="bd-set-snav-list">
              {(Object.keys(navByGroup) as NavGroupId[]).map((groupId) => (
                <React.Fragment key={groupId}>
                  <div className="bd-set-snav-group">{GROUP_LABELS[groupId]}</div>
                  {navByGroup[groupId].map(renderRow)}
                </React.Fragment>
              ))}
              <div className="bd-set-snav-group">
                WORKSPACE <span className="bd-set-snav-group-hint">opens dashboard ↗</span>
              </div>
              {WORKSPACE_LINKS.map(renderWorkspaceLink)}
              {onReplayTour ? (
                <Button
                  type="button"
                  onClick={onReplayTour}
                  className="bd-set-snav-row bd-set-snav-row-sep"
                >
                  <span className="bd-set-snav-icon">
                    <TourIcon />
                  </span>
                  <span className="bd-set-snav-label">Tour</span>
                </Button>
              ) : null}
            </div>
          </nav>
          <div className="bd-set-pane">
            <div className="bd-set-pane-body" key={resetKey}>
              {renderContent()}
            </div>
            <div
              className={`bd-set-savebar${screenIsDirty ? " on" : ""}`}
              role="region"
              aria-label="Unsaved changes"
              aria-hidden={!screenIsDirty}
            >
              <span className="bd-set-savebar-note">
                <span>{dirtyCount} unsaved</span>
              </span>
              <div className="bd-set-savebar-actions">
                <Button type="button" className="bd-set-btn sec" onClick={handleDiscard}>
                  Discard
                </Button>
                <Button type="button" className="bd-set-btn pri" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PanelShell.Content>
      <SettingsNavGuard
        isOpen={guardOpen}
        onDiscard={() => {
          const next = pendingNavRef.current;
          pendingNavRef.current = null;
          setGuardOpen(false);
          setScreenIsDirty(false);
          setDirtyCount(0);
          if (next) navigateTo(next);
        }}
        onCancel={() => {
          pendingNavRef.current = null;
          setGuardOpen(false);
        }}
      />
    </PanelShell>
  );
};

export type { SettingsTabProps } from "./index";
export default SettingsTab;

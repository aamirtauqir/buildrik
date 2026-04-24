/**
 * SettingsTab — prototype-aligned shell.
 *
 * Layout: 140px snav + 1fr pane. Central dirty counter + sticky savebar.
 * Branding renders a placeholder linking to the Palette tab (no embedded
 * DesignSystemTab chrome).
 *
 * Spec: packages/editor/project/left-panel/tab-settings.html
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
  BillingScreen,
  SeoScreen,
  IntegrationsHub,
  PublishingHub,
  SettingsNavGuard,
} from "./index";
import { PublishingIcon } from "./icons";
import "./settings.css";

// ─── Nav definition ──────────────────────────────────────────────────────────

type NavId = "general" | "branding" | "seo" | "integrations" | "publishing" | "billing";

interface NavDef {
  id: NavId;
  title: string;
  subtitle?: string;
  icon: React.FC;
}

const NAV: NavDef[] = [
  { id: "general", title: "General", subtitle: "Project metadata", icon: SiteSettingsIcon },
  { id: "branding", title: "Branding", subtitle: "Colors, type, favicon", icon: DesignSystemIcon },
  { id: "seo", title: "SEO", subtitle: "Search & social preview", icon: SeoIcon },
  { id: "integrations", title: "Integrations", subtitle: "Analytics, plugins, custom code", icon: IntegrationsIcon },
  { id: "publishing", title: "Publishing", subtitle: "Domains, export, deploy", icon: PublishingIcon },
  { id: "billing", title: "Billing", subtitle: "Plan and usage", icon: BillingIcon },
];

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
      <button
        type="button"
        className="bd-set-btn pri"
        onClick={onOpenPalette}
        disabled={!onOpenPalette}
      >
        Open Palette →
      </button>
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
  const pendingNavRef = React.useRef<NavId | null>(null);
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
    (nextId: NavId) => {
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
      case "integrations":
        return <IntegrationsHub composer={composer} onDirtyChange={handleScreenDirty} />;
      case "publishing":
        return <PublishingHub composer={composer} />;
      case "billing":
        return <BillingScreen userPlan={userPlan} />;
      default:
        return null;
    }
  };

  const renderRow = (n: NavDef) => {
    const active = currentScreen === n.id;
    const locked = isScreenLocked(n.id, userPlan);
    const Icon = n.icon;
    return (
      <button
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
      </button>
    );
  };

  return (
    <PanelShell>
      <div className="bd-set-panel-h">
        <div className="bd-set-panel-h-ttl">
          <h2>{current.title}</h2>
          {current.subtitle ? <span className="bd-set-panel-sub">{current.subtitle}</span> : null}
        </div>
        <div className="bd-set-panel-acts">
          {onHelpClick ? (
            <button
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
            </button>
          ) : null}
          {onClose ? (
            <button
              type="button"
              className="bd-set-icon-btn"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4l16 16M20 4L4 20" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
      <PanelShell.Content noScroll>
        <div className="bd-set-root">
          <nav className="bd-set-snav" aria-label="Settings sections">
            <div className="bd-set-snav-h">Settings</div>
            <div className="bd-set-snav-list">
              {NAV.map(renderRow)}
              {onReplayTour ? (
                <button
                  type="button"
                  onClick={onReplayTour}
                  className="bd-set-snav-row bd-set-snav-row-sep"
                >
                  <span className="bd-set-snav-icon">
                    <TourIcon />
                  </span>
                  <span className="bd-set-snav-label">Tour</span>
                </button>
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
                <button type="button" className="bd-set-btn sec" onClick={handleDiscard}>
                  Discard
                </button>
                <button type="button" className="bd-set-btn pri" onClick={handleSave}>
                  Save
                </button>
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

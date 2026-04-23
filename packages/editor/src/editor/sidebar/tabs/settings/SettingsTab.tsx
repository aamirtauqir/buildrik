/**
 * SettingsTab — prototype-aligned shell.
 *
 * Layout: 140px snav + 1fr pane. Central dirty counter + sticky savebar.
 * Branding renders a placeholder linking to the Palette tab (no embedded
 * DesignSystemTab chrome).
 *
 * Spec: design-system/project/left-panel/tab-settings.html
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { PanelShell } from "@shared/ui/panel";
import { usePanelNavigation } from "../../shared/usePanelNavigation";
import {
  type SettingsTabProps,
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
  onOpenPalette: () => void;
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
      <button type="button" className="bd-set-btn pri" onClick={onOpenPalette}>
        Open Palette →
      </button>
    </div>
  </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

export const SettingsTab: React.FC<
  SettingsTabProps & { onOpenDesignTab?: () => void }
> = ({
  composer,
  isPinned,
  onPinToggle,
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
    setDirtyCount((c) => (dirty ? c + 1 : 0));
  }, []);

  const isScreenLocked = (screenId: string) => {
    const required = SCREEN_PLAN_REQUIREMENTS[screenId];
    if (!required) return false;
    if (required === "pro") return userPlan === "starter";
    if (required === "enterprise") return userPlan !== "enterprise";
    return false;
  };

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
    composer.saveProject?.().catch((err) => {
      console.error("[settings] save failed", err);
    });
    setScreenIsDirty(false);
    setDirtyCount(0);
  }, [composer]);

  const handleOpenPalette = React.useCallback(() => {
    onOpenDesignTab?.();
  }, [onOpenDesignTab]);

  const current = NAV.find((n) => n.id === currentScreen) ?? NAV[0];

  const renderContent = (): React.ReactNode => {
    if (isScreenLocked(currentScreen)) {
      const requiredPlan = SCREEN_PLAN_REQUIREMENTS[currentScreen];
      return <LockedScreen variant={requiredPlan} />;
    }
    switch (currentScreen) {
      case "general":
        return <SiteSettingsScreen composer={composer} onDirtyChange={handleScreenDirty} />;
      case "branding":
        return <BrandingPlaceholder onOpenPalette={handleOpenPalette} />;
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
    const locked = isScreenLocked(n.id);
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
      <PanelShell.Header
        title={current.title}
        subtitle={current.subtitle}
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
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
                  className="bd-set-snav-row"
                  style={{ marginTop: 8 }}
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
                <span>{dirtyCount || 1} unsaved</span>
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

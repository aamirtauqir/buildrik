/**
 * SettingsTab — Split view per new-design/project/left-panel/tab-settings.html
 * spec. Flat sub-nav (6 sections) · content pane · sticky save bar.
 *
 * Mapping of spec → backend screens:
 *   General      → SiteSettingsScreen
 *   Branding     → DesignSystemTab (colors/fonts/spacing tokens)
 *   SEO          → SeoScreen
 *   Integrations → IntegrationsHub (Analytics + Integrations + Advanced)
 *   Publishing   → PublishingHub (Domains + Export)
 *   Billing      → BillingScreen (retained as post-spec item)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
const DesignSystemScreen = React.lazy(() => import("../DesignSystemTab"));
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

// ── Nav definition ───────────────────────────────────────────────────────────

type NavId = "general" | "branding" | "seo" | "integrations" | "publishing" | "billing";

interface NavDef {
  id: NavId;
  title: string;
  subtitle?: string;
  icon: React.FC;
}

const NAV: NavDef[] = [
  { id: "general", title: "General", subtitle: "Name, favicon, language, social links", icon: SiteSettingsIcon },
  { id: "branding", title: "Branding", subtitle: "Colors, fonts, spacing tokens", icon: DesignSystemIcon },
  { id: "seo", title: "SEO", subtitle: "Meta tags, Open Graph, robots", icon: SeoIcon },
  { id: "integrations", title: "Integrations", subtitle: "Analytics, plugins, custom code", icon: IntegrationsIcon },
  { id: "publishing", title: "Publishing", subtitle: "Domains, export, deploy", icon: IntegrationsIcon },
  { id: "billing", title: "Billing", subtitle: "Plan and usage", icon: BillingIcon },
];

// usePanelNavigation expects `screens` entries in a particular shape.
const SETTINGS_SCREENS = NAV.map(({ id, title }) => ({ id, title }));

// ── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  root: {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    gridTemplateRows: "1fr",
    height: "100%",
    minHeight: 0,
    background: "var(--buildrick-bg-card)",
    position: "relative",
  },
  subnav: {
    borderRight: "1px solid var(--buildrick-border)",
    background: "var(--buildrick-bg-panel)",
    padding: "12px 10px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  subnavLabel: {
    fontFamily: "var(--buildrick-font-family)",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--buildrick-text-muted)",
    padding: "4px 8px 6px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 8px",
    borderRadius: 5,
    cursor: "pointer",
    fontFamily: "var(--buildrick-font-family)",
    fontSize: 11.5,
    fontWeight: 500,
    color: "var(--buildrick-text-secondary)",
    background: "transparent",
    border: "none",
    textAlign: "left",
    width: "100%",
  },
  rowActive: {
    background: "var(--buildrick-accent-tint)",
    color: "var(--buildrick-accent)",
    fontWeight: 600,
  },
  rowIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 14,
    height: 14,
    flexShrink: 0,
  },
  rowBadge: {
    marginLeft: "auto",
    fontFamily: "var(--buildrick-font-mono)",
    fontSize: 9,
    fontWeight: 500,
    color: "var(--buildrick-text-muted)",
    padding: "1px 5px",
    borderRadius: 3,
    background: "var(--buildrick-bg-subtle)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  pane: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0,
  },
  paneHeader: {
    padding: "18px 20px 14px",
    borderBottom: "1px solid var(--buildrick-border)",
    flexShrink: 0,
  },
  paneTitle: {
    fontFamily: "var(--buildrick-font-family)",
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: "var(--buildrick-text-heading, #0F172A)",
    margin: 0,
  },
  paneSubtitle: {
    fontFamily: "var(--buildrick-font-family)",
    fontSize: 11.5,
    fontWeight: 500,
    color: "var(--buildrick-text-secondary)",
    marginTop: 4,
  },
  paneBody: {
    flex: 1,
    overflow: "auto",
    minHeight: 0,
  },
  savebar: {
    position: "sticky",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "var(--buildrick-bg-panel)",
    borderTop: "1px solid var(--buildrick-border)",
    boxShadow: "0 -8px 24px -12px rgba(15, 23, 42, 0.08)",
    zIndex: 5,
  },
  savebarPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 8px",
    borderRadius: 9999,
    background: "var(--buildrick-warning-bg, rgba(217, 119, 6, 0.10))",
    color: "var(--buildrick-warning)",
    fontFamily: "var(--buildrick-font-family)",
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "0.02em",
  },
  savebarPillDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "var(--buildrick-warning)",
  },
  savebarActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  btnSecondary: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid var(--buildrick-border-medium)",
    background: "var(--buildrick-bg-card)",
    color: "var(--buildrick-text-primary)",
    fontFamily: "var(--buildrick-font-family)",
    fontSize: 11,
    fontWeight: 500,
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    background: "var(--buildrick-accent)",
    color: "#fff",
    fontFamily: "var(--buildrick-font-family)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
};

// ── Component ────────────────────────────────────────────────────────────────

export const SettingsTab: React.FC<SettingsTabProps> = ({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
  userPlan = "starter",
  onReplayTour,
  projectId,
  onDirtyChange,
}) => {
  const { currentScreen, navigateTo } = usePanelNavigation({
    storageKey: `settings-panel${projectId ? `-${projectId}` : ""}`,
    screens: SETTINGS_SCREENS,
    defaultScreen: "general",
  });

  const [screenIsDirty, setScreenIsDirty] = React.useState(false);
  const [guardOpen, setGuardOpen] = React.useState(false);
  const pendingNavRef = React.useRef<NavId | null>(null);
  // Bump this to force a remount of the active screen (used to "discard").
  const [resetKey, setResetKey] = React.useState(0);

  React.useEffect(() => {
    setScreenIsDirty(false);
    setGuardOpen(false);
  }, [currentScreen]);

  React.useEffect(() => {
    onDirtyChange?.(screenIsDirty);
  }, [screenIsDirty, onDirtyChange]);

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
  }, []);

  const handleSave = React.useCallback(() => {
    if (!composer) return;
    composer.saveProject?.().catch((err) => {
      console.error("[settings] save failed", err);
    });
    // Optimistically clear dirty; child screens will reconcile via onDirtyChange.
    setScreenIsDirty(false);
  }, [composer]);

  const current = NAV.find((n) => n.id === currentScreen) ?? NAV[0];

  const renderContent = (): React.ReactNode => {
    if (isScreenLocked(currentScreen)) {
      const requiredPlan = SCREEN_PLAN_REQUIREMENTS[currentScreen];
      return <LockedScreen variant={requiredPlan} />;
    }
    switch (currentScreen) {
      case "general":
        return <SiteSettingsScreen composer={composer} onDirtyChange={setScreenIsDirty} />;
      case "branding":
        return <DesignSystemScreen composer={composer} />;
      case "seo":
        return <SeoScreen composer={composer} onDirtyChange={setScreenIsDirty} />;
      case "integrations":
        return <IntegrationsHub composer={composer} onDirtyChange={setScreenIsDirty} />;
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
        style={{ ...S.row, ...(active ? S.rowActive : {}) }}
        aria-current={active ? "page" : undefined}
      >
        <span style={S.rowIcon}>
          <Icon />
        </span>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {n.title}
        </span>
        {locked ? <span style={S.rowBadge}>Pro</span> : null}
      </button>
    );
  };

  return (
    <PanelShell>
      <PanelShell.Header
        title="Settings"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />
      <PanelShell.Content noScroll>
        <div style={S.root}>
          <nav style={S.subnav} aria-label="Settings sections">
            <div style={S.subnavLabel}>Sections</div>
            {NAV.map(renderRow)}
            {onReplayTour && (
              <>
                <div style={{ ...S.subnavLabel, marginTop: 12 }}>Help</div>
                <button type="button" onClick={onReplayTour} style={S.row}>
                  <span style={S.rowIcon}>
                    <TourIcon />
                  </span>
                  <span>Get Started Tour</span>
                </button>
              </>
            )}
          </nav>
          <div style={S.pane} className="bd-settings-pane">
            <div style={S.paneHeader}>
              <h2 style={S.paneTitle}>{current.title}</h2>
              {current.subtitle && <div style={S.paneSubtitle}>{current.subtitle}</div>}
            </div>
            <div style={S.paneBody} key={resetKey}>
              {renderContent()}
            </div>
            {screenIsDirty && (
              <div style={S.savebar} role="region" aria-label="Unsaved changes">
                <span style={S.savebarPill}>
                  <span style={S.savebarPillDot} />
                  Unsaved
                </span>
                <div style={S.savebarActions}>
                  <button type="button" style={S.btnSecondary} onClick={handleDiscard}>
                    Discard
                  </button>
                  <button type="button" style={S.btnPrimary} onClick={handleSave}>
                    Save
                  </button>
                </div>
              </div>
            )}
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

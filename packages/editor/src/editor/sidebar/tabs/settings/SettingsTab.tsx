/**
 * SettingsTab - Card Home + Drill-in pattern (IA Redesign 2026)
 *
 * Features (7 drill-ins):
 * - Site Settings: Name, favicon, language, logo, social links
 * - Domains: Custom domain, SSL, redirects
 * - Analytics: Google Analytics, Meta Pixel, custom tracking
 * - Export: HTML, React, Vue, Next.js, ZIP download
 * - Integrations: Forms, payments, email
 * - Advanced: Custom CSS/JS, head injection
 * - Version History: Site history, restore, compare
 *
 * NOTE: Page Settings moved to Pages Tab (user correction 2026-01-30)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
const DesignSystemScreen = React.lazy(() => import("../DesignSystemTab"));
import { DrillInHeader } from "../../shared/DrillInHeader";
import { FeatureCard, FeatureCardGrid } from "../../shared/FeatureCard";
import { PanelHeader } from "../../shared/PanelHeader";
import { usePanelNavigation } from "../../shared/usePanelNavigation";
import {
  type SettingsTabProps,
  SCREEN_PLAN_REQUIREMENTS,
  FEATURE_FLAGS,
  SiteSettingsIcon,
  DomainIcon,
  AnalyticsIcon,
  ExportIcon,
  IntegrationsIcon,
  AdvancedIcon,
  TourIcon,
  SeoIcon,
  BillingIcon,
  DesignSystemIcon,
  SiteSettingsScreen,
  DomainsScreen,
  AnalyticsScreen,
  ExportScreen,
  IntegrationsScreen,
  AdvancedScreen,
  LockedScreen,
  BillingScreen,
  SeoScreen,
  SettingsNavGuard,
} from "./index";

// Navigation screens for this tab (Settings)
const SETTINGS_SCREENS = [
  { id: "home", title: "Settings" },
  { id: "site-settings", title: "Site Settings", parentId: "home" },
  { id: "domains", title: "Domains", parentId: "home" },
  { id: "analytics", title: "Analytics", parentId: "home" },
  { id: "export", title: "Export", parentId: "home" },
  { id: "integrations", title: "Integrations", parentId: "home" },
  { id: "advanced", title: "Advanced", parentId: "home" },
  { id: "seo", title: "SEO", parentId: "home" },
  { id: "billing", title: "Billing", parentId: "home" },
  { id: "design-system", title: "Design System", parentId: "home" },
];

// ============================================
// Component
// ============================================

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
  const { currentScreen, navigateTo, goBack, canGoBack, breadcrumb } = usePanelNavigation({
    storageKey: `settings-panel${projectId ? `-${projectId}` : ""}`,
    screens: SETTINGS_SCREENS,
    defaultScreen: "home",
  });

  // Dirty state lifted from active sub-screen — used by DrillInHeader guard
  const [screenIsDirty, setScreenIsDirty] = React.useState(false);
  const [guardOpen, setGuardOpen] = React.useState(false);

  // Reset dirty state on screen change
  React.useEffect(() => {
    setScreenIsDirty(false);
    setGuardOpen(false);
  }, [currentScreen]);

  // Bubble dirty state up to shell so rail tab-switch can be guarded
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

  // Render home screen — grouped by purpose, no filter chips
  // NOTE: Page Settings removed - now lives in Pages Tab (user correction 2026-01-30)
  const renderHomeScreen = () => (
    <>
      <FeatureCardGrid label="SITE">
        <FeatureCard
          title="Site Settings"
          subtitle="Name, favicon, language"
          icon={<SiteSettingsIcon />}
          onClick={() => navigateTo("site-settings")}
        />
        <FeatureCard
          title="Design System"
          subtitle="Colors, fonts, spacing tokens"
          icon={<DesignSystemIcon />}
          onClick={() => navigateTo("design-system")}
        />
        <FeatureCard
          title="Domains"
          subtitle="Custom domain + SSL"
          icon={<DomainIcon />}
          onClick={() => navigateTo("domains")}
          badge={!FEATURE_FLAGS.domains ? "Coming Soon" : undefined}
        />
        <FeatureCard
          title="Analytics"
          subtitle="GA, Meta Pixel, tracking"
          icon={<AnalyticsIcon />}
          onClick={() => navigateTo("analytics")}
        />
      </FeatureCardGrid>

      <FeatureCardGrid label="POWER">
        <FeatureCard
          title="SEO"
          subtitle="Meta title, description, robots"
          icon={<SeoIcon />}
          onClick={() => navigateTo("seo")}
        />
        <FeatureCard
          title="Integrations"
          subtitle="Forms, payments, email"
          icon={<IntegrationsIcon />}
          onClick={() => navigateTo("integrations")}
          badge={isScreenLocked("integrations") ? "Pro" : undefined}
        />
        <FeatureCard
          title="Advanced"
          subtitle="Custom CSS/JS, head scripts"
          icon={<AdvancedIcon />}
          onClick={() => navigateTo("advanced")}
          badge={isScreenLocked("advanced") ? "Pro" : undefined}
        />
        <FeatureCard
          title="Export"
          subtitle="Download source code for self-hosting"
          icon={<ExportIcon />}
          onClick={() => navigateTo("export")}
          badge={!FEATURE_FLAGS.export ? "Coming Soon" : undefined}
        />
        <FeatureCard
          title="Billing"
          subtitle="Plan info and upgrade"
          icon={<BillingIcon />}
          onClick={() => navigateTo("billing")}
        />
      </FeatureCardGrid>

      {onReplayTour && (
        <FeatureCardGrid label="HELP">
          <FeatureCard
            title="Get Started Tour"
            subtitle="Replay the onboarding walkthrough"
            icon={<TourIcon />}
            onClick={onReplayTour}
          />
        </FeatureCardGrid>
      )}
    </>
  );

  // Render drill-in content
  const renderContent = () => {
    if (isScreenLocked(currentScreen)) {
      const requiredPlan = SCREEN_PLAN_REQUIREMENTS[currentScreen];
      return <LockedScreen variant={requiredPlan} />;
    }

    switch (currentScreen) {
      case "site-settings":
        return <SiteSettingsScreen composer={composer} onDirtyChange={setScreenIsDirty} />;
      case "domains":
        return <DomainsScreen />;
      case "analytics":
        return <AnalyticsScreen composer={composer} onDirtyChange={setScreenIsDirty} />;
      case "export":
        return <ExportScreen composer={composer} />;
      case "integrations":
        return <IntegrationsScreen />;
      case "advanced":
        return <AdvancedScreen composer={composer} onDirtyChange={setScreenIsDirty} />;
      case "seo":
        return <SeoScreen composer={composer} onDirtyChange={setScreenIsDirty} />;
      case "billing":
        return <BillingScreen userPlan={userPlan} />;
      case "design-system":
        return <DesignSystemScreen composer={composer} />;
      default:
        return null;
    }
  };

  return (
    <div className="buildrick-st-container">
      {canGoBack ? (
        <>
          <DrillInHeader
            title={SETTINGS_SCREENS.find((s) => s.id === currentScreen)?.title || "Settings"}
            parentName="Settings"
            breadcrumb={breadcrumb}
            onBack={goBack}
            isDirty={screenIsDirty}
            onBackAttempt={() => setGuardOpen(true)}
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={onHelpClick}
            onClose={onClose}
          />
          <div className="buildrick-st-content">{renderContent()}</div>
        </>
      ) : (
        <>
          <PanelHeader
            title="Settings"
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={onHelpClick}
            onClose={onClose}
          />
          <div className="buildrick-st-home">{renderHomeScreen()}</div>
        </>
      )}
      <SettingsNavGuard
        isOpen={guardOpen}
        onDiscard={() => {
          setGuardOpen(false);
          setScreenIsDirty(false);
          goBack();
        }}
        onCancel={() => setGuardOpen(false)}
      />
    </div>
  );
};

export type { SettingsTabProps } from "./index";
export default SettingsTab;

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
import { DrillInHeader } from "../shared/DrillInHeader";
import { FeatureCard, FeatureCardGrid } from "../shared/FeatureCard";
import { FilterChips } from "../shared/FilterChips";
import { PanelHeader } from "../shared/PanelHeader";
import { usePanelNavigation } from "../shared/usePanelNavigation";
import {
  type SettingsCategory,
  type SettingsTabProps,
  CATEGORY_CHIPS,
  CARD_CATEGORIES,
  SCREEN_PLAN_REQUIREMENTS,
  containerStyles,
  homeStyles,
  contentStyles,
  SiteSettingsIcon,
  DomainIcon,
  AnalyticsIcon,
  ExportIcon,
  IntegrationsIcon,
  AdvancedIcon,
  HistoryIcon,
  SiteSettingsScreen,
  DomainsScreen,
  AnalyticsScreen,
  ExportScreen,
  IntegrationsScreen,
  AdvancedScreen,
  VersionHistoryScreen,
  LockedScreen,
} from "./settings";

// Navigation screens for this tab (Settings)
const SETTINGS_SCREENS = [
  { id: "home", title: "Settings" },
  { id: "site-settings", title: "Site Settings", parentId: "home" },
  { id: "domains", title: "Domains", parentId: "home" },
  { id: "analytics", title: "Analytics", parentId: "home" },
  { id: "export", title: "Export", parentId: "home" },
  { id: "integrations", title: "Integrations", parentId: "home" },
  { id: "advanced", title: "Advanced", parentId: "home" },
  { id: "version-history", title: "Version History", parentId: "home" },
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
}) => {
  const { currentScreen, navigateTo, goBack, canGoBack, breadcrumb } = usePanelNavigation({
    storageKey: "settings-panel",
    screens: SETTINGS_SCREENS,
    defaultScreen: "home",
  });

  // Category filter state
  const [categoryFilter, setCategoryFilter] = React.useState<SettingsCategory>("all");

  const isScreenLocked = (screenId: string) => {
    const required = SCREEN_PLAN_REQUIREMENTS[screenId];
    if (!required) return false;
    if (required === "pro") return userPlan === "starter";
    if (required === "enterprise") return userPlan !== "enterprise";
    return false;
  };

  // Check if a card should be shown based on category filter
  const shouldShowCard = (screenId: string) => {
    if (categoryFilter === "all") return true;
    const categories = CARD_CATEGORIES[screenId] || [];
    return categories.includes(categoryFilter);
  };

  // Render home screen with category filter + feature cards
  // NOTE: Page Settings removed - now lives in Pages Tab (user correction 2026-01-30)
  const renderHomeScreen = () => (
    <>
      {/* Category Filter Chips */}
      <FilterChips
        chips={CATEGORY_CHIPS}
        value={categoryFilter}
        onChange={(id) => setCategoryFilter(id as SettingsCategory)}
        style={{ borderBottom: "1px solid var(--aqb-border)" }}
      />

      <FeatureCardGrid>
        {shouldShowCard("export") && (
          <FeatureCard
            title="Export"
            subtitle="HTML, React, Vue, Next.js"
            icon={<ExportIcon />}
            onClick={() => navigateTo("export")}
          />
        )}
        {shouldShowCard("site-settings") && (
          <FeatureCard
            title="Site Settings"
            subtitle="Name, favicon, language"
            icon={<SiteSettingsIcon />}
            onClick={() => navigateTo("site-settings")}
          />
        )}
        {shouldShowCard("domains") && (
          <FeatureCard
            title="Domains"
            subtitle="Custom domain + SSL"
            icon={<DomainIcon />}
            onClick={() => navigateTo("domains")}
          />
        )}
        {shouldShowCard("analytics") && (
          <FeatureCard
            title="Analytics"
            subtitle="GA, Meta Pixel, tracking"
            icon={<AnalyticsIcon />}
            onClick={() => navigateTo("analytics")}
          />
        )}
        {shouldShowCard("integrations") && (
          <FeatureCard
            title="Integrations"
            subtitle="Forms, payments, email"
            icon={<IntegrationsIcon />}
            onClick={() => navigateTo("integrations")}
            badge={isScreenLocked("integrations") ? "Pro" : undefined}
          />
        )}
        {shouldShowCard("advanced") && (
          <FeatureCard
            title="Advanced"
            subtitle="Custom CSS/JS, head scripts"
            icon={<AdvancedIcon />}
            onClick={() => navigateTo("advanced")}
            badge={isScreenLocked("advanced") ? "Pro" : undefined}
          />
        )}
        {shouldShowCard("version-history") && (
          <FeatureCard
            title="Version History"
            subtitle="Restore, compare versions"
            icon={<HistoryIcon />}
            onClick={() => navigateTo("version-history")}
          />
        )}
      </FeatureCardGrid>
    </>
  );

  // Render drill-in content
  const renderContent = () => {
    if (isScreenLocked(currentScreen)) {
      const requiredPlan = SCREEN_PLAN_REQUIREMENTS[currentScreen];
      return <LockedScreen plan={requiredPlan} />;
    }

    switch (currentScreen) {
      case "site-settings":
        return <SiteSettingsScreen composer={composer} />;
      case "domains":
        return <DomainsScreen />;
      case "analytics":
        return <AnalyticsScreen composer={composer} />;
      case "export":
        return <ExportScreen />;
      case "integrations":
        return <IntegrationsScreen />;
      case "advanced":
        return <AdvancedScreen composer={composer} />;
      case "version-history":
        return <VersionHistoryScreen composer={composer} />;
      default:
        return null;
    }
  };

  return (
    <div style={containerStyles}>
      {canGoBack ? (
        <>
          <DrillInHeader
            title={SETTINGS_SCREENS.find((s) => s.id === currentScreen)?.title || "Settings"}
            parentName="Settings"
            breadcrumb={breadcrumb}
            onBack={goBack}
            isPinned={isPinned}
            onPinToggle={onPinToggle}
            onHelpClick={onHelpClick}
            onClose={onClose}
          />
          <div style={contentStyles}>{renderContent()}</div>
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
          <div style={homeStyles}>{renderHomeScreen()}</div>
        </>
      )}
    </div>
  );
};

export type { SettingsTabProps } from "./settings";
export default SettingsTab;

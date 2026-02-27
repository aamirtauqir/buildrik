/**
 * Settings tab types and constants
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine";
import type { FilterChip } from "../../shared/FilterChips";

// ============================================
// Types
// ============================================

export type SettingsCategory = "all" | "project" | "analytics" | "distribution" | "advanced";

export type PlanTier = "starter" | "pro" | "enterprise";

export interface SettingsTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  userPlan?: PlanTier;
}

export interface ScreenProps {
  composer: Composer | null;
}

// ============================================
// Constants
// ============================================

export const CATEGORY_CHIPS: FilterChip[] = [
  { id: "all", label: "All", icon: "📋" },
  { id: "project", label: "Site", icon: "🏠" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "distribution", label: "Distribution", icon: "🚀" },
  { id: "advanced", label: "Advanced", icon: "⚙️" },
];

// Map each settings card to its category
export const CARD_CATEGORIES: Record<string, SettingsCategory[]> = {
  "site-settings": ["project"],
  domains: ["project", "distribution"],
  analytics: ["analytics"],
  export: ["distribution"],
  integrations: ["distribution", "advanced"],
  advanced: ["advanced"],
  "version-history": ["project"],
};

export const SCREEN_PLAN_REQUIREMENTS: Record<string, PlanTier> = {
  advanced: "pro",
  integrations: "pro",
};

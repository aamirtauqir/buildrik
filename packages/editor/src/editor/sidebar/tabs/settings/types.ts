/**
 * Settings tab types and constants
 * @license BSD-3-Clause
 */

import type { Composer } from "../../../../engine";

// ============================================
// Types
// ============================================

export type PlanTier = "starter" | "pro" | "enterprise";

export interface SettingsTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  userPlan?: PlanTier;
  /** Called when user clicks "Get Started Tour" card — triggers orchestrator replayTour */
  onReplayTour?: () => void;
  /** Project ID — scopes localStorage key so nav position is per-project */
  projectId?: string | null;
  /** Called when the sub-screen's unsaved-changes state changes — used by shell to guard tab switch */
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface ScreenProps {
  composer: Composer | null;
  /** Called when the screen's unsaved-changes state changes — used by shell to show nav guard */
  onDirtyChange?: (isDirty: boolean) => void;
}

// ============================================
// Constants
// ============================================

export const SCREEN_PLAN_REQUIREMENTS: Record<string, "pro" | "enterprise"> = {
  advanced: "pro",
  integrations: "pro",
};

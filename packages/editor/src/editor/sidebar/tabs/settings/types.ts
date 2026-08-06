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
  isExpanded?: boolean;
  onExpandToggle?: () => void;
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
  composer?: Composer | null;
  /** Called when the screen's unsaved-changes state changes — used by shell to show nav guard */
  onDirtyChange?: (isDirty: boolean) => void;
  /** Site/project ID — required by screens that read server-side rows (Redirects, Forms, etc.) */
  projectId?: string | null;
  /**
   * Called by screens that own server-side persistence (Redirects/Headers/Localization
   * write to Site columns directly, not into composer state). Registered handler
   * runs in place of `composer.saveProject()` when the central savebar fires.
   * Pass `null` to clear (e.g. when screen becomes clean or unmounts).
   */
  registerSaveHandler?: (handler: (() => Promise<void>) | null) => void;
  /**
   * Called by composer-backed screens (General / SEO / Analytics / Advanced)
   * that hold edits in local state and flush to composer once on Save. Runs
   * BEFORE `composer.saveProject()` so the typed values get persisted.
   * Pass `null` to clear on unmount.
   *
   * Why: prior pattern wrote `composer.setProjectSettings()` per keystroke,
   * which fanned out PROJECT_CHANGED across ~7 listeners (history,
   * autosave, sync, inspector, page tabs, undo controls). The other 3
   * screens silently lost typed values because their local `handleSave`
   * was never wired. This contract fixes both cases with one path.
   */
  registerFlushHandler?: (handler: (() => void) | null) => void;
}

// ============================================
// Constants
// ============================================

export const SCREEN_PLAN_REQUIREMENTS: Record<string, "pro" | "enterprise"> = {
  advanced: "pro",
  integrations: "pro",
};

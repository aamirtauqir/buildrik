/**
 * Settings tab types and constants
 * @license BSD-3-Clause
 */

import type * as React from "react";
import type { Composer } from "../../../../engine";

// ============================================
// Types
// ============================================

export type PlanTier = "starter" | "pro" | "enterprise";

/**
 * Every row the Clone sidebar draws (3397:32011), in one union so the nav,
 * the icon map, the Overview's rows and the search registry name the same
 * sixteen things. `overview` is the landing screen; `branding` and `export`
 * are doors (the Brand panel, the Export modal); `members` / `billing` open
 * the dashboard.
 */
export type SettingsNavId =
  | "overview"
  | "general" | "branding" | "localization"
  | "seo" | "domains" | "redirects" | "export"
  | "analytics" | "forms"
  | "custom-code" | "headers" | "integrations"
  | "webhooks" | "members" | "billing";

/** The Pages panel's URL-repair draft (Clone 3519:19920): the page whose
 *  slug just changed, and the move the redirect should cover. */
export interface RedirectRepair {
  pageId: string;
  pageName: string;
  from: string;
  to: string;
}

/** `ui:settings-open` — open Settings on a screen; a repair draft may ride along. */
export interface SettingsOpenRequest {
  screen: SettingsNavId;
  repair?: RedirectRepair | null;
}

export interface SettingsTabProps {
  composer: Composer | null;
  /** `‹ Back to canvas` / `Done` / a discarded edit — every door out of Settings. */
  onClose?: () => void;
  userPlan?: PlanTier;
  /** Project ID — scopes localStorage key so nav position is per-project */
  projectId?: string | null;
  /** Called when the sub-screen's unsaved-changes state changes — used by shell to guard tab switch */
  onDirtyChange?: (isDirty: boolean) => void;
}

/** The screen's server read, as the shell's footer reports it. */
export type ScreenLoadState = "loading" | "ready" | "error";

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
  /** The screen's server read: the shell's footer and the screen's own card follow it. */
  onLoadStateChange?: (state: ScreenLoadState) => void;
  /**
   * Registered by a screen that loads from the server; the load-error card's
   * Try again calls it. The screen renders that card itself (`LoadCard`
   * `onRetry`), so the shell has no button of its own for this — the slot is
   * the contract's, kept for a host that does.
   */
  registerRetryLoad?: (fn: (() => void) | null) => void;
  /** The last Save's failure, set by the shell; the screen renders the banner above its cards. */
  saveError?: string | null;
  /**
   * A screen's own primary in the pane header — `Add domain` (Clone
   * 3397:32206), `Add locale` (3397:32376). Registered in an effect on mount
   * and cleared with `null` on unmount; the shell renders it at the header's
   * right, where the locked screen's `Upgrade` sits.
   */
  registerHeaderAction?: (node: React.ReactNode | null) => void;
  /**
   * A screen with sub-views (Integrations › Browse all / Manage, Clone
   * 3873:25643 / 3866:25629) renames the shell's header while one is up:
   * `title` is appended after the nav's `Group / Screen`, `subtitle`
   * replaces the nav's line. Pass `null` to return to the nav's own header;
   * the shell clears it on a screen change.
   */
  registerHeader?: (header: { title?: string; subtitle?: string } | null) => void;
}

// ============================================
// Constants
// ============================================

/**
 * Keys MUST be screen ids from `SETTINGS_SCREENS` (SettingsTab.tsx). This is a
 * plain `Record<string, …>`, so a key that matches no screen fails silently:
 * `SCREEN_PLAN_REQUIREMENTS[screenId]` is simply `undefined` and the screen
 * renders ungated. That is what `advanced` did — no screen has ever had that
 * id; the screen is `custom-code`. Board 1138:13436 draws it Pro-locked, and
 * on a starter plan it rendered its editors with no badge and no gate while
 * Integrations (whose key does match) gated correctly.
 */
export const SCREEN_PLAN_REQUIREMENTS: Record<string, "pro" | "enterprise"> = {
  "custom-code": "pro",
  integrations: "pro",
};

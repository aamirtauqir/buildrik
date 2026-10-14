/**
 * Settings tab types and constants
 * @license BSD-3-Clause
 */

import type * as React from "react";
import type { Composer } from "@/engine";
import type { ProjectSettings } from "@/shared/types/project";
import type { SiteColumnPatch } from "@/services/BuildrikSyncProvider";

// ============================================
// Types
// ============================================

export type PlanTier = "starter" | "pro" | "enterprise";

/**
 * Every row of the Settings sidebar (Phase B IA, proposal §25 / plan M0), in
 * one union so the nav, the icon map, the Overview's rows and the search
 * registry name the same things. `overview` is the landing screen; `branding`
 * is a door (the Brand panel); `members` / `billing` / `webhooks` ("Integrations
 * & webhooks") open the dashboard. Every other id is a screen in the pane
 * (`SettingsScreenId`). `localization` is titled "Languages", `forms` "Form
 * submissions", `headers` "Security headers" — the ids stayed so deep links
 * and saved nav positions keep working.
 */
export type SettingsNavId =
  | "overview"
  | "general" | "localization" | "branding"
  | "seo"
  | "domains" | "redirects" | "access"
  | "analytics" | "forms"
  | "custom-code" | "headers"
  | "danger-zone"
  | "members" | "billing" | "webhooks";

/** The ids that render in the pane — what `?settings=<id>` and `ui:settings-open` may name. */
export type SettingsScreenId = Exclude<SettingsNavId, "branding" | "members" | "billing" | "webhooks">;

/** The workspace doors: each opens a door card in the pane (8139:217358) that leads to the dashboard. */
export type SettingsWorkspaceDoorId = "members" | "billing" | "webhooks";

/** Everything the pane can show: a screen, or a workspace door's card. */
export type SettingsPaneId = SettingsScreenId | SettingsWorkspaceDoorId;

/** How a screen saves (§27): `footer` = Save/Discard in the footer through the
 *  settings mutations; `immediate` = each action applies as it happens, through
 *  its own dialog — the footer only appears if something is still left to save. */
export type SettingsSaveModel = "footer" | "immediate";

/** What a screen's changes reach: the next publish, the live site at once, or
 *  the site itself (archive / transfer / delete — the Danger zone). */
export type SettingsScope = "publish" | "live" | "lifecycle";

/** A field's error, keyed by its `ProjectSettings` path (`seo.defaultOgImage`,
 *  `analytics.googleAnalytics.measurementId`), or by the Site column name for a
 *  column with no settings path (`slug`, `canonicalUrl`, `cspPolicy`). */
export type SettingsFieldErrors = Readonly<Record<string, string>>;

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
  screen: SettingsScreenId;
  repair?: RedirectRepair | null;
}

export interface SettingsTabProps {
  composer: Composer | null;
  /** `‹ Back to canvas` / `Done` / a discarded edit — every door out of Settings. */
  onClose?: () => void;
  userPlan?: PlanTier;
  /** Project ID — scopes localStorage key so nav position is per-project */
  projectId?: string | null;
}

/**
 * A flush that carries more than the settings: Site columns no
 * `ProjectSettings` path names (`slug`, `canonicalUrl`) — they ride in the same
 * `siteDetail.settings.update` as the settings' own columns — and what the
 * screen does once the server has them (General moves its saved slug).
 */
export interface SettingsFlush {
  settings: ProjectSettings;
  columns?: SiteColumnPatch;
  onSaved?: () => void;
}

/** What a flush returns: the settings, the settings with extra columns, or nothing to save. */
export type SettingsFlushResult = ProjectSettings | SettingsFlush | void;

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
   * runs in place of the flush when the footer's Save fires. A handler that
   * throws `SettingsSaveError` (as `updateSiteColumns` /
   * `updateProjectSettings` in BuildrikSyncProvider do) gets the refused
   * fields back as `fieldErrors`.
   * Pass `null` to clear (e.g. when screen becomes clean or unmounts).
   */
  registerSaveHandler?: (handler: (() => Promise<void>) | null) => void;
  /**
   * Settings Phase B (BE-3): a composer-backed screen (General / SEO /
   * Analytics / Custom code / the Redirects switch) holds its edits locally
   * and registers a flush that RETURNS the complete `ProjectSettings` it wants
   * saved — built from `composer.getProjectSettings()` plus its edits — and
   * does NOT write the composer. On Save the shell diffs that against the
   * composer: Site-column fields go to `siteDetail.settings.update`, the
   * JSON-only keys to `siteDetail.projectSettings.update`, and only once the
   * server has them does the composer adopt them (no autosave, no
   * `sites.saveProject`). Return nothing when there is nothing to save; throw
   * (with the field's sentence) to refuse the Save, or `SettingsSaveCancelled`
   * when the user called it off (no banner). Return a `SettingsFlush` to send
   * Site columns with no settings path in the same save; the flush may be
   * async (a confirm first). Pass `null` to clear.
   */
  registerFlushHandler?: (handler: (() => SettingsFlushResult | Promise<SettingsFlushResult>) | null) => void;
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
   * A screen with sub-views renames the shell's header while one is up:
   * `title` is appended after the nav's `Group / Screen`, `subtitle`
   * replaces the nav's line. Pass `null` to return to the nav's own header;
   * the shell clears it on a screen change.
   */
  registerHeader?: (header: { title?: string; subtitle?: string } | null) => void;
  /** This screen's save model (`SCREEN_SAVE_MODEL`). */
  saveModel?: SettingsSaveModel;
  /**
   * The member's role is below `SCREEN_MIN_ROLE` for this screen: the shell
   * shows the read-only banner, disables every native control inside the
   * screen (a disabled fieldset), hides the header action and the footer.
   * Owner rule (2026-10-04, 8134:212323): navigation stays visible and live —
   * render a door as an anchor (`Button href`), which the fieldset does not
   * disable; a write stays visible, disabled — never hidden. The Danger zone
   * draws its own notice and disables per action (Transfer has its own rule).
   */
  readOnly?: boolean;
  /**
   * The screen's own invalid fields, as the user types (`null` / `{}` when
   * none). While any are reported, the footer's Save is disabled — Save is
   * never pressed into a refusal the screen already knows about (§27).
   */
  registerFieldErrors?: (errors: SettingsFieldErrors | null) => void;
  /**
   * A sentence for the footer's status, in place of "Unsaved changes" — what
   * the screen needs before Save can go ("Fix the site URL before saving",
   * 8135:213221 / 8135:213477). `null` returns the footer to its own status;
   * the shell clears it on a screen change. Loading and a failed load still
   * take precedence; a failed save does not — the message names what to fix
   * (8135:213221 draws it after the server refused the slug).
   */
  registerFooterMessage?: (message: string | null) => void;
  /**
   * The workspace's plan is below this screen's (`SCREEN_PLAN_REQUIREMENTS`)
   * and the screen draws its own lock (`SCREENS_WITH_OWN_PLAN_LOCK`): it shows
   * the gated part locked, with `onUpgrade` as its call to action, and keeps
   * the rest. Nothing on it saves.
   */
  planLocked?: boolean;
  /** The plan gate's Upgrade — the dashboard's billing page. */
  onUpgrade?: () => void;
  /**
   * Open another Settings screen ("Manage in Languages ›") the way a nav click
   * does: through the Unsaved settings guard while this screen holds edits.
   * Never emit `ui:settings-open` from inside Settings — that lands on the
   * screen and skips the guard.
   */
  onOpenScreen?: (id: SettingsNavId) => void;
  /** The fields the server refused on the last Save (SA-10). The screen
   *  renders each under its field; the save-error banner says the rest. */
  fieldErrors?: SettingsFieldErrors;
}

// ============================================
// Constants
// ============================================

/**
 * The plan a screen needs. Keyed by `SettingsScreenId`, so a key that names no
 * screen fails to compile (`advanced` once gated nothing for months).
 */
export const SCREEN_PLAN_REQUIREMENTS: Partial<Record<SettingsScreenId, "pro" | "enterprise">> = {
  "custom-code": "pro",
  access: "pro",
};

/**
 * Gated screens that draw their own plan lock instead of the shell's centred
 * `LockedScreen`: only part of them is the plan's. Access (8136:216758) locks
 * its Password protection card and keeps Share links, which every plan has.
 * The shell mounts them with `planLocked` and no header Upgrade or footer.
 */
export const SCREENS_WITH_OWN_PLAN_LOCK: ReadonlySet<SettingsScreenId> = new Set<SettingsScreenId>(["access"]);

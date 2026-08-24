/**
 * templatesStorage — isolated localStorage/sessionStorage operations for the Templates feature
 *
 * All storage side-effects are named and centralised here so call sites are explicit.
 * @license BSD-3-Clause
 */

import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { STORAGE_KEYS } from "../../../../shared/constants/storageKeys";
import { addRecentTemplate } from "./templatesData";
import type { TemplateItem } from "./templatesData";

/** Dismiss the new-user onboarding nudge when a template is applied */
export function dismissOnboarding(): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_DISMISSED,
      "true"
    );
  } catch {
    /* ignore storage errors */
  }
}

/** Record a template as recently used (writes to localStorage via templatesData) */
export function recordTemplateApplied(template: Pick<TemplateItem, "id" | "name" | "icon">): void {
  addRecentTemplate(template);
}

/**
 * Keyed by site. `sessionStorage` outlives a same-tab navigation, and
 * "which template was applied" is a fact about ONE site — so a single global
 * key meant applying a template on site A and then opening site B in that tab
 * showed B someone else's applied-template state.
 *
 * The same shape as the media and CMS bleed found on 2026-08-24, in a smaller
 * place: browser-scoped storage holding per-site state.
 */
function appliedKey(): string {
  const siteId = getSiteIdFromUrl();
  return siteId ? `${STORAGE_KEYS.APPLIED_TEMPLATE_ID}:${siteId}` : STORAGE_KEYS.APPLIED_TEMPLATE_ID;
}

/** Persist the applied template ID across tab closes (session-scoped, per site) */
export function saveAppliedId(id: string): void {
  try {
    sessionStorage.setItem(appliedKey(), id);
  } catch {
    /* ignore */
  }
}

/** Remove the persisted applied ID (call on undo or dismiss) */
export function clearAppliedId(): void {
  try {
    sessionStorage.removeItem(appliedKey());
  } catch {
    /* ignore */
  }
}

/** Restore applied template ID from session (returns null if none) */
export function loadAppliedId(): string | null {
  try {
    return sessionStorage.getItem(appliedKey());
  } catch {
    return null;
  }
}

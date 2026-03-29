/**
 * templatesStorage — isolated localStorage/sessionStorage operations for the Templates feature
 *
 * All storage side-effects are named and centralised here so call sites are explicit.
 * @license BSD-3-Clause
 */

import { STORAGE_KEYS } from "../../../../shared/constants/storageKeys";
import { addRecentTemplate } from "./templatesData";
import type { TemplateItem } from "./templatesData";

/** Dismiss the new-user onboarding nudge when a template is applied */
export function dismissOnboarding(): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING,
      JSON.stringify({ dismissed: true, reason: "template-applied" })
    );
  } catch {
    /* ignore storage errors */
  }
}

/** Record a template as recently used (writes to localStorage via templatesData) */
export function recordTemplateApplied(template: Pick<TemplateItem, "id" | "name" | "icon">): void {
  addRecentTemplate(template);
}

/** Persist the applied template ID across tab closes (session-scoped) */
export function saveAppliedId(id: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.APPLIED_TEMPLATE_ID, id);
  } catch {
    /* ignore */
  }
}

/** Remove the persisted applied ID (call on undo or dismiss) */
export function clearAppliedId(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.APPLIED_TEMPLATE_ID);
  } catch {
    /* ignore */
  }
}

/** Restore applied template ID from session (returns null if none) */
export function loadAppliedId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.APPLIED_TEMPLATE_ID);
  } catch {
    return null;
  }
}

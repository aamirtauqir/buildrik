/**
 * The Localization screen's server contract — TEMPORARY. Replace with the
 * shared import at merge.
 *
 * S2's backend (`phase2-backend.md` §3) adds `siteDetail.locales({ siteId })`
 * and `updateSiteSettingsSchema += { localeAutoRedirect?: boolean }`; both
 * are B's to build, and until the branches meet the router type in this tree
 * carries neither. The three shapes below are typed here exactly as the
 * brief's contract states them, and the two accessors are the only places
 * the screen and its dialogs touch the client for them — so the merge is a
 * one-file swap: delete this file, import `LocalesSummary` from
 * `@buildrik/shared/schemas/site-detail` and call the procedures directly.
 *
 * @license BSD-3-Clause
 */

import type { BuildrikApiClient } from "@/services/api-client";

export type LocaleStatus = "LIVE" | "PENDING" | "NOT_STARTED";

/** One row of `siteDetail.locales` — an enabled locale and its translation progress. */
export interface LocaleRow {
  code: string;
  /** `/` for the default locale, `/<code>` for the rest. */
  path: string;
  translated: number;
  total: number;
  status: LocaleStatus;
  /** The untranslated pages' names, in site order — the checklist's line. */
  pending: string[];
}

export interface LocalesSummary {
  locales: LocaleRow[];
  /** Pages on the site. */
  total: number;
}

/** What this screen reads off `siteDetail.settings.get`. */
export interface LocaleSettingsRow {
  defaultLocale?: string | null;
  enabledLocales?: string[] | null;
  /** `Site.localeAutoRedirect` — absent until the S2 migration lands. */
  localeAutoRedirect?: boolean | null;
}

/** The screen's Save and the Add locale dialog's Create both write this. */
export interface LocaleSettingsUpdate {
  id: string;
  defaultLocale: string;
  enabledLocales: string[];
  localeAutoRedirect: boolean;
}

interface LocalesProcedure {
  locales: { query(input: { siteId: string }): Promise<LocalesSummary> };
}

/** `siteDetail.locales({ siteId })`. */
export function readLocales(client: BuildrikApiClient, siteId: string): Promise<LocalesSummary> {
  // The router type in this tree predates the procedure; the cast goes at merge.
  const siteDetail = client.siteDetail as unknown as LocalesProcedure;
  return siteDetail.locales.query({ siteId });
}

/** `siteDetail.settings.get({ siteId })`, narrowed to the locale columns. */
export async function readLocaleSettings(client: BuildrikApiClient, siteId: string): Promise<LocaleSettingsRow> {
  const row: LocaleSettingsRow = await client.siteDetail.settings.get.query({ siteId });
  return row;
}

/** `siteDetail.settings.update` with the three locale fields. Rejects on failure. */
export async function writeLocaleSettings(client: BuildrikApiClient, input: LocaleSettingsUpdate): Promise<void> {
  // A variable, not a literal: `localeAutoRedirect` is not in the schema
  // type yet, and a fresh literal would be refused for the extra key.
  await client.siteDetail.settings.update.mutate(input);
}

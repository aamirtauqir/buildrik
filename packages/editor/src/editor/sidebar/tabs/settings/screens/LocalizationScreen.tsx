/**
 * Languages — 8135:214023 (default) · 8135:214262 (remove-locale confirm).
 *
 * Two cards, two save models (Phase B §1 row 14):
 *  - **Default locale** is a footer field: picking one only stages it, the
 *    footer's Save writes `Site.defaultLocale` (the screen's own save handler,
 *    `updateSiteColumns`), and the composer adopts it as saved — the exported
 *    document's `lang` reads `seo.language` (WCAG 3.1.1).
 *  - **Locales** are objects that save immediately (SA-16): `Add locale`
 *    (AddLocaleDialog) and `Remove` each write `enabledLocales` at once and
 *    re-read the table — never carrying the staged default with them.
 *    Remove asks first only when the locale has translations (Q-B6), and the
 *    translations are kept (they live in `Page.translations`, untouched).
 *
 * SA-05: no Auto-redirect row — the stored `localeAutoRedirect` is never sent.
 * Two reads on open, one load state: `settings.get` and `siteDetail.locales`.
 * A row's name opens the Translation checklist.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { updateSiteColumns } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { devError } from "@/shared/utils/devLogger";
import {
  Field,
  LoadCard,
  SaveErrorBanner,
  SCREEN_EMPTY,
  SCREEN_FIELD_ERROR,
  SET_RESTORE_STRIP,
  Screen,
  Select,
} from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";
import { localeLabel } from "../constants";
import { SettingsCard } from "../components/SettingsCard";
import { AddLocaleDialog } from "../components/AddLocaleDialog";
import { RemoveLocaleDialog } from "../components/RemoveLocaleDialog";
import { TranslationChecklistDialog } from "../components/TranslationChecklistDialog";
import type { LocaleSummary as LocaleRow, LocalesSummary } from "@buildrik/shared/schemas/site-detail";

interface LocalesRead {
  row: { defaultLocale?: string | null; enabledLocales?: string[] | null };
  summary: LocalesSummary;
}

/* 8135:214246 / 8135:214250: header 28 tall in 11/500 caps, rows 40 tall in
   13, columns 360 · 420 · 236 with 12 between; the card's 16 spaces them. */
const COLS = ["tw:w-90", "tw:w-105", "tw:min-w-0 tw:flex-1"] as const;
const ROW = "tw:flex tw:items-center tw:gap-3";
const HEAD = `${ROW} tw:h-7 tw:text-[length:var(--bk-text-11)] tw:font-medium tw:uppercase tw:leading-5 tw:text-[var(--bk-ink-muted)]`;
const BODY_ROW = `${ROW} tw:h-10 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]`;
/* The locale name and Remove: text in a button, accent for the action. */
const TEXT_BTN =
  "tw:h-5 tw:w-fit tw:justify-start tw:rounded-[var(--bk-radius-sm)] tw:border-0 tw:bg-transparent tw:p-0 " +
  "tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-5 tw:enabled:hover:bg-transparent tw:enabled:hover:underline " +
  "tw:focus:ring-0 tw:focus:shadow-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
/* 8135:214240 `Button · Add locale`: primary, 32 tall, 12 in, 13/500. */
const ADD_BTN =
  "tw:h-8 tw:shrink-0 tw:rounded-[var(--bk-radius-md)] tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-medium " +
  "tw:focus:ring-0 tw:focus:shadow-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

const nameOf = (code: string) => `${localeLabel(code)} (${code})`;

export const LocalizationScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  registerSaveHandler,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
  fieldErrors,
  readOnly,
}) => {
  /* What the server holds, and the default staged for the footer's Save. */
  const [savedDefault, setSavedDefault] = React.useState("en");
  const [defaultLocale, setDefaultLocale] = React.useState("en");
  const [enabledLocales, setEnabledLocales] = React.useState<string[]>(["en"]);
  const [locales, setLocales] = React.useState<LocaleRow[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [checklist, setChecklist] = React.useState<LocaleRow | null>(null);
  const [removing, setRemoving] = React.useState<LocaleRow | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const siteName = composer?.getProjectMetadata?.()?.name ?? "";

  const load = useServerLoad<LocalesRead>(
    projectId,
    async (client, siteId) => {
      const [row, summary] = await Promise.all([
        client.siteDetail.settings.get.query({ siteId }),
        client.siteDetail.locales.query({ siteId }),
      ]);
      return { row, summary };
    },
    ({ row, summary }) => {
      const saved = row.defaultLocale ?? "en";
      setSavedDefault(saved);
      setDefaultLocale(saved);
      setEnabledLocales(row.enabledLocales?.length ? row.enabledLocales : ["en"]);
      setLocales(summary.locales);
    },
    { onLoadStateChange, registerRetryLoad },
  );

  const dirty = defaultLocale !== savedDefault;
  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  /** The table's counts follow the server (a new default is complete at `/`). */
  const refreshTable = React.useCallback(async () => {
    if (!projectId) return;
    try {
      setLocales((await getBuildrikClient(DASHBOARD_URL).siteDetail.locales.query({ siteId: projectId })).locales);
    } catch (error) {
      devError("settings", `locales refresh failed for site ${projectId}`, error);
    }
  }, [projectId]);

  /** The composer's `seo.language` follows the saved default, as saved state. */
  const adoptLanguage = React.useCallback(
    (code: string) => {
      if (!composer) return;
      const current = composer.getProjectSettings();
      if (current.seo?.language === code) return;
      composer.adoptSavedProjectSettings({ ...current, seo: { ...current.seo, language: code } });
    },
    [composer],
  );

  const handleSave = React.useCallback(async () => {
    if (!projectId) return;
    // Throws SettingsSaveError — the shell keeps the banner and Retry save up.
    await updateSiteColumns(projectId, { defaultLocale });
    setSavedDefault(defaultLocale);
    adoptLanguage(defaultLocale);
    await refreshTable();
  }, [projectId, defaultLocale, adoptLanguage, refreshTable]);

  React.useEffect(() => {
    if (!registerSaveHandler) return;
    registerSaveHandler(dirty ? handleSave : null);
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, dirty, handleSave]);

  /** An immediate write of the enabled list (and, from Add, maybe the default). */
  const writeLocales = async (nextEnabled: string[], nextDefault?: string) => {
    if (!projectId) return;
    await updateSiteColumns(projectId, {
      enabledLocales: nextEnabled,
      ...(nextDefault ? { defaultLocale: nextDefault } : {}),
    });
    setEnabledLocales(nextEnabled);
    if (nextDefault) {
      setSavedDefault(nextDefault);
      setDefaultLocale(nextDefault);
      adoptLanguage(nextDefault);
    } else if (!nextEnabled.includes(defaultLocale)) {
      setDefaultLocale(savedDefault);
    }
    await refreshTable();
  };

  const handleCreate = async ({ code, setAsDefault }: { code: string; setAsDefault: boolean }) => {
    // Rejects on failure; the dialog shows it.
    await writeLocales([...enabledLocales, code], setAsDefault ? code : undefined);
    setAddOpen(false);
  };

  const removeNow = async (code: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await writeLocales(enabledLocales.filter((c) => c !== code));
      setRemoving(null);
    } catch (error) {
      setActionError(`${localeLabel(code)} was not removed: ${error instanceof Error ? error.message : "try again."}`);
      setRemoving(null);
    } finally {
      setBusy(false);
    }
  };

  const askRemove = (row: LocaleRow) => {
    if (row.translated > 0) setRemoving(row);
    else void removeNow(row.code);
  };

  if (!projectId) {
    return (
      <Screen>
        <SettingsCard title="Languages">
          <div className={SCREEN_EMPTY}>Open this site from the dashboard to manage locales.</div>
        </SettingsCard>
      </Screen>
    );
  }

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Languages"
          line="Default locale, enabled locales and translation progress."
          state={load.state}
          errorLine="Couldn't load your locales. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const rows = enabledLocales.map((code) => {
    const row = locales.find((l) => l.code === code);
    return {
      code,
      path: code === savedDefault ? "/" : `/${code}`,
      translated: row?.translated ?? 0,
      total: row?.total ?? 0,
      status: row?.status ?? "NOT_STARTED",
      pending: row?.pending ?? [],
    } satisfies LocaleRow;
  });
  const defaultError = fieldErrors?.defaultLocale ?? fieldErrors?.["seo.language"];

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      {/* C-7 (PD-39): the publish pipeline emits the default locale only. Not
          on 8135:214023; kept because it is what publishing does today. */}
      <div className={SET_RESTORE_STRIP} data-testid="set-loc-publish-note">
        Per-language pages publish in a later release. Today, publishing ships the default locale only — the rows below track translation progress, not live routes.
      </div>

      <SettingsCard title="Default locale">
        <Field label="Default locale" htmlFor="default-locale" span="full">
          <Select
            id="default-locale"
            value={defaultLocale}
            aria-invalid={defaultError ? true : undefined}
            onChange={(e) => setDefaultLocale(e.target.value)}
            data-testid="set-loc-default"
          >
            {enabledLocales.map((code) => (
              <option key={code} value={code}>
                {nameOf(code)}
              </option>
            ))}
          </Select>
          {defaultError ? (
            <div role="alert" className={SCREEN_FIELD_ERROR}>
              {defaultError}
            </div>
          ) : null}
        </Field>
        <p className="tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
          Save the default locale with Save below.
        </p>
      </SettingsCard>

      <SettingsCard title="Locales">
        <div className="tw:flex tw:h-8 tw:items-center tw:gap-4">
          <p className="tw:m-0 tw:min-w-0 tw:flex-1 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-5 tw:text-[var(--bk-ink-muted)]">
            Saves immediately
          </p>
          {readOnly ? null : (
            <Button size="xs" className={ADD_BTN} onClick={() => setAddOpen(true)} data-testid="set-loc-add">
              Add locale
            </Button>
          )}
        </div>
        {actionError ? (
          <div role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-loc-action-error">
            {actionError}
          </div>
        ) : null}
        <div id="locales" role="table" aria-label="Locales" className="tw:flex tw:flex-col tw:gap-4" data-testid="set-loc-table">
          <div role="row" className={HEAD}>
            <span role="columnheader" className={COLS[0]}>Locale</span>
            <span role="columnheader" className={COLS[1]}>Translated pages</span>
            <span role="columnheader" className={COLS[2]}>
              <span className="tw:sr-only">Actions</span>
            </span>
          </div>
          {rows.map((row) => {
            const isDefault = row.code === savedDefault;
            return (
              <div key={row.code} role="row" className={BODY_ROW} data-testid={`set-loc-row-${row.code}`}>
                <span role="cell" className={COLS[0]}>
                  <Button
                    size="xs"
                    variant="ghost"
                    className={`${TEXT_BTN} tw:text-[var(--bk-ink)]`}
                    onClick={() => setChecklist(row)}
                    data-testid={`set-loc-row-open-${row.code}`}
                  >
                    {nameOf(row.code)}
                  </Button>
                </span>
                <span role="cell" className={COLS[1]} data-testid={`set-loc-row-pages-${row.code}`}>
                  {row.translated} of {row.total}
                </span>
                <span role="cell" className={COLS[2]}>
                  {isDefault ? (
                    <span className="tw:text-[var(--bk-accent)]" data-testid={`set-loc-row-default-${row.code}`}>
                      Default
                    </span>
                  ) : readOnly ? null : (
                    <Button
                      size="xs"
                      variant="ghost"
                      className={`${TEXT_BTN} tw:text-[var(--bk-accent)]`}
                      disabled={busy || enabledLocales.length <= 1}
                      onClick={() => askRemove(row)}
                      data-testid={`set-loc-row-remove-${row.code}`}
                    >
                      Remove
                    </Button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <AddLocaleDialog
        open={addOpen}
        siteName={siteName}
        enabledLocales={enabledLocales}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
      />
      <RemoveLocaleDialog
        locale={removing ? { name: localeLabel(removing.code), translated: removing.translated, total: removing.total } : null}
        busy={busy}
        onCancel={() => setRemoving(null)}
        onRemove={() => removing && void removeNow(removing.code)}
      />
      <TranslationChecklistDialog
        open={checklist !== null}
        siteName={siteName}
        locale={checklist}
        onBack={() => setChecklist(null)}
      />
    </Screen>
  );
};

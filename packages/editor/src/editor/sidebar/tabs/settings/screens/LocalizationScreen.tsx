/**
 * Languages — 2L9 B8-S07 (238:11810) · 8135:214262 (remove-locale confirm).
 *
 * Two cards, two save models (Phase B §1 row 14):
 *  - **Default language** is a footer field: picking one only stages it, the
 *    footer's Save writes `Site.defaultLocale` (the screen's own save handler,
 *    `updateSiteColumns`), and the composer adopts it as saved — the exported
 *    document's `lang` reads `seo.language` (WCAG 3.1.1).
 *  - **Languages** are objects that save immediately (SA-16): `+ Add language`
 *    (AddLocaleDialog) and `Remove` each write `enabledLocales` at once and
 *    re-read the table — never carrying the staged default with them.
 *    Remove always asks first (OWNER OVERRIDE 2026-10-04 — supersedes Q-B6
 *    "confirm only when translations exist"), and the translations are kept
 *    (they live in `Page.translations`, untouched).
 *
 * SA-05: no Auto-redirect row — the stored `localeAutoRedirect` is never sent.
 * Two reads on open, one load state: `settings.get` and `siteDetail.locales`.
 * A row's name opens the Translation checklist.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, useToast } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { updateSiteColumns } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { devError } from "@/shared/utils/devLogger";
import {
  Field,
  LoadCard,
  SCREEN_EMPTY,
  SCREEN_FIELD_ERROR,
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

/* 2L9 B8-S07 (238:11810): ruled rows — name 240, the status line, and an
   outline Remove 140 wide; the saved default has no action. */
const ROW = "tw:flex tw:min-h-12 tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-border)] tw:py-2";
const NAME = "tw:w-60 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const LINE = "tw:m-0 tw:min-w-0 tw:flex-1 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const REMOVE =
  "tw:h-8 tw:w-35 tw:shrink-0 tw:justify-start tw:bg-[var(--bk-bg-subtle)] tw:text-[length:var(--bk-text-13)] tw:font-normal tw:text-[var(--bk-ink-muted)]";
const NOTE = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";


export const LocalizationScreen: React.FC<ScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  registerSaveHandler,
  onLoadStateChange,
  registerRetryLoad,
  registerFooterMessage,
  fieldErrors,
  readOnly,
}) => {
  const { addToast, removeToast } = useToast();
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
  /* GAP-ST-L04 / L05 (277:25943 / 277:26152): the last language removed or
     put back by Undo this visit — both save at once, so the footer and the
     note say it stands apart from the staged default. */
  const [localeEvent, setLocaleEvent] = React.useState<{ code: string; kind: "removed" | "restored" } | null>(null);

  /* The toast's Undo runs after later edits: it reads the list as it is then. */
  const enabledRef = React.useRef(enabledLocales);
  enabledRef.current = enabledLocales;

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

  /* 238:11810's footer names both defaults while one is staged. */
  React.useEffect(() => {
    if (!registerFooterMessage) return;
    const event = localeEvent ? `${localeLabel(localeEvent.code)} ${localeEvent.kind}` : null;
    registerFooterMessage(
      dirty
        ? `Unsaved default: ${localeLabel(defaultLocale)} · ${event ? `${event} immediately` : `saved default: ${localeLabel(savedDefault)}`}`
        : event
          ? `Saved default: ${localeLabel(savedDefault)} · ${localeLabel(localeEvent!.code)} remains ${localeEvent!.kind}`
          : null,
    );
    return () => registerFooterMessage(null);
  }, [registerFooterMessage, dirty, defaultLocale, savedDefault, localeEvent]);

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
      setLocaleEvent({ code, kind: "removed" });
      /* 238:11810: "Français removed · Undo" — Undo adds it back, once. */
      let undone = false;
      const toastId = addToast({
        description: `${localeLabel(code)} removed`,
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => {
            if (undone) return;
            undone = true;
            removeToast(toastId);
            if (enabledRef.current.includes(code)) return;
            void writeLocales([...enabledRef.current, code])
              .then(() => setLocaleEvent({ code, kind: "restored" }))
              .catch((error: unknown) =>
                setActionError(`${localeLabel(code)} was not added back: ${error instanceof Error ? error.message : "try again."}`),
              );
          },
        },
      });
    } catch (error) {
      setActionError(`${localeLabel(code)} was not removed: ${error instanceof Error ? error.message : "try again."}`);
      setRemoving(null);
    } finally {
      setBusy(false);
    }
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
          state={load.state}
          errorLine="Couldn't load your locales. Try again."
          failure={load.failure}
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
      <SettingsCard title="Default language">
        <Field label="Default" htmlFor="default-locale" span="full">
          <Select
            id="default-locale"
            value={defaultLocale}
            aria-invalid={defaultError ? true : undefined}
            onChange={(e) => setDefaultLocale(e.target.value)}
            data-testid="set-loc-default"
          >
            {enabledLocales.map((code) => (
              <option key={code} value={code}>
                {localeLabel(code)}
              </option>
            ))}
          </Select>
          {defaultError ? (
            <div role="alert" className={SCREEN_FIELD_ERROR}>
              {defaultError}
            </div>
          ) : null}
        </Field>
        <p className={NOTE}>Changing the default applies on the next publish.</p>
      </SettingsCard>

      <SettingsCard title="Languages">
        {actionError ? (
          <div role="alert" className={SCREEN_FIELD_ERROR} data-testid="set-loc-action-error">
            {actionError}
          </div>
        ) : null}
        <div id="locales" role="list" aria-label="Languages" className="tw:flex tw:flex-col" data-testid="set-loc-table">
          {rows.map((row) => {
            const isSaved = row.code === savedDefault;
            const isChosen = dirty && row.code === defaultLocale;
            const pages = isSaved ? `${row.translated} pages translated` : `${row.translated} of ${row.total} pages translated`;
            const restored = localeEvent?.kind === "restored" && localeEvent.code === row.code;
            const status = isSaved
              ? `Saved default · ${pages}`
              : isChosen
                ? `Chosen default · unsaved · ${pages}`
                : restored
                  ? `Restored · ${pages}`
                  : pages;
            return (
              <div key={row.code} role="listitem" className={ROW} data-testid={`set-loc-row-${row.code}`}>
                <span className={NAME}>
                  {/* The name opens the Translation checklist. */}
                  <Button
                    variant="link"
                    className="tw:min-h-5 tw:text-[var(--bk-ink)] tw:no-underline tw:hover:underline"
                    onClick={() => setChecklist(row)}
                    data-testid={`set-loc-row-open-${row.code}`}
                  >
                    {localeLabel(row.code)}
                  </Button>
                </span>
                <p className={LINE} data-testid={`set-loc-row-pages-${row.code}`}>
                  {status}
                </p>
                {isSaved ? null : (
                  <Button
                    variant="secondary"
                    size="xs"
                    className={REMOVE}
                    disabled={readOnly || busy || enabledLocales.length <= 1}
                    onClick={() => setRemoving(row)}
                    data-testid={`set-loc-row-remove-${row.code}`}
                  >
                    Remove
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {/* A write: disabled, not hidden, on the read-only screen. */}
        <Button
          variant="link"
          className="tw:min-h-8 tw:self-start tw:px-3 tw:no-underline tw:hover:underline"
          disabled={readOnly}
          onClick={() => setAddOpen(true)}
          data-testid="set-loc-add"
        >
          + Add language
        </Button>
      </SettingsCard>

      {/* C-7 (PD-39) and SA-16, as 238:11810's footnote. Removing still asks
          first (owner override 2026-10-04), so the board's "removed
          immediately" reads as "saves at once". */}
      <p className={`${NOTE} tw:max-w-180`} data-testid="set-loc-publish-note">
        {localeEvent?.kind === "removed"
          ? `Only the default language is staged. ${localeLabel(localeEvent.code)} was removed immediately. Saving or discarding the default will not restore it. Publishing currently emits the default locale only.`
          : localeEvent?.kind === "restored"
            ? `Default language changes are staged. ${localeLabel(localeEvent.code)} was restored immediately. Saving or discarding the default does not change the locale list. Publishing currently emits the default locale only.`
            : "Only the default language is staged. Adding or removing a language saves at once — saving or discarding the default will not undo it. Publishing currently emits the default locale only."}
      </p>
      {localeEvent?.kind === "restored" && dirty ? (
        <p className={`${NOTE} tw:max-w-180`} data-testid="set-loc-undo-note">
          Undo restored only {localeLabel(localeEvent.code)}. It did not change the staged {localeLabel(defaultLocale)} default.
        </p>
      ) : null}

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
        onCancel={() => {
          const code = removing?.code;
          setRemoving(null);
          /* The dialog's close leaves focus on <body>: hand it back to the row that asked. */
          if (code) requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-testid="set-loc-row-remove-${code}"]`)?.focus());
        }}
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

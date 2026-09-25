/**
 * Localization — Clone 3397:32376 (`Site setup / Localization`): the
 * default locale and its auto-redirect in one card, the enabled locales and
 * their translation progress in a table below, `Add locale` in the header.
 *
 * Two reads on open, one load state (3397:33194 loading, 3397:33241
 * load-error with Try again): `siteDetail.settings.get` for the default /
 * enabled / redirect columns and `siteDetail.locales` for the table — a
 * failure of either is the failure. Edits stay here until Save, when the
 * screen's own handler writes `settings.update` with `defaultLocale`,
 * `enabledLocales` and `localeAutoRedirect` (`Site.defaultLocale` must be in
 * the enabled list or the server refuses the whole write); a refused save
 * is the banner (3397:33288). A row opens the Translation checklist
 * (3737:44869); a non-default row keeps its `Remove`. `Add locale` opens
 * the dialog (3737:44855), whose Create writes at once and re-reads here.
 *
 * URL strategy stays subdirectory (`/fr/about`; the default locale serves
 * at the root) and the codes stay bare — see the shared schema for the
 * server shapes this is typed against until the S2 backend merges.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ToggleSwitch } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { devError } from "@/shared/utils/devLogger";
import {
  LoadCard,
  SaveErrorBanner,
  SCREEN_EMPTY,
  SET_BTN,
  SET_HEAD_BTN,
  SET_RESTORE_STRIP,
  SET_ROW,
  SET_ROW_LABEL,
  SET_TABLE,
  SET_TD,
  SET_TH,
  Screen,
  pillClass,
  type PillTone,
  Section,
  Select,
} from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";
import { localeLabel } from "../constants";
import { AddLocaleDialog } from "../components/AddLocaleDialog";
import { TranslationChecklistDialog } from "../components/TranslationChecklistDialog";
import type { LocaleStatus, LocaleSummary as LocaleRow, LocalesSummary } from "@buildrik/shared/schemas/site-detail";

/**
 * The header-action slot the shell grows at merge (phase2-brief.md, "Header
 * actions"): the screen hands the shell its `Add locale`, and clears it on
 * unmount. Optional until `types.ts` carries it.
 */
export type LocalizationScreenProps = ScreenProps & {
  registerHeaderAction?: (node: React.ReactNode | null) => void;
};

/* The Locales table (4418:127966): shared header/row shape, columns 180 · 140 · 180 · 110. */
const TR = "tw:cursor-pointer tw:hover:bg-[var(--bk-bg-subtle)]";
/* The locale name is the row's keyboard door — a ghost button in the first
   cell, so a Tab lands on it and Enter opens the checklist. */
const ROW_BTN =
  "tw:h-5 tw:rounded-[var(--bk-radius-sm)] tw:border-0 tw:bg-transparent tw:px-0 tw:text-[length:var(--bk-text-13)] " +
  "tw:font-normal tw:leading-5 tw:text-[var(--bk-ink)] tw:enabled:hover:bg-transparent " +
  "tw:focus:ring-0 tw:focus:shadow-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

/* LIVE green / PENDING amber / NOT STARTED grey — the frame's three pills. */
const PILL_TONE: Record<LocaleStatus, { label: string; tone: PillTone }> = {
  LIVE: { label: "Live", tone: "success" },
  PENDING: { label: "Pending", tone: "warning" },
  NOT_STARTED: { label: "Not started", tone: "neutral" },
};

interface LocalesRead {
  row: { defaultLocale?: string | null; enabledLocales?: string[] | null; localeAutoRedirect?: boolean | null };
  summary: LocalesSummary;
}

export const LocalizationScreen: React.FC<LocalizationScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  registerSaveHandler,
  registerHeaderAction,
  onLoadStateChange,
  registerRetryLoad,
  saveError,
}) => {
  const [defaultLocale, setDefaultLocale] = React.useState("en");
  const [enabledLocales, setEnabledLocales] = React.useState<string[]>(["en"]);
  const [localeAutoRedirect, setLocaleAutoRedirect] = React.useState(false);
  const [locales, setLocales] = React.useState<LocaleRow[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [checklist, setChecklist] = React.useState<LocaleRow | null>(null);

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
      setDefaultLocale(row.defaultLocale ?? "en");
      setEnabledLocales(row.enabledLocales?.length ? row.enabledLocales : ["en"]);
      setLocaleAutoRedirect(row.localeAutoRedirect ?? false);
      setLocales(summary.locales);
      setDirty(false);
    },
    { onLoadStateChange, registerRetryLoad }
  );

  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const handleRemove = (code: string) => {
    if (code === defaultLocale || enabledLocales.length <= 1) return;
    setEnabledLocales(enabledLocales.filter((c) => c !== code));
    setDirty(true);
  };

  const handleSave = React.useCallback(async () => {
    if (!projectId) return;
    // Rejects on failure — the shell's Save keeps the banner and Retry save up.
    await getBuildrikClient(DASHBOARD_URL).siteDetail.settings.update.mutate({
      id: projectId,
      defaultLocale,
      enabledLocales,
      localeAutoRedirect,
    });
    /* The exported document's `lang` comes from the project's own SEO block,
       which no screen writes — so every published page announced itself as
       English however this was set. The document language is not routing:
       it is what a screen reader uses to choose a voice (WCAG 3.1.1). */
    if (composer) {
      const current = composer.getProjectSettings();
      if (current.seo?.language !== defaultLocale) {
        composer.setProjectSettings({
          ...current,
          seo: { ...current.seo, language: defaultLocale },
        });
      }
    }
    setDirty(false);
    /* The table's status and path follow the server (a new default is LIVE
       at `/`), so it is re-read quietly after the write — the save has
       already succeeded, and a stale table is the only cost of this failing. */
    try {
      setLocales((await getBuildrikClient(DASHBOARD_URL).siteDetail.locales.query({ siteId: projectId })).locales);
    } catch (error) {
      devError("settings", `locales refresh failed for site ${projectId}`, error);
    }
  }, [projectId, defaultLocale, enabledLocales, localeAutoRedirect, composer]);

  // The shell's Save changes runs this instead of composer.saveProject(),
  // which omits the locale columns. Registered only while there is something
  // to save.
  React.useEffect(() => {
    if (!registerSaveHandler) return;
    registerSaveHandler(dirty ? handleSave : null);
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, dirty, handleSave]);

  // `Add locale` sits in the shell's header (3397:32376), and only once the
  // rows are here — the loading and load-error frames draw the header bare.
  const ready = load.state === "ready" && !!projectId;
  React.useEffect(() => {
    if (!registerHeaderAction) return;
    registerHeaderAction(
      ready ? (
        <Button size="xs" className={SET_HEAD_BTN} onClick={() => setAddOpen(true)} data-testid="set-loc-add">
          Add locale
        </Button>
      ) : null
    );
    return () => registerHeaderAction(null);
  }, [registerHeaderAction, ready]);

  const handleCreate = async ({ code, setAsDefault }: { code: string; setAsDefault: boolean }) => {
    if (!projectId) return;
    /* Create is a save of the screen as it stands plus the new locale —
       nothing on screen snaps back when the dialog closes and the rows
       re-read. Rejects on failure; the dialog shows it. */
    await getBuildrikClient(DASHBOARD_URL).siteDetail.settings.update.mutate({
      id: projectId,
      defaultLocale: setAsDefault ? code : defaultLocale,
      enabledLocales: [...enabledLocales, code],
      localeAutoRedirect,
    });
    setAddOpen(false);
    load.retry();
  };

  if (!projectId) {
    return (
      <Screen>
        <Section title="Localization">
          <div className={SCREEN_EMPTY}>Open this site from the dashboard to manage locales.</div>
        </Section>
      </Screen>
    );
  }

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Localization"
          line="Default locale, enabled locales and translation progress."
          state={load.state}
          errorLine="Couldn't load your locales. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  /* The table is the server's rows for the locales enabled HERE: a Remove
     not yet saved hides its row; the default's path is `/`, the rest `/<code>`
     — so a default changed here moves the `/` before Save. */
  const rows = enabledLocales.map((code) => {
    const row = locales.find((l) => l.code === code);
    return {
      code,
      path: code === defaultLocale ? "/" : `/${code}`,
      translated: row?.translated ?? 0,
      total: row?.total ?? 0,
      status: row?.status ?? "NOT_STARTED",
      pending: row?.pending ?? [],
    };
  });

  return (
    <Screen>
      {saveError ? <SaveErrorBanner message={saveError} /> : null}

      <div className={SET_RESTORE_STRIP} data-testid="set-loc-restore">
        Restoring a site version leaves this configuration unchanged.
      </div>

      <Section title="Default">
        <div className={SET_ROW}>
          <label htmlFor="default-locale" className={SET_ROW_LABEL}>
            Default locale
          </label>
          <Select
            id="default-locale"
            className="tw:min-w-0 tw:flex-1"
            value={defaultLocale}
            onChange={(e) => {
              setDefaultLocale(e.target.value);
              setDirty(true);
            }}
            data-testid="set-loc-default"
          >
            {enabledLocales.map((code) => (
              <option key={code} value={code}>
                {localeLabel(code)} ({code})
              </option>
            ))}
          </Select>
        </div>
        <div className={SET_ROW}>
          <span id="locale-auto-redirect-label" className={SET_ROW_LABEL}>
            Auto-redirect by browser
          </span>
          <ToggleSwitch
            id="locale-auto-redirect"
            checked={localeAutoRedirect}
            onChange={(next) => {
              setLocaleAutoRedirect(next);
              setDirty(true);
            }}
            aria-labelledby="locale-auto-redirect-label"
            sizing="md"
            data-testid="set-loc-redirect"
          />
        </div>
      </Section>

      <Section title="Locales">
        <table id="locales" className={SET_TABLE} data-testid="set-loc-table">
          <thead>
            <tr>
              <th scope="col" className={`${SET_TH} tw:w-48`}>Locale</th>
              <th scope="col" className={`${SET_TH} tw:w-38`}>Path</th>
              <th scope="col" className={`${SET_TH} tw:w-48`}>Pages translated</th>
              <th scope="col" className={`${SET_TH} tw:w-[122px]`}>Status</th>
              <th scope="col" className={SET_TH}>
                <span className="tw:sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tone = PILL_TONE[row.status];
              const isDefault = row.code === defaultLocale;
              return (
                <tr
                  key={row.code}
                  className={TR}
                  onClick={() => setChecklist(row)}
                  data-testid={`set-loc-row-${row.code}`}
                >
                  <td className={SET_TD}>
                    <Button
                      size="xs"
                      variant="ghost"
                      className={ROW_BTN}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setChecklist(row);
                      }}
                      data-testid={`set-loc-row-open-${row.code}`}
                    >
                      {localeLabel(row.code)}
                    </Button>
                  </td>
                  <td className={`${SET_TD} tw:text-[var(--bk-ink-soft)]`}>{row.path}</td>
                  <td className={`${SET_TD} tw:text-[var(--bk-ink-soft)]`} data-testid={`set-loc-row-pages-${row.code}`}>
                    {row.translated} of {row.total}
                  </td>
                  <td className={SET_TD}>
                    <span className={pillClass(tone.tone)} data-testid={`set-loc-row-status-${row.code}`}>
                      {tone.label}
                    </span>
                  </td>
                  <td className={`${SET_TD} tw:pr-0 tw:text-right`}>
                    {isDefault ? null : (
                      <Button
                        size="xs"
                        variant="ghost"
                        className={`${SET_BTN} tw:h-5 tw:px-2`}
                        disabled={enabledLocales.length <= 1}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleRemove(row.code);
                        }}
                        data-testid={`set-loc-row-remove-${row.code}`}
                      >
                        Remove
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      <AddLocaleDialog
        open={addOpen}
        siteName={siteName}
        enabledLocales={enabledLocales}
        onClose={() => setAddOpen(false)}
        onCreate={handleCreate}
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

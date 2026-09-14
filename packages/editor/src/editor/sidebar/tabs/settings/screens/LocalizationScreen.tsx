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
 * at the root) and the codes stay bare — see `localesContract.ts` for the
 * server shapes this is typed against until the S2 backend merges.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Badge, Button, ToggleSwitch } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { devError } from "@/shared/utils/devLogger";
import { LoadCard, SaveErrorBanner, SCREEN_EMPTY, SET_BTN, Screen, Section, Select } from "../shared";
import { useServerLoad } from "../hooks/useServerLoad";
import type { ScreenProps } from "../types";
import { localeLabel } from "../constants";
import { AddLocaleDialog } from "../components/AddLocaleDialog";
import { TranslationChecklistDialog } from "../components/TranslationChecklistDialog";
import {
  readLocales,
  readLocaleSettings,
  writeLocaleSettings,
  type LocaleRow,
  type LocaleSettingsRow,
  type LocaleStatus,
  type LocalesSummary,
} from "./localesContract";

/**
 * The header-action slot the shell grows at merge (phase2-brief.md, "Header
 * actions"): the screen hands the shell its `Add locale`, and clears it on
 * unmount. Optional until `types.ts` carries it.
 */
export type LocalizationScreenProps = ScreenProps & {
  registerHeaderAction?: (node: React.ReactNode | null) => void;
};

/* The amber strip under the header: --bk-warning ink on the warning tint. */
const RESTORE_STRIP =
  "tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-yellow-100)] tw:bg-[var(--bk-warning-tint)] " +
  "tw:px-3 tw:py-2.5 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-warning)]";

/* Label-left rows, as the Default card draws them (the SEO screen's Indexing
   card is the same shape): a 144 label column, the control after it. */
const ROW = "tw:col-span-full tw:flex tw:items-center tw:gap-4";
const ROW_LABEL = "tw:w-36 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]";

/* The Locales table: an eyebrow header row on a hairline, 32-high body rows. */
const TH =
  "tw:h-8 tw:pr-4 tw:text-left tw:align-middle tw:text-[length:var(--bk-text-11)] tw:font-medium tw:uppercase " +
  "tw:leading-4 tw:tracking-[0.06em] tw:text-[var(--bk-ink-muted)]";
const TD = "tw:h-8 tw:pr-4 tw:align-middle tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const TR = "tw:cursor-pointer tw:hover:bg-[var(--bk-bg-subtle)]";
/* The locale name is the row's keyboard door — a ghost button in the first
   cell, so a Tab lands on it and Enter opens the checklist. */
const ROW_BTN =
  "tw:h-6 tw:rounded-[var(--bk-radius-sm)] tw:border-0 tw:bg-transparent tw:px-0 tw:text-[length:var(--bk-text-13)] " +
  "tw:font-normal tw:leading-5 tw:text-[var(--bk-ink)] tw:enabled:hover:bg-transparent " +
  "tw:focus:ring-0 tw:focus:shadow-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

/* LIVE green / PENDING amber / NOT STARTED grey — the frame's three pills. */
const PILL =
  "tw:inline-flex tw:h-5 tw:items-center tw:rounded-[var(--bk-radius-sm)] tw:border tw:px-2 tw:py-0 " +
  "tw:text-[length:var(--bk-text-11)] tw:font-semibold tw:uppercase tw:leading-4 tw:tracking-[0.04em]";
const PILL_TONE: Record<LocaleStatus, { label: string; className: string }> = {
  LIVE: { label: "Live", className: "tw:border-[var(--bk-success)] tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-success-text)]" },
  PENDING: { label: "Pending", className: "tw:border-[var(--bk-yellow-300)] tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]" },
  NOT_STARTED: { label: "Not started", className: "tw:border-[var(--bk-border-medium)] tw:bg-[var(--bk-bg-subtle)] tw:text-[var(--bk-ink-soft)]" },
};

interface LocalesRead {
  row: LocaleSettingsRow;
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
      const [row, summary] = await Promise.all([readLocaleSettings(client, siteId), readLocales(client, siteId)]);
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
    await writeLocaleSettings(getBuildrikClient(DASHBOARD_URL), {
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
      setLocales((await readLocales(getBuildrikClient(DASHBOARD_URL), projectId)).locales);
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
        <Button size="xs" className={SET_BTN} onClick={() => setAddOpen(true)} data-testid="set-loc-add">
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
    await writeLocaleSettings(getBuildrikClient(DASHBOARD_URL), {
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

      <div className={RESTORE_STRIP} data-testid="set-loc-restore">
        Restoring a site version leaves this configuration unchanged.
      </div>

      <Section title="Default">
        <div className={ROW}>
          <label htmlFor="default-locale" className={ROW_LABEL}>
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
        <div className={ROW}>
          <span id="locale-auto-redirect-label" className={ROW_LABEL}>
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
            sizing="sm"
            data-testid="set-loc-redirect"
          />
        </div>
      </Section>

      <Section title="Locales">
        <table id="locales" className="tw:w-full tw:border-collapse" data-testid="set-loc-table">
          <thead>
            <tr className="tw:border-b tw:border-[var(--bk-border)]">
              <th scope="col" className={`${TH} tw:w-[30%]`}>Locale</th>
              <th scope="col" className={`${TH} tw:w-[22%]`}>Path</th>
              <th scope="col" className={`${TH} tw:w-[28%]`}>Pages translated</th>
              <th scope="col" className={TH}>Status</th>
              <th scope="col" className={TH}>
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
                  <td className={TD}>
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
                  <td className={`${TD} tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-12)]`}>{row.path}</td>
                  <td className={TD} data-testid={`set-loc-row-pages-${row.code}`}>
                    {row.translated} of {row.total}
                  </td>
                  <td className={TD}>
                    <Badge className={`${PILL} ${tone.className}`} data-testid={`set-loc-row-status-${row.code}`}>
                      {tone.label}
                    </Badge>
                  </td>
                  <td className={`${TD} tw:pr-0 tw:text-right`}>
                    {isDefault ? null : (
                      <Button
                        size="xs"
                        variant="ghost"
                        className={`${SET_BTN} tw:h-6 tw:px-2`}
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

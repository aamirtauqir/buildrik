/**
 * Redirects — PUBLISHING / Redirects (8136:214826 csv-actions, 8136:215047
 * import, 8136:215307 import-error, 8136:215568 import-success, 8136:215838
 * deleted-undo; states from 4418:128227 / 4418:130172 loading / 4418:130272
 * empty / 4418:130372 load-error / 4418:133735 save-error).
 *
 * Everything here applies as it happens (`immediate`): the rules and the
 * suggestions come from `redirects.list` + `redirects.suggestions` on open.
 * The header carries `Import CSV` · `Export CSV` · `Add redirect`
 * (`registerHeaderAction`; Import and Export are code-ahead — 2L9 B8-S10
 * draws neither). Card **Redirects · n** (B8-S10 238:12721): a ruled row per
 * rule — "from → to" (opens RedirectDialog to edit), "301 · permanent", and
 * `Delete`, which removes the rule at once (owner 2026-10-26: the board over
 * the 2026-10-04 ask-first) with a "Redirect deleted · Undo" toast that
 * creates the same rule again; `+ Add redirect` closes the card. The Edit
 * dialog's delete still asks first and ends in the same toast. Import is all-or-nothing on the server
 * (RedirectCsvDialog → `redirects.import_csv`; the toast says how many were
 * created); Export downloads `redirects.export_csv`. Card **404 suggester**:
 * `Suggest redirects from 404s` writes `projectSettings.redirects
 * .suggestFrom404s` at once (`siteDetail.projectSettings.update`, SA-16) and
 * the composer adopts the saved value; under it one row per suggestion — an
 * old page slug with no rule, `renamed <d MMM>` — with `Accept` (a 301 at
 * once). A refused action shows the banner.
 *
 * The Pages door: the shell passes `repair` after a slug change was saved in
 * Page settings, and the URL repair draft (3519:19920) sits above the rules
 * until it is saved (3519:20096 — the rule joins the table, `Back to <Page>
 * SEO` returns through `ui:pages-open-settings`) or cancelled;
 * `onRepairDone` tells the shell either way.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ToggleSwitch, useToast } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { EVENTS } from "@/shared/constants/events";
import { updateProjectSettings } from "@/services/BuildrikSyncProvider";
import {
  LoadCard,
  SET_BTN,
  SET_ROW,
  SET_ROW_LABEL,
  SaveErrorBanner,
  Screen,
  Section,
} from "../shared";
import { ACTION_ERROR_MESSAGES } from "../constants";
import { useServerLoad } from "../hooks/useServerLoad";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
import { RedirectCsvDialog } from "../components/RedirectCsvDialog";
import type { RedirectRepair, ScreenProps } from "../types";
import { RedirectDialog, type RedirectDraft } from "../components/RedirectDialog";
import { RedirectRepairCard } from "../components/RedirectRepairCard";
import type { RedirectSuggestion, RedirectType } from "@buildrik/shared/schemas/site-detail";

export interface RedirectsScreenProps extends ScreenProps {
  /** The Pages door's URL-repair draft (3519:19920), handed down by the shell from `ui:settings-open`; slugs bare or as paths. */
  repair?: RedirectRepair | null;
  /** The draft was saved or cancelled — the shell drops `repair`. */
  onRepairDone?: () => void;
}

/** What this screen reads of a `Redirect` row (`redirects.list` returns a superset). */
export interface RedirectRow {
  id: string;
  fromPath: string;
  toUrl: string;
  /** "301" | "302" — a String column; the dialog reads it as the enum. */
  type: string;
  matchQuery: boolean;
  notes: string | null;
}

const asType = (type: string): RedirectType => (type === "302" ? "302" : "301");


const asPath = (slug: string) => (slug.startsWith("/") ? slug : `/${slug}`);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** `12 Sep` — the day the page was renamed; locale-free so the row reads the same everywhere. */
export function renamedDay(iso: string): string | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

type Dialog = { mode: "add" } | { mode: "edit"; row: RedirectRow } | null;

interface RepairCard extends RedirectRepair {
  saved: { fromPath: string; toUrl: string } | null;
}

// ─── Chrome ──────────────────────────────────────────────────────────────────

const LINE = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";
const MUTED = "tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/* `Accept` — the frame draws it as plain ink text at the 192 column, no
   border or fill; the link recipe (no box, hover underline) in ink. */
const ACCEPT_BTN = "tw:text-[var(--bk-ink)]";

/* 8136:214826's header actions: three 32-high buttons, 122 wide, in an 8 gap —
   two text buttons and the accent primary. */
const HEAD_BTN = `${SET_BTN} tw:w-30.5`;
const HEAD_GHOST =
  `${HEAD_BTN} tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)] ` +
  "tw:disabled:bg-transparent tw:disabled:text-[var(--bk-gray-400)]";

/* B8-S10: ruled 48 rows — the rule (240), its type (muted), Delete (140). */
const RULE_ROW = "tw:flex tw:min-h-12 tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-border)]";
const RULE_LINK =
  "tw:h-8 tw:w-60 tw:shrink-0 tw:justify-start tw:truncate tw:px-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:text-[var(--bk-ink)] tw:no-underline tw:hover:underline";
const RULE_ACTION = "tw:h-8 tw:w-35 tw:shrink-0 tw:justify-start tw:px-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:no-underline tw:hover:underline";
const typeLine = (type: string) => (type === "302" ? "302 · temporary" : "301 · permanent");

/** A browser download of `text` as `name`. */
function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export const RedirectsScreen: React.FC<RedirectsScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  onLoadStateChange,
  registerRetryLoad,
  registerHeaderAction,
  saveError,
  repair,
  onRepairDone,
}) => {
  const siteName = composer?.getProjectMetadata?.()?.name ?? "";

  const { addToast, removeToast } = useToast();

  // ── The suggester switch: applies at once (SA-16) ──
  const { value: suggestSaved } = useSettingsScreen(composer, (s) => s.redirects?.suggestFrom404s ?? true, true);
  const [suggest, setSuggest] = React.useState(suggestSaved);
  const [suggestBusy, setSuggestBusy] = React.useState(false);
  React.useEffect(() => setSuggest(suggestSaved), [suggestSaved]);

  // Nothing here waits for the footer's Save.
  React.useEffect(() => {
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  const toggleSuggest = async (next: boolean) => {
    setSuggest(next);
    if (!projectId) return;
    setSuggestBusy(true);
    setActionFailed(false);
    try {
      await updateProjectSettings(projectId, { redirects: { suggestFrom404s: next } });
      // The server has it: the composer adopts it (no dirty flag, no autosave).
      if (composer) {
        const current = composer.getProjectSettings();
        composer.adoptSavedProjectSettings({ ...current, redirects: { ...current.redirects, suggestFrom404s: next } });
      }
    } catch {
      setSuggest(!next);
      setActionFailed(true);
    } finally {
      setSuggestBusy(false);
    }
  };

  // ── The server rows ──
  const [rows, setRows] = React.useState<RedirectRow[]>([]);
  const [suggestions, setSuggestions] = React.useState<RedirectSuggestion[]>([]);
  const [dialog, setDialog] = React.useState<Dialog>(null);
  const [accepting, setAccepting] = React.useState<number | null>(null);
  const [actionFailed, setActionFailed] = React.useState(false);

  const load = useServerLoad<{ list: RedirectRow[]; suggestions: RedirectSuggestion[] }>(
    projectId,
    async (client, siteId) => {
      const [list, suggested] = await Promise.all([
        client.siteDetail.redirects.list.query({ siteId }),
        client.siteDetail.redirects.suggestions.query({ siteId }),
      ]);
      return { list, suggestions: suggested };
    },
    ({ list, suggestions: suggested }) => {
      setRows(list);
      setSuggestions(suggested);
    },
    { onLoadStateChange, registerRetryLoad },
  );

  const api = () => getBuildrikClient(DASHBOARD_URL).siteDetail.redirects;

  /* After an action: the rows and the suggestions as the server now has them
     (a created rule also takes its suggestion away), without the load card
     in between. A read that fails here goes back through the load path, so
     the failure is the load-error card and its Try again, not stale rows. */
  const relist = React.useCallback(async () => {
    if (!projectId) return;
    try {
      const [list, suggested] = await Promise.all([
        api().list.query({ siteId: projectId }),
        api().suggestions.query({ siteId: projectId }),
      ]);
      setRows(list);
      setSuggestions(suggested);
    } catch {
      load.retry();
    }
  }, [projectId, load.retry]);

  const ready = load.state === "ready";
  const hasRows = rows.length > 0;

  const [csvOpen, setCsvOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const exportCsv = React.useCallback(async () => {
    if (!projectId) return;
    setExporting(true);
    setActionFailed(false);
    try {
      const { csv } = await getBuildrikClient(DASHBOARD_URL).siteDetail.redirects.export_csv.query({ siteId: projectId });
      download("redirects.csv", csv);
    } catch {
      setActionFailed(true);
    } finally {
      setExporting(false);
    }
  }, [projectId]);

  // 8136:214826 — `Import CSV` · `Export CSV` · `Add redirect`; the shell
  // renders them. On the empty card `Add redirect` is the card's own.
  React.useEffect(() => {
    if (!registerHeaderAction) return;
    if (!ready) {
      registerHeaderAction(null);
      return;
    }
    registerHeaderAction(
      <div className="tw:flex tw:items-center tw:gap-2">
        <Button type="button" size="xs" variant="ghost" className={HEAD_GHOST} id="rd-import-csv" onClick={() => setCsvOpen(true)} data-testid="set-rd-import">
          Import CSV
        </Button>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className={HEAD_GHOST}
          id="rd-export-csv"
          disabled={!hasRows || exporting}
          onClick={() => void exportCsv()}
          data-testid="set-rd-export"
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>,
    );
    return () => registerHeaderAction(null);
  }, [registerHeaderAction, ready, hasRows, exporting, exportCsv]);

  const importCsv = async (csv: string) => {
    if (!projectId) return;
    const { created } = await api().import_csv.mutate({ siteId: projectId, csv });
    setCsvOpen(false);
    addToast({
      title: `Created ${created}`,
      description: `${created} redirect ${created === 1 ? "rule was" : "rules were"} imported.`,
    });
    await relist();
  };

  // Deletes (the caller has confirmed); the toast's Undo creates the same rule again (8136:215838).
  // Rejects when the server refuses — each caller shows that in its own place.
  const deleteRule = async (row: RedirectRow) => {
    if (!projectId) return;
    await api().delete.mutate({ id: row.id });
    setRows((current) => current.filter((r) => r.id !== row.id));
    /* Undo runs once: a toast holding focus never times out, and a second
       Undo would post the restored rule again (409, "not saved" banner). */
    let undone = false;
    const toastId = addToast({
      description: "Redirect deleted",
      duration: 8000,
      action: {
        label: "Undo",
        onClick: () => {
          if (undone) return;
          undone = true;
          removeToast(toastId);
          void (async () => {
            try {
              await api().create.mutate({
                siteId: projectId,
                fromPath: row.fromPath,
                toUrl: row.toUrl,
                type: asType(row.type),
                matchQuery: row.matchQuery,
                notes: row.notes ?? undefined,
              });
            } catch {
              setActionFailed(true);
            }
            await relist();
          })();
        },
      },
    });
    await relist();
  };

  // A row's Delete — at once, with Undo in the toast: a refusal is the banner.
  const deleteRow = async (row: RedirectRow) => {
    setActionFailed(false);
    try {
      await deleteRule(row);
    } catch {
      setActionFailed(true);
    }
  };

  // ── The dialog's three writes: resolve = close + re-list, reject = inline in the dialog ──
  const submitDialog = async (draft: RedirectDraft) => {
    if (!projectId || !dialog) return;
    if (dialog.mode === "edit") await api().update.mutate({ id: dialog.row.id, ...draft });
    else await api().create.mutate({ siteId: projectId, ...draft });
    setDialog(null);
    await relist();
  };

  const deleteFromDialog = async () => {
    if (!dialog || dialog.mode !== "edit") return;
    await deleteRule(dialog.row);
    setDialog(null);
  };

  // ── Accept: a 301 at once; a refusal is the banner ──
  const accept = async (i: number) => {
    const s = suggestions[i];
    if (!projectId || !s) return;
    setAccepting(i);
    setActionFailed(false);
    try {
      await api().create.mutate({ siteId: projectId, fromPath: s.fromPath, toUrl: s.toUrl, type: "301" });
      await relist();
    } catch {
      setActionFailed(true);
    } finally {
      setAccepting(null);
    }
  };

  // ── The Pages door ──
  const [repairCard, setRepairCard] = React.useState<RepairCard | null>(null);
  /* Keyed on the door's four values, not the object: a shell that rebuilds
     the prop each render must not reset a half-edited draft. */
  const repairRef = React.useRef(repair);
  repairRef.current = repair;
  const repairKey = repair ? `${repair.pageId}\u0000${repair.pageName}\u0000${repair.from}\u0000${repair.to}` : null;
  React.useEffect(() => {
    const door = repairRef.current;
    if (!repairKey || !door) return;
    setRepairCard({ ...door, from: asPath(door.from), to: asPath(door.to), saved: null });
  }, [repairKey]);

  const saveRepair = async (fromPath: string, toUrl: string) => {
    if (!projectId) return;
    await api().create.mutate({ siteId: projectId, fromPath, toUrl, type: "301" });
    setRepairCard((current) => (current ? { ...current, saved: { fromPath, toUrl } } : current));
    onRepairDone?.();
    await relist();
  };

  const cancelRepair = () => {
    setRepairCard(null);
    onRepairDone?.();
  };

  /* StudioPanels handles this one: it switches to the Pages tab itself and
     holds the request until the lazy panel mounts, so no `ui:switch-tab`
     precedes it. */
  const backToSeo = () => {
    const pageId = repairCard?.pageId;
    const saved = repairCard?.saved;
    setRepairCard(null);
    if (!composer || !pageId) return;
    /* 67:11341: the SEO tab names the redirect that was just saved. */
    composer.emit(EVENTS.UI_PAGES_OPEN_SETTINGS, {
      pageId,
      tab: "seo",
      ...(saved ? { redirectSaved: { from: saved.fromPath, to: saved.toUrl } } : {}),
    });
  };

  if (!projectId) {
    return (
      <Screen>
        <Section title="Redirects" desc="Open a real site to manage its redirects.">
          <div className={LINE}>The demo project has no redirects.</div>
        </Section>
      </Screen>
    );
  }

  if (load.state !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Redirects"
          state={load.state}
          errorLine="Couldn't load your redirects. Try again."
          failure={load.failure}
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const banner = saveError ?? (actionFailed ? ACTION_ERROR_MESSAGES.redirects : null);
  const visibleSuggestions = suggest ? suggestions : [];

  return (
    <Screen>
      {banner ? <SaveErrorBanner message={banner} /> : null}

      {repairCard ? (
        <RedirectRepairCard
          pageName={repairCard.pageName}
          siteName={siteName}
          from={repairCard.from}
          to={repairCard.to}
          saved={repairCard.saved}
          onSave={saveRepair}
          onCancel={cancelRepair}
          onBack={backToSeo}
        />
      ) : null}

      <Section title={`Redirects · ${rows.length}`} anchor="redirect-rules">
        {!hasRows ? (
          <div className="tw:flex tw:flex-col tw:items-start tw:gap-3" data-testid="set-rd-empty">
            <div className={LINE}>No redirects yet. Add one to send an old URL to a new one, or import a CSV.</div>
          </div>
        ) : (
          <div id="rd-rules" aria-label="Redirect rules" className="tw:flex tw:flex-col tw:gap-2.5" data-testid="set-rd-table">
            {rows.map((row) => (
              <div key={row.id} className={RULE_ROW} data-testid={`set-rd-row-${row.id}`}>
                <Button
                  type="button"
                  size="xs"
                  variant="link"
                  className={RULE_LINK}
                  title={`${row.fromPath} → ${row.toUrl}`}
                  onClick={() => setDialog({ mode: "edit", row })}
                  aria-label={`Edit redirect from ${row.fromPath}`}
                  data-testid={`set-rd-edit-${row.id}`}
                >
                  <span className="tw:truncate">{`${row.fromPath} → ${row.toUrl}`}</span>
                </Button>
                <span className="tw:min-w-0 tw:flex-1 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">{typeLine(row.type)}</span>
                <Button
                  type="button"
                  size="xs"
                  variant="link"
                  className={RULE_ACTION}
                  onClick={() => void deleteRow(row)}
                  aria-label={`Delete redirect from ${row.fromPath}`}
                  data-testid={`set-rd-delete-${row.id}`}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          size="xs"
          variant="link"
          className={`${RULE_ACTION} tw:mt-2 tw:w-fit tw:px-3`}
          onClick={() => setDialog({ mode: "add" })}
          data-testid="set-rd-add"
        >
          + Add redirect
        </Button>
      </Section>

      <Section title="404 suggester">
        <div className={SET_ROW}>
          <span id="rd-suggest-from-404s-label" className={SET_ROW_LABEL}>
            Suggest redirects from 404s
          </span>
          <ToggleSwitch
            id="rd-suggest-from-404s"
            checked={suggest}
            onChange={(next) => void toggleSuggest(next)}
            disabled={suggestBusy}
            aria-labelledby="rd-suggest-from-404s-label"
            sizing="md"
            data-testid="set-rd-suggest-toggle"
          />
        </div>
        {suggest && visibleSuggestions.length === 0 ? (
          <div className={LINE} data-testid="set-rd-suggest-empty">
            No suggestions — every renamed page already has a redirect.
          </div>
        ) : null}
        {visibleSuggestions.map((s, i) => {
          const day = renamedDay(s.changedAt);
          return (
            <div key={`${s.pageId}-${s.fromPath}`} className={SET_ROW} data-testid={`set-rd-suggestion-${i}`}>
              <span className={`${SET_ROW_LABEL} tw:text-[var(--bk-ink)]`}>
                {s.fromPath} → {s.toUrl}
                {day ? <span className={MUTED}> renamed {day}</span> : null}
              </span>
              <Button
                type="button"
                variant="link"
                className={ACCEPT_BTN}
                disabled={accepting !== null}
                onClick={() => void accept(i)}
                aria-label={`Accept redirect from ${s.fromPath} to ${s.toUrl}`}
                data-testid={`set-rd-accept-${i}`}
              >
                {accepting === i ? "Accepting…" : "Accept"}
              </Button>
            </div>
          );
        })}
      </Section>

      <RedirectDialog
        open={dialog !== null}
        mode={dialog?.mode ?? "add"}
        siteName={siteName}
        initial={dialog?.mode === "edit" ? { ...dialog.row, type: asType(dialog.row.type) } : null}
        onSubmit={submitDialog}
        onDelete={dialog?.mode === "edit" ? deleteFromDialog : undefined}
        onCancel={() => setDialog(null)}
      />

      <RedirectCsvDialog open={csvOpen} onImport={importCsv} onCancel={() => setCsvOpen(false)} />
    </Screen>
  );
};

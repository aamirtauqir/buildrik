/**
 * Redirects — Clone 3397:32517 (`SEO & publishing / Redirects`): the site's
 * redirect rules and the 404 suggester.
 *
 * The rows and the suggestions come from `redirects.list` + `redirects
 * .suggestions` on open, one load (3397:33479 loading, 3397:33573
 * load-error with Try again). Card **Redirects**: the table `FROM PATH · TO
 * URL · TYPE` with an `Edit` per row → 4254:75747; none → the card's own
 * line + `Add redirect` (3397:33526). `Add redirect` in the shell's header
 * (`registerHeaderAction`) opens 4254:75736. Every row action lands on the
 * server as it is confirmed — create / update / delete through the dialog,
 * which keeps a refusal inline — and re-lists. Card **404 suggester**:
 * `Suggest redirects from 404s` is `projectSettings.redirects
 * .suggestFrom404s`, the ONE thing the footer saves (composer-backed, the
 * flush handler); under it one row per suggestion — an old page slug with no
 * rule, the source being the page slug history, hence `renamed <d MMM>` —
 * with `Accept` (a 301 at once, the row leaves); off → the rows hide; none →
 * the empty line. A refused Accept shows the banner (3951:26730).
 *
 * The Pages door: the shell passes `repair` after a slug change was saved in
 * Page settings, and the URL repair draft (3519:19920) sits above the
 * Redirects card until it is saved (3519:20096 — the rule joins the table,
 * `Back to <Page> SEO` returns through `ui:pages-open-settings`) or
 * cancelled; `onRepairDone` tells the shell either way.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ToggleSwitch } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { EVENTS } from "@/shared/constants/events";
import { LoadCard, SET_BTN, SET_RESTORE_STRIP, SET_ROW, SET_ROW_LABEL, SaveErrorBanner, Screen, Section } from "../shared";
import { SAVE_ERROR_MESSAGES } from "../constants";
import { useServerLoad } from "../hooks/useServerLoad";
import { useSettingsScreen } from "../hooks/useSettingsScreen";
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

const CARD_LINE = "Old URLs sent to new ones, and the 404 suggester.";

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

const TABLE = "tw:w-full tw:border-collapse tw:text-left tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const TH =
  "tw:h-7 tw:border-b tw:border-[var(--bk-border)] tw:pr-4 tw:text-[length:var(--bk-text-11)] tw:font-medium " +
  "tw:uppercase tw:leading-4 tw:tracking-[0.06em] tw:text-[var(--bk-ink-muted)]";
/* 40-high rows: the 32 Edit button plus 4 of air each side. */
const TD = "tw:h-10 tw:pr-4 tw:align-middle";
const TD_PATH = `${TD} tw:max-w-0 tw:truncate`;

const LINE = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]";
const MUTED = "tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/* `Accept` — the frame draws it as plain ink text at the 192 column, no
   border or fill; the link recipe (no box, hover underline) in ink. */
const ACCEPT_BTN = "tw:text-[var(--bk-ink)]";

// ─── Screen ──────────────────────────────────────────────────────────────────

export const RedirectsScreen: React.FC<RedirectsScreenProps> = ({
  composer,
  projectId,
  onDirtyChange,
  registerFlushHandler,
  onLoadStateChange,
  registerRetryLoad,
  registerHeaderAction,
  saveError,
  repair,
  onRepairDone,
}) => {
  const siteName = composer?.getProjectMetadata?.()?.name ?? "";

  // ── The suggester switch: the one thing the footer saves ──
  const { value: suggestSaved } = useSettingsScreen(composer, (s) => s.redirects?.suggestFrom404s ?? true, true);
  const [suggest, setSuggest] = React.useState(suggestSaved);
  React.useEffect(() => setSuggest(suggestSaved), [suggestSaved]);

  /* Dirty is the local switch against the composer's value: a Save flushes
     the switch in, the composer's value follows, and the next flip is dirty
     again — where a one-way `markDirty` would stay stuck after the first Save. */
  const dirty = suggest !== suggestSaved;
  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const suggestRef = React.useRef(suggest);
  suggestRef.current = suggest;
  React.useEffect(() => {
    if (!composer || !registerFlushHandler) return;
    registerFlushHandler(() => {
      const current = composer.getProjectSettings();
      composer.setProjectSettings({
        ...current,
        redirects: { ...current.redirects, suggestFrom404s: suggestRef.current },
      });
    });
    return () => registerFlushHandler(null);
  }, [composer, registerFlushHandler]);

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

  // The header's `Add redirect` (3397:32517) — the shell renders it. On the
  // empty card the button is the card's own, so the header carries none.
  React.useEffect(() => {
    if (!registerHeaderAction) return;
    if (!ready || !hasRows) {
      registerHeaderAction(null);
      return;
    }
    registerHeaderAction(
      <Button type="button" size="xs" className={`${SET_BTN} tw:shrink-0`} onClick={() => setDialog({ mode: "add" })} data-testid="set-rd-add">
        Add redirect
      </Button>,
    );
    return () => registerHeaderAction(null);
  }, [registerHeaderAction, ready, hasRows]);

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
    await api().delete.mutate({ id: dialog.row.id });
    setDialog(null);
    await relist();
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
  const repairKey = repair ? `${repair.pageId} ${repair.pageName} ${repair.from} ${repair.to}` : null;
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
    setRepairCard(null);
    if (!composer || !pageId) return;
    composer.emit(EVENTS.UI_PAGES_OPEN_SETTINGS, { pageId, tab: "seo" });
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
          line={CARD_LINE}
          state={load.state}
          errorLine="Couldn't load your redirects. Check your connection, then try again."
          onRetry={load.retry}
        />
      </Screen>
    );
  }

  const banner = saveError ?? (actionFailed ? SAVE_ERROR_MESSAGES.redirects : null);
  const visibleSuggestions = suggest ? suggestions : [];

  return (
    <Screen>
      {banner ? <SaveErrorBanner message={banner} /> : null}

      <div className={SET_RESTORE_STRIP} data-testid="set-rd-restore">
        Restoring a site version leaves this configuration unchanged.
      </div>

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

      <Section title="Redirects">
        {!hasRows ? (
          <div className="tw:flex tw:flex-col tw:items-start tw:gap-3" data-testid="set-rd-empty">
            <div className={LINE}>No redirects yet. Add one to send an old URL to a new one.</div>
            <Button type="button" size="xs" className={SET_BTN} onClick={() => setDialog({ mode: "add" })} data-testid="set-rd-add">
              Add redirect
            </Button>
          </div>
        ) : (
          <table className={TABLE} id="rd-rules" aria-label="Redirects" data-testid="set-rd-table">
            <thead>
              <tr>
                <th scope="col" className={`${TH} tw:w-[24%]`}>
                  From path
                </th>
                <th scope="col" className={TH}>
                  To URL
                </th>
                <th scope="col" className={`${TH} tw:w-16`}>
                  Type
                </th>
                <th scope="col" className={`${TH} tw:w-20 tw:pr-0`}>
                  <span className="tw:sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} data-testid={`set-rd-row-${row.id}`}>
                  <td className={`${TD_PATH} tw:font-medium`} title={row.fromPath}>
                    {row.fromPath}
                  </td>
                  <td className={`${TD_PATH} tw:text-[var(--bk-ink-soft)]`} title={row.toUrl}>
                    {row.toUrl}
                  </td>
                  <td className={`${TD} tw:text-[var(--bk-ink-soft)]`}>{row.type}</td>
                  <td className={`${TD} tw:pr-0`}>
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      className={SET_BTN}
                      onClick={() => setDialog({ mode: "edit", row })}
                      aria-label={`Edit redirect from ${row.fromPath}`}
                      data-testid={`set-rd-edit-${row.id}`}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="404 suggester">
        <div className={SET_ROW}>
          <span id="rd-suggest-from-404s-label" className={SET_ROW_LABEL}>
            Suggest redirects from 404s
          </span>
          <ToggleSwitch
            id="rd-suggest-from-404s"
            checked={suggest}
            onChange={setSuggest}
            aria-labelledby="rd-suggest-from-404s-label"
            sizing="sm"
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
    </Screen>
  );
};

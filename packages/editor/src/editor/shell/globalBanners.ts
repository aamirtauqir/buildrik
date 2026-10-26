/**
 * The global banner slot's conditions (2L9 page 07, B7-G31 `227:14297`).
 *
 * Several editor-wide conditions can hold at once — signed out, offline, the
 * server unreachable, the site open in another tab, a role change. The board
 * gives them ONE 40 px slot under the topbar: the most serious one is the
 * bar, the rest wait behind "{n} more ⌄". They used to be toasts, which a
 * newer toast replaces, and pills, which say a word and no action.
 *
 * Why a store: the producers live in the load and save hooks
 * (`shell/hooks/*`), the slot in the shell, and neither may import the other.
 * A producer writes one line (`showGlobalBanner(...)` or one of the board-copy
 * helpers below); the slot reads. The same pattern as `siteLoadStatus.ts`.
 *
 * The helpers are the one home of each condition's board copy, so a producer
 * never words it a second way.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export type BannerTone = "error" | "warning" | "info";

export interface BannerAction {
  label: string;
  onClick: () => void;
  testId?: string;
}

export interface GlobalBanner {
  /** One banner per condition: showing an id again replaces it. */
  id: string;
  tone: BannerTone;
  message: string;
  actions?: readonly BannerAction[];
  /** Offer ✕. Conditions that clear themselves (offline) are not dismissible. */
  dismissible?: boolean;
}

interface Entry {
  banner: GlobalBanner;
  seq: number;
}

const TONE_RANK: Record<BannerTone, number> = { error: 0, warning: 1, info: 2 };

let entries: Entry[] = [];
let ordered: readonly GlobalBanner[] = [];
let seq = 0;
const listeners = new Set<() => void>();

/** Most serious first; within a tone, the newest first. */
function order(list: Entry[]): readonly GlobalBanner[] {
  return [...list]
    .sort((a, b) => TONE_RANK[a.banner.tone] - TONE_RANK[b.banner.tone] || b.seq - a.seq)
    .map((e) => e.banner);
}

function publish(next: Entry[]): void {
  entries = next;
  ordered = order(next);
  listeners.forEach((listener) => listener());
}

export function showGlobalBanner(banner: GlobalBanner): void {
  const existing = entries.find((e) => e.banner.id === banner.id);
  /* A replaced banner keeps its place: the condition did not newly start. */
  const entry = { banner, seq: existing ? existing.seq : ++seq };
  publish([...entries.filter((e) => e.banner.id !== banner.id), entry]);
}

export function clearGlobalBanner(id: string): void {
  if (!entries.some((e) => e.banner.id === id)) return;
  publish(entries.filter((e) => e.banner.id !== id));
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const read = () => ordered;

export function useGlobalBanners(): readonly GlobalBanner[] {
  return React.useSyncExternalStore(subscribe, read, read);
}

/* ── The conditions, in the board's words ─────────────────────────────── */

export const BANNER_ID = {
  offline: "offline",
  connection: "connection",
  otherTab: "other-tab",
  roleChanged: "role-changed",
  sessionExpired: "session-expired",
  narrowWindow: "narrow-window",
  roleRaised: "role-raised",
  workspaceDeletion: "workspace-deletion",
  newVersion: "new-version",
  panelUpdated: "panel-updated",
} as const;

/** B7-G11 `225:7600`. Produced by the slot itself from the browser's online state. */
export const OFFLINE_BANNER: GlobalBanner = {
  id: BANNER_ID.offline,
  tone: "warning",
  message:
    "You’re offline. Page edits are kept in this browser; other changes need this tab open. Everything saves when you reconnect.",
};

/**
 * A failed save (C05 `10:2199`), in the slot rather than a strip of its own
 * (owner 2026-10-26: one error surface at a time). It takes the CONNECTION
 * id on purpose: "Couldn't save", "Can't reach Buildrik" and "Reconnecting…"
 * are one condition — the edits are not reaching the server — so whichever
 * was said last is the one bar, never three. The save status in the bottom
 * bar says it too ("Couldn't save — Retry"); no toast does.
 *
 * The server's reason picks the words: a refused brand, a page limit, a
 * deleted site and a site that never loaded are not connection problems, so
 * they offer no Retry (it would send the same refused save).
 */
export interface SaveFailedInput {
  /** "<site> · <page>". */
  where: string;
  /** The save pipeline's error message, if any. */
  error?: string;
  /** The failed save was the exit's (Save & leave) — the retry then leaves. */
  leaving?: boolean;
  /** Brand is read-only this session: a refusal points at Reload. */
  brandLocked?: boolean;
  retry: () => void;
  /** Leaving only: stay, and put the bar away. */
  keepEditing?: () => void;
}

export function saveFailedBanner({ where, error = "", leaving = false, brandLocked = false, retry, keepEditing }: SaveFailedInput): GlobalBanner {
  const retryAction: BannerAction = { label: leaving ? "Retry save & leave" : "Retry", onClick: retry, testId: "save-failed-retry" };
  const keep: BannerAction[] = leaving && keepEditing ? [{ label: "Keep editing", onClick: keepEditing, testId: "save-failed-keep" }] : [];
  const base = { id: BANNER_ID.connection, tone: "error" as const };
  if (error.startsWith("TOKENS_INVALID:")) {
    const refusal = error.slice("TOKENS_INVALID:".length).trim();
    return {
      ...base,
      message: brandLocked
        ? `Couldn't save ${where}. This site's brand was refused: ${refusal}. Your changes are kept in this browser — reload to keep editing.`
        : `Couldn't save ${where}. The brand change was refused: ${refusal}. Your changes are kept in this browser — undo the last brand change, then keep editing.`,
      actions: leaving ? [retryAction, ...keep] : [],
    };
  }
  if (error.startsWith("PAGE_LIMIT:")) {
    return { ...base, message: `Not saved — page limit reached. ${error.slice("PAGE_LIMIT:".length).trim()}`, actions: keep };
  }
  /* I-2: the server refused a page that belongs to another site; the same
     snapshot cannot succeed. */
  if (error.includes("belongs to another site")) {
    return { ...base, message: "This save included a page from another site and was refused. Reload the site before editing.", actions: keep };
  }
  if (error.includes("SITE_MISSING")) {
    return {
      ...base,
      message: "This site isn't there anymore. It was deleted, or it isn't yours to open — nothing can be saved to it.",
      actions: keep,
    };
  }
  if (error.includes("PROJECT_NOT_LOADED")) {
    return {
      ...base,
      tone: "warning",
      message: "Not saved — this site never loaded. Autosave is held back so it can't overwrite the stored pages.",
      actions: [{ label: "Reload", onClick: () => window.location.reload(), testId: "save-failed-reload" }, ...keep],
    };
  }
  return {
    ...base,
    message: leaving
      ? `Couldn't save ${where}. Your changes are kept. You have not left the editor.`
      : `Couldn't save ${where}. Your changes are kept.`,
    actions: [retryAction, ...keep],
  };
}

/** B7-G12 `225:8126` — a save died in transport while the browser is online. */
export function showCantReachBanner(retryNow: () => void): void {
  showGlobalBanner({
    id: BANNER_ID.connection,
    tone: "warning",
    message: "Can’t reach Buildrick. Your edits are kept and will save when it responds.",
    actions: [{ label: "Retry now", onClick: retryNow, testId: "banner-retry-now" }],
  });
}

/** B7-G13 `225:8654` — the queued save is being retried. Same condition as
 *  can't-reach, so it takes the same id and replaces it. */
export function showReconnectingBanner(pendingChanges?: number): void {
  const what =
    typeof pendingChanges === "number" && pendingChanges > 0
      ? `${pendingChanges} change${pendingChanges === 1 ? "" : "s"}`
      : "your changes";
  showGlobalBanner({ id: BANNER_ID.connection, tone: "warning", message: `Reconnecting… saving ${what}` });
}

/** B7-G28 `227:12711`. With a tab handoff (`tabHandoff.ts`) the notice offers
 *  "Edit here"; without one it can only be dismissed. */
export function showOtherTabBanner(editHere?: () => void): void {
  showGlobalBanner({
    id: BANNER_ID.otherTab,
    tone: "warning",
    message: "This site is also open in another tab. Edit in one tab at a time.",
    ...(editHere
      ? { actions: [{ label: "Edit here", onClick: editHere, testId: "banner-edit-here" }] }
      : { dismissible: true }),
  });
}

/** B7-G18 `227:7411` — a save refused because the role no longer allows it. */
export function showRoleChangedBanner(actions: { download?: () => void; askAdmin?: () => void }): void {
  showGlobalBanner({
    id: BANNER_ID.roleChanged,
    tone: "warning",
    message: "Your role changed to Viewer — editing is off. Changes that weren’t saved are kept in this browser.",
    actions: [
      ...(actions.download ? [{ label: "Download them", onClick: actions.download, testId: "banner-download" }] : []),
      ...(actions.askAdmin ? [{ label: "Ask an admin", onClick: actions.askAdmin, testId: "banner-ask-admin" }] : []),
    ],
  });
}

/** B7-G04 `225:3888` — signed out mid-session; edits keep queueing. */
export function showSessionExpiredBanner(signIn: () => void): void {
  showGlobalBanner({
    id: BANNER_ID.sessionExpired,
    tone: "error",
    message: "Session expired — changes aren’t saving. They’re kept in this tab.",
    actions: [{ label: "Sign in ↗", onClick: signIn, testId: "banner-sign-in" }],
  });
}

/** B7-G32 `227:14836` — never blocks; produced by the slot from the window width. */
export const NARROW_WINDOW_BANNER: GlobalBanner = {
  id: BANNER_ID.narrowWindow,
  tone: "info",
  message: "Buildrick is built for windows at least 1024 px wide — some panels will overlap.",
  dismissible: true,
};

/** B7-G19 `227:7943` — the role went up mid-session; editing needs a reload. */
export function showRoleRaisedBanner(reload: () => void): void {
  showGlobalBanner({
    id: BANNER_ID.roleRaised,
    tone: "info",
    message: "You can edit this site now.",
    actions: [{ label: "Reload to edit", onClick: reload, testId: "banner-reload-to-edit" }],
    dismissible: true,
  });
}

const DELETION_DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

/** B7-G20 `227:8473` (owner: Cancel deletion) / G21 `227:9003` (others: ask the owner). */
export function showWorkspaceDeletionBanner(at: Date, cancel: (() => void) | null): void {
  const base = `This workspace will be deleted on ${DELETION_DAY.format(at)}. Publishing is off.`;
  showGlobalBanner({
    id: BANNER_ID.workspaceDeletion,
    tone: "info",
    message: cancel ? base : `${base} Ask the owner to cancel it.`,
    actions: cancel ? [{ label: "Cancel deletion ↗", onClick: cancel, testId: "banner-cancel-deletion" }] : [],
    dismissible: true,
  });
}

/** B7-G23 `227:10063` — a newer editor build is deployed. Reload saves first
 *  (`reloadAfterSaving`), so the action is the caller's. */
export function showNewVersionBanner(reload: () => void): void {
  showGlobalBanner({
    id: BANNER_ID.newVersion,
    tone: "info",
    message: "A new version of Buildrik is ready.",
    actions: [{ label: "Reload", onClick: reload, testId: "banner-new-version-reload" }],
    dismissible: true,
  });
}

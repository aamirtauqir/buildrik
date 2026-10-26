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

/**
 * SaveStatus — Figma 697:461.
 *
 * Autosave has five truths and the old topbar drew one ("Saved 2m ago").
 * `conflict`, `offline` and `error` are the ones that matter: they are the
 * only signal a user gets that their work is not where they think it is.
 *
 * PRESENTATION ONLY (eng D5, 2026-07-30): this component carries NO
 * aria-live — the topbar's single announcement region (StudioHeader) speaks
 * for save transitions. Two live regions saying the same thing double-
 * announce, which is how an a11y feature becomes an a11y bug.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { formatRelativeTime } from "@/shared/utils/relativeTime";

export type SaveState = "saved" | "saving" | "unsaved" | "conflict" | "offline" | "error";

export interface SaveStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: SaveState;
  /** Only read for `saved`; the other states carry their own copy. */
  savedAt?: number;
  /**
   * Save now. Wired up, the pill becomes the button for the two states a user
   * can act on — a failed save and unsaved work. In every other state it stays
   * a plain status, because a button that does nothing teaches distrust.
   */
  onRetry?: () => void;
  /**
   * Navigate to the save-history affordance (plan row B2 — "Save pill →
   * History"). Wired up, the pill becomes a button for the three states whose
   * click destination IS the history panel: `saved`, `saving`, `unsaved`. For
   * `error` the existing `onRetry` wins (a retry belongs on the same control);
   * for `conflict` callers pass either `onRetry` (retry save) or a dedicated
   * conflict handler (the plan's preferred door — opens the conflict dialog);
   * for `offline` the pill stays non-interactive and surfaces a tooltip
   * explaining why clicking would lie. The handler is omitted when the
   * destination is the same as no-op.
   */
  onOpenSaveMenu?: () => void;
}

/** U1: one relative-time SSOT — seconds granularity preserved for saves. */
function ago(ts: number): string {
  return ` · ${formatRelativeTime(ts, {
    fallback: "days",
    showSeconds: true,
    justNowLabel: "just now",
  })}`;
}

const COPY: Record<Exclude<SaveState, "saved">, string> = {
  saving: "Saving…",
  unsaved: "Unsaved changes",
  conflict: "Conflict — reload",
  /* Not "saved locally": for a dashboard-backed site the save is a bare RPC —
     nothing is written to this device and nothing replays on reconnect. Read
     live while offline, the visible pill promised a local copy while the
     screen-reader announcement two elements away said "changes not saved".
     The announcement was the true one. */
  offline: "Offline — not saved",
  error: "Save failed — retry",
};

const BASE_CLASS =
  "tw:inline-flex tw:items-center tw:gap-2 tw:h-6 tw:px-2 tw:rounded-full " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-xs tw:whitespace-nowrap";

/* T8/D7 rule 4 — text-first: saved · saving · unsaved are plain muted text on
   no surface; the coloured dot carries the state. Only `offline`, `error`
   (and `conflict`) earn a tinted pill, because they are the only ones that
   mean "your work is not where you think it is". */
const STATE_CLASS: Record<SaveState, string> = {
  saved: "tw:bg-transparent tw:text-[var(--bk-ink-muted)]",
  saving: "tw:bg-transparent tw:text-[var(--bk-ink-muted)]",
  unsaved: "tw:bg-transparent tw:text-[var(--bk-ink-muted)]",
  conflict: "tw:bg-yellow-50 tw:text-yellow-800",
  offline: "tw:bg-yellow-50 tw:text-yellow-800",
  error: "tw:bg-red-100 tw:text-red-700",
};

const DOT_CLASS: Record<SaveState, string> = {
  saved: "tw:bg-green-500",
  saving: "tw:bg-[var(--bk-gray-500)]",
  unsaved: "tw:bg-yellow-500",
  conflict: "tw:bg-yellow-500",
  offline: "tw:bg-yellow-500",
  error: "tw:bg-red-600",
};

const OFFLINE_TITLE =
  "You're offline — changes won't save until you reconnect";

export function SaveStatus({
  state,
  savedAt,
  onRetry,
  onOpenSaveMenu,
  className,
  ...rest
}: SaveStatusProps) {
  const label = state === "saved" ? "Saved" : COPY[state];
  /* Two action paths: retry (error / unsaved) and navigate-to-history
     (saved / saving / unsaved — `unsaved` is dual-purpose: retry wins so
     clicking the pill does the more useful thing — actually save the work
     — rather than opening history). `conflict` and `offline` stay
     non-interactive on the pill; `conflict` is reached through the
     dedicated dialog handler wired by the caller; `offline` only carries
     a tooltip explaining why a click would lie. */
  const retryable = Boolean(onRetry) && (state === "error" || state === "unsaved");
  const navigable =
    Boolean(onOpenSaveMenu) && (state === "saved" || state === "saving");
  const offline = state === "offline";
  const classes = [BASE_CLASS, STATE_CLASS[state], className].filter(Boolean).join(" ");
  const dot = (
    <span
      className={`tw:w-1.5 tw:h-1.5 tw:rounded-full tw:flex-none ${DOT_CLASS[state]}`}
      aria-hidden="true"
    />
  );
  /**
   * T8 compact tier 2 (plan §7): the timestamp is the first thing the bar gives
   * up when it runs out of room, so it is its own element — the container
   * query drops it while "Saved" stays. The suffix is decoration on a state
   * the label already carries, which is why hiding it costs the user nothing.
   * `@max-[1200px]` keys off `.bk-topbar`'s own `tw:@container` (Topbar.tsx) —
   * the bar measures itself, not the viewport, since the shell's rails eat
   * into it.
   */
  const stamp =
    state === "saved" && savedAt ? (
      <span className="tw:@max-[1200px]:hidden">{ago(savedAt)}</span>
    ) : null;

  if (retryable || navigable) {
    const onClick = retryable ? onRetry : onOpenSaveMenu;
    /* aria-label must distinguish "save now" from "open history" because
       the visual copy ("Unsaved changes") is the same for both paths. */
    const ariaLabel =
      state === "saved"
        ? "Saved — open save history"
        : state === "saving"
          ? "Saving — open save history"
          : state === "error"
            ? "Save failed — retry save now"
            : state === "unsaved"
              ? "Unsaved changes — save now"
              : "Open save history";
    return (
      <button type="button" className={classes} onClick={onClick} aria-label={ariaLabel}>
        {dot}
        {label}
        {stamp}
      </button>
    );
  }
  return (
    <span className={classes} title={offline ? OFFLINE_TITLE : undefined} {...rest}>
      {dot}
      {label}
      {stamp}
    </span>
  );
}

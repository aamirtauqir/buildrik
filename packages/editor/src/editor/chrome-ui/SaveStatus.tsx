/**
 * SaveStatus — 2L9 `Shell/BottomBar` 497:99485, `SaveStatus State=Saved`
 * ("✓ Saved just now"), and the states the PLAY / page-07 boards draw in the
 * same slot: "Saving…" (B7-G03 225:3353), "Couldn't save — Retry" (C05
 * 10:2199), "Not loaded · nothing saved yet" (B7-G02 225:2821).
 *
 * The status lives in the bottom bar, not the topbar (2L9 Task 1.2/1.3): a
 * leading 14 px glyph and 12 px text, muted for the quiet states and the
 * error tone for a failed save. The board's "Details" door beside it is the
 * bar's, not this component's.
 *
 * Autosave has more truths than the board draws. `unsaved`, `conflict` and
 * `offline` keep their code copy in the same shape (authority:
 * code:save-states-beyond-board).
 *
 * PRESENTATION ONLY (eng D5, 2026-07-30): this component carries NO
 * aria-live — the shell's single announcement region (StudioHeader) speaks
 * for save transitions. Two live regions saying the same thing double-
 * announce, which is how an a11y feature becomes an a11y bug.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { AlertTriangle, Check, LoaderCircle, WifiOff } from "lucide-react";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
/* The LOCAL Tooltip — see HelpTooltip.tsx. */
import { Tooltip } from "./Tooltip";

/** `not-loaded` (Task 1.6, board B7-G02): the site never arrived, so this
 *  session has saved nothing and can save nothing — it describes the session,
 *  not the stored site, which is untouched. */
export type SaveState = "saved" | "saving" | "unsaved" | "conflict" | "offline" | "error" | "not-loaded";

export interface SaveStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: SaveState;
  /** Only read for `saved`; the other states carry their own copy. */
  savedAt?: number;
  /**
   * The status's own click, where the state itself is the fix: `error`
   * retries the save, `conflict` re-opens the recovery dialog. Wired up, the
   * status is a BUTTON; absent, it stays plain text, because a button that
   * does nothing teaches distrust. History is the bar's "Details", never this.
   */
  onClick?: () => void;
  /**
   * A sentence for a state with nothing to click — offline (B1-07
   * 7563:233691's tooltip). Rendered as a tooltip on the plain status.
   */
  hint?: string;
}

/** U1: one relative-time SSOT — seconds granularity preserved for saves.
 *  Board 497:99485: "Saved just now" — no separator. */
function ago(ts: number): string {
  return ` ${formatRelativeTime(ts, {
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
     nothing is written to this device and nothing replays on reconnect. */
  offline: "Offline — not saved",
  /* Board C05 10:2199. */
  error: "Couldn’t save — Retry",
  "not-loaded": "Not loaded · nothing saved yet",
};

const BASE_CLASS =
  "tw:inline-flex tw:min-w-0 tw:items-center tw:gap-2 tw:h-6 tw:border-0 tw:bg-transparent tw:p-0 " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-[12px] tw:leading-4 tw:whitespace-nowrap";

/* Board: the quiet states are muted ink; only a failed save takes the error
   tone (error-text, 5.74:1 on white). Conflict and offline are warnings the
   board does not draw; they keep the accessible warning-text. */
const STATE_CLASS: Record<SaveState, string> = {
  saved: "tw:text-[var(--bk-ink-muted)]",
  saving: "tw:text-[var(--bk-ink-muted)]",
  unsaved: "tw:text-[var(--bk-ink-muted)]",
  conflict: "tw:text-[var(--bk-warning-text)]",
  offline: "tw:text-[var(--bk-warning-text)]",
  error: "tw:text-[var(--bk-error-text)]",
  "not-loaded": "tw:text-[var(--bk-ink-muted)]",
};

function Glyph({ state }: { state: SaveState }) {
  const props = { size: 14, "aria-hidden": true, className: "tw:flex-none" } as const;
  switch (state) {
    case "saved":
      return <Check {...props} className="tw:flex-none tw:text-[var(--bk-ink-soft)]" />;
    case "saving":
    case "not-loaded":
      return <LoaderCircle {...props} className="tw:flex-none tw:text-[var(--bk-ink-soft)]" />;
    case "unsaved":
      return <span aria-hidden="true" className="tw:mx-1 tw:size-1.5 tw:flex-none tw:rounded-full tw:bg-[var(--bk-warning)]" />;
    case "offline":
      return <WifiOff {...props} />;
    case "conflict":
    case "error":
      return <AlertTriangle {...props} />;
  }
}

export function SaveStatus({ state, savedAt, onClick, hint, className, ...rest }: SaveStatusProps) {
  const label = state === "saved" ? `Saved${savedAt ? ago(savedAt) : ""}` : COPY[state];
  const classes = [BASE_CLASS, STATE_CLASS[state], className].filter(Boolean).join(" ");

  /* `save-status-${state}` is the anchor the boards are measured through —
     derived from the one prop that decides which state is on screen. Written
     inline at BOTH call sites: `check-anchors` greps the literal text before
     the interpolation, so a hoisted template is invisible to it. */
  if (onClick) {
    return (
      <button
        type="button"
        className={`${classes} tw:cursor-pointer tw:rounded tw:outline-none tw:hover:underline tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]`}
        onClick={onClick}
        data-testid={`save-status-${state}`}
        {...rest}
      >
        <Glyph state={state} />
        <span className="tw:truncate">{label}</span>
      </button>
    );
  }
  const status = (
    <span className={classes} data-testid={`save-status-${state}`} tabIndex={hint ? 0 : undefined} {...rest}>
      <Glyph state={state} />
      <span className="tw:truncate">{label}</span>
    </span>
  );
  /* Offline has no destination — a click would promise something the
     connection cannot deliver — so the status answers with the reason
     instead. `tabIndex=0` keeps the reason reachable on focus. */
  return hint ? (
    <Tooltip content={hint} placement="top" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
      {status}
    </Tooltip>
  ) : (
    status
  );
}

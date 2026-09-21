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
/* The LOCAL Tooltip — see HelpTooltip.tsx. */
import { Tooltip } from "./Tooltip";

export type SaveState = "saved" | "saving" | "unsaved" | "conflict" | "offline" | "error";

export interface SaveStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  state: SaveState;
  /** Only read for `saved`; the other states carry their own copy. */
  savedAt?: number;
  /**
   * The pill's click. Wired up, the pill is a BUTTON; the CONTAINER decides
   * what the click does per state (B2, decision #23: saved · saving ·
   * unsaved → History, error → retry the save, conflict → the recovery
   * dialog) and withholds it where a click has no honest destination
   * (offline). Absent, the pill stays a plain status, because a button that
   * does nothing teaches distrust.
   */
  onClick?: () => void;
  /**
   * A sentence for the states with nothing to click — offline (B1-07
   * 7563:233691's tooltip). Rendered as a tooltip on the plain pill.
   */
  hint?: string;
}

/** U1: one relative-time SSOT — seconds granularity preserved for saves.
 *
 *  No " · " separator. Board 813:4836 draws all five states and its saved
 *  labels are "Saved just now" / "Saved 2m ago"; board 297:1972's topbar
 *  draws "Saved 2m ago" too. Two boards, same answer, and the middot bought
 *  nothing — the whole point of the suffix being its own element is that it
 *  can be dropped, and "Saved" alone reads the same either way. */
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
     nothing is written to this device and nothing replays on reconnect. Read
     live while offline, the visible pill promised a local copy while the
     screen-reader announcement two elements away said "changes not saved".
     The announcement was the true one. */
  offline: "Offline — not saved",
  error: "Save failed — retry",
};

/* `leading-[normal]` is the board's value (all five label nodes on 813:4836)
   and it has to be said out loud: `text-xs` carries a 16px line-height of its
   own. The pill is `h-6` with `items-center`, so nothing moves. */
const BASE_CLASS =
  "tw:inline-flex tw:items-center tw:gap-2 tw:h-6 tw:px-2 tw:rounded-full " +
  "tw:[font-family:var(--bk-font-ui)] tw:text-xs tw:leading-[normal] tw:whitespace-nowrap";

/* SUPERSEDES "T8/D7 rule 4 — text-first" (founder call, 2026-09-08).
   That rule read: saved · saving · unsaved are plain muted text and the dot
   carries the state. Measured, it meant all three painted the SAME grey, so the
   one control whose whole job is telling you your save state said nothing by
   colour except through a 6px dot.
   Board 813:4836 reached for the same fix and chose four hues that exist as NO
   token and, three of four, FAIL AA on white — #998026 3.84, #268c40 4.28,
   #b2661a 4.37 against a 4.5 floor. So the board is right about the problem and
   wrong about the fix, and the accessible per-state tokens the system already
   carries are used instead: success-text 5.36, warning-text 8.93, error-text
   5.74, with ink-soft 7.56 for the neutral in-progress state.
   `saving` is deliberately NOT a warning — it is in progress and nothing is
   wrong — so it takes the neutral tone one step darker than muted, which keeps
   it distinct from `saved` without implying a problem.
   The board is pending a redraw to these tokens; until then the four colours
   stay refused in `s1-2f-save-indicator`'s skipProps with this reasoning. */
const STATE_CLASS: Record<SaveState, string> = {
  saved: "tw:bg-transparent tw:text-[var(--bk-success-text)]",
  saving: "tw:bg-transparent tw:text-[var(--bk-ink-soft)]",
  unsaved: "tw:bg-transparent tw:text-[var(--bk-warning-text)]",
  conflict: "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]",
  offline: "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]",
  error: "tw:bg-[var(--bk-error-tint)] tw:text-[var(--bk-error-text)]",
};

/* Dots follow the text, and off-ramp Tailwind literals (green-500, yellow-500,
   red-600) become the tokens that already express these states — the same
   substitution the Media surfaces made for bg-yellow-50/text-amber-800. */
const DOT_CLASS: Record<SaveState, string> = {
  saved: "tw:bg-[var(--bk-success)]",
  saving: "tw:bg-[var(--bk-gray-500)]",
  unsaved: "tw:bg-[var(--bk-warning)]",
  conflict: "tw:bg-[var(--bk-warning)]",
  offline: "tw:bg-[var(--bk-warning)]",
  error: "tw:bg-[var(--bk-error)]",
};

export function SaveStatus({ state, savedAt, onClick, hint, className, ...rest }: SaveStatusProps) {
  const label = state === "saved" ? "Saved" : COPY[state];
  const actionable = Boolean(onClick);
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

  /* `save-status-${state}` is the anchor board 813:4836 is measured through —
     five drawn states, five ids, derived from the one prop that decides which
     is on screen. Note `saved` covers the board's states 2 AND 3: they are the
     same branch at two clock positions, which the board's own caption says
     ("The same saved state as 2 — only savedAt is older").

     Written inline at BOTH call sites rather than hoisted to a `const`:
     `check-anchors` finds a derived id by grepping for the literal text
     before the interpolation inside the attribute, so a hoisted template is
     invisible to it and every `save-status-*` in a recipe reads as an anchor
     nobody renders (measured — it failed exactly that way). */
  /* `...rest` reached the span branch and not the button one, so every prop a
     caller passed — id, aria-describedby, a test hook — was silently dropped
     for exactly the two states that are actionable. */
  if (actionable) {
    return (
      <button type="button" className={classes} onClick={onClick} data-testid={`save-status-${state}`} {...rest}>
        {dot}
        {label}
        {stamp}
      </button>
    );
  }
  const pill = (
    <span className={classes} data-testid={`save-status-${state}`} tabIndex={hint ? 0 : undefined} {...rest}>
      {dot}
      {label}
      {stamp}
    </span>
  );
  /* Offline has no destination — a click would promise something the
     connection cannot deliver — so the pill answers with the reason instead.
     `tabIndex=0` keeps the reason reachable on focus, not only on hover. */
  return hint ? (
    <Tooltip content={hint} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
      {pill}
    </Tooltip>
  ) : (
    pill
  );
}

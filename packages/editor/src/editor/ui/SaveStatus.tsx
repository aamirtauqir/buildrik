/**
 * SaveStatus — Figma 697:461.
 *
 * Autosave has five truths and the old topbar drew one ("Saved 2m ago").
 * `conflict`, `offline` and `error` are the ones that matter: they are the only
 * signal a user gets that their work is not where they think it is, so those
 * three interrupt (aria-live="assertive") while the rest wait their turn.
 *
 * @license BSD-3-Clause
 */
import React from "react";

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
}

function ago(ts?: number): string {
  if (!ts) return "Saved";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "Saved just now";
  if (s < 60) return `Saved ${s}s ago`;
  if (s < 3600) return `Saved ${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `Saved ${Math.floor(s / 3600)}h ago`;
  return `Saved ${Math.floor(s / 86400)}d ago`;
}

const COPY: Record<Exclude<SaveState, "saved">, string> = {
  saving: "Saving…",
  unsaved: "Unsaved changes",
  conflict: "Conflict — reload",
  offline: "Offline — saved locally",
  error: "Save failed — retry",
};

export function SaveStatus({ state, savedAt, onRetry, className, ...rest }: SaveStatusProps) {
  const label = state === "saved" ? ago(savedAt) : COPY[state];
  const urgent = state === "conflict" || state === "error";
  const actionable = Boolean(onRetry) && (state === "error" || state === "unsaved");
  const classes = ["bk-save", `bk-save--${state}`, className].filter(Boolean).join(" ");
  const dot = <span className="bk-save__dot" aria-hidden="true" />;

  if (actionable) {
    return (
      <button type="button" className={classes} aria-live={urgent ? "assertive" : "polite"} onClick={onRetry}>
        {dot}
        {label}
      </button>
    );
  }
  return (
    <span className={classes} role="status" aria-live={urgent ? "assertive" : "polite"} {...rest}>
      {dot}
      {label}
    </span>
  );
}

/**
 * Topbar — Figma component 681:122.
 *
 * Presentational only. The old shell topbar carried 45 props, half of them
 * labelled "legacy wiring", and drew its own button, pill and hit areas. This
 * one takes what the Figma component actually varies — publish state, review
 * state, save state, presence — and composes library components for the rest.
 *
 * Everything the old one did beyond that (command palette, publish dropdown,
 * review submission, feature flags) belongs to the container, not the bar.
 *
 * The ten children below ARE the component — exit, name, save, review,
 * spacer, tools, presence, notifications, publish, menu — in that order.
 * `tools` is the ONE bounded cluster (plan §2: Quick preview · Comments ·
 * IssueChip, typed as data props). There is deliberately no `extra` node
 * slot: one existed for a day and the deleted shell topbar's Preview /
 * Comment / Colour-mode buttons walked straight back in through it. A bar
 * that can be extended per call site is a bar that drifts.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Button } from "./Button";
import { IconButton } from "./Icon";
import { IssueChip } from "./IssueChip";
import { SaveStatus, type SaveState } from "./SaveStatus";
import { Presence, type PresenceProps } from "./Presence";
import { Tooltip } from "./Tooltip";

/**
 * `published` is the 2-second success transient after a publish lands (plan
 * D10/eng D11) — the container's timer returns it to `ready`; the button is
 * natively disabled for the beat so the ✓ cannot be re-clicked.
 */
export type PublishState = "ready" | "disabled" | "anyway" | "published";

/**
 * The tool cluster (plan §2, eng D12) — DATA props, never a node: the deleted
 * `extra` slot let arbitrary buttons walk back into the bar within a day.
 * Role/view branching lives in the CONTAINER: it composes which fields to
 * pass (client view: comments only; viewer: read-only-labelled issues); the
 * bar renders exactly what it receives and learns no roles.
 */
export interface TopbarTools {
  onPreview?: () => void;
  previewBusy?: boolean;
  commentsPressed?: boolean;
  onToggleComments?: () => void;
  issues?: {
    errors: number;
    warnings: number;
    onClick?: () => void;
    readOnlyReason?: string;
  };
}

/** Five review states share one pill; only the copy and tone differ. */
export type ReviewTone = "info" | "warning" | "success";
export interface ReviewPill {
  label: string;
  tone: ReviewTone;
  title?: string;
  onClick?: () => void;
}

export interface TopbarProps {
  siteName: string;
  onExit?: () => void;
  save: SaveState;
  savedAt?: number;
  /** Save now — turns the save pill into a button for the states worth retrying. */
  onSave?: () => void;
  /** The review round's current truth. Omit when no review is in flight. */
  review?: ReviewPill | null;
  /** The daily-loop cluster: Quick preview · Comments · IssueChip. */
  tools?: TopbarTools | null;
  presence?: PresenceProps | null;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  publish?: PublishState;
  publishBusy?: boolean;
  onPublish?: () => void;
  /** Why publish is blocked — surfaced as a tooltip on the still-focusable button. */
  publishBlockedReason?: string;
  /** Replaces the built-in Publish button — e.g. an editor who sends for review instead. */
  action?: React.ReactNode;
  /** The ⋯ site menu — a node that owns its own trigger (SiteMenu). */
  menu?: React.ReactNode;
}

const PUBLISH_LABEL: Record<PublishState, string> = {
  ready: "Publish",
  disabled: "Publish",
  anyway: "Publish anyway",
  published: "✓ Published",
};

export function Topbar({
  siteName, onExit, save, savedAt, onSave, review, tools, presence,
  unreadCount = 0, onOpenNotifications, publish = "ready", publishBusy, onPublish,
  publishBlockedReason, action, menu,
}: TopbarProps) {
  const hasTools = Boolean(tools && (tools.onPreview || tools.onToggleComments || tools.issues));
  return (
    <header className="bk-topbar">
      <Button kind="ghost" size="sm" onClick={onExit}>
        ‹ Exit
      </Button>

      <span className="bk-topbar__name" title={siteName}>
        {siteName}
      </span>

      <SaveStatus state={save} savedAt={savedAt} onRetry={onSave} />

      {review ? (
        <ReviewBadge {...review} />
      ) : null}

      <span className="bk-topbar__spacer" />

      {hasTools && tools ? (
        <span className="bk-topbar__tools">
          {tools.onPreview ? (
            <IconButton
              label="Quick preview"
              onClick={tools.previewBusy ? undefined : tools.onPreview}
              disabled={tools.previewBusy}
              aria-busy={tools.previewBusy || undefined}
            >
              {tools.previewBusy ? <SpinnerIcon /> : <EyeIcon />}
            </IconButton>
          ) : null}
          {tools.onToggleComments ? (
            <IconButton label="Comments" pressed={Boolean(tools.commentsPressed)} onClick={tools.onToggleComments}>
              <CommentIcon />
            </IconButton>
          ) : null}
          {tools.issues ? <IssueChip {...tools.issues} /> : null}
        </span>
      ) : null}

      {presence ? <Presence {...presence} /> : null}

      <span className="bk-topbar__bell">
        <IconButton
          label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          onClick={onOpenNotifications}
        >
          <BellIcon />
        </IconButton>
        {unreadCount > 0 ? <span className="bk-topbar__unread" aria-hidden="true" /> : null}
      </span>

      {action ?? (
        publish === "published" ? (
          /* Success transient — disabled for its 2s beat, restyled not re-built. */
          <Button kind="ghost" size="md" disabled className="bk-topbar__published">
            {PUBLISH_LABEL[publish]}
          </Button>
        ) : publish === "disabled" ? (
          /*
           * Blocked ≠ busy. A natively-disabled button is unfocusable, so a
           * keyboard user can never reach the reason it is blocked. Blocked
           * stays focusable with aria-disabled and the reason in a tooltip;
           * the onClick guard covers Enter/Space too, since keyboard
           * activation of a native button routes through click. Busy keeps
           * native disabled (via `loading`) so a double-publish stays
           * impossible — when both apply, busy's native disabled wins.
           */
          <Tooltip label={publishBlockedReason ?? "Publishing is unavailable"} placement="bottom-end">
            <Button
              kind="primary"
              size="md"
              aria-disabled="true"
              loading={publishBusy}
              onClick={() => {}}
            >
              {PUBLISH_LABEL[publish]}
            </Button>
          </Tooltip>
        ) : (
          <Button kind="primary" size="md" loading={publishBusy} onClick={onPublish}>
            {PUBLISH_LABEL[publish]}
          </Button>
        )
      )}

      {menu}
    </header>
  );
}

/**
 * A clickable pill when there is somewhere to go, plain text when there is not.
 * A button that does nothing is worse than a label that never claimed to.
 */
function ReviewBadge({ label, tone, title, onClick }: ReviewPill) {
  const className = `bk-topbar__review bk-topbar__review--${tone}`;
  if (!onClick) {
    return (
      <span className={className} title={title ?? label}>
        <span className="bk-topbar__review-label">{label}</span>
      </span>
    );
  }
  return (
    <button type="button" className={className} title={title ?? label} onClick={onClick}>
      <span className="bk-topbar__review-label">{label}</span>
    </button>
  );
}

/* Inline 24px glyphs matching the Figma icon components 681:4338 / 681:4343.
   Eye/Comment/Spinner: Figma nodes pending T1 (as-built ledger pattern). */
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}
function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  );
}
export function SiteMenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

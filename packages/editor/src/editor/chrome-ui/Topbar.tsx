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
import { Button } from "flowbite-react";
/* The LOCAL Tooltip — see HelpTooltip.tsx. */
import { Tooltip } from "./Tooltip";
import { IconButton } from "./Icon";
import { IssueChip } from "./IssueChip";
import { SaveStatus, type SaveState } from "./SaveStatus";
import { Presence, type PresenceProps } from "./Presence";

/* Publish geometry (2026-08-03). Both Publish branches used to render a bare
   `<Button>` with no `size`, so they took flowbite's default md — 40px tall,
   14px text — while every other Button in this bar declares `size="xs"`. The
   board (681:26 `btn/publish`, and Button 9:102 `Kind=primary, Size=md`) puts
   the primary CTA at 32px with 13px medium text. The omission was the only
   reason it stood 8px taller than the design and than the bar's own rhythm.
   Stated once here so the two branches cannot drift apart again. */
const PUBLISH_BTN_CLASS = "tw:h-8 tw:px-5 tw:text-[13px] tw:font-medium";

/* Exit geometry + colour (2026-08-03), from board 681:26 `btn/exit`: 28 tall,
   10 horizontal padding, 12px REGULAR, ink at gray-900. It rendered 32 / 12 /
   medium / gray-600.

   The colour needed a decision rather than a copy. The shared ghost treatment
   runs gray-600 at rest and gray-900 on hover, so simply taking the board's gray-900
   for the resting state would have left hover with nowhere to go and quietly
   deleted the affordance. The board only draws a rest state, so it cannot
   settle the question by itself. Resolved by moving the hover signal from ink
   to surface — `hover:bg-gray-100`, which is what IconButton already does — so
   the resting colour matches the board AND hover still visibly responds.

   Scoped to this button on purpose: the shared ghost class is used widely, and re-inking
   every ghost button in the editor is not what the topbar board says. */
const EXIT_BTN_CLASS =
  "tw:border-transparent tw:bg-transparent tw:h-7 tw:px-2.5 tw:text-[12px] tw:font-normal " +
  "tw:text-gray-900 tw:enabled:hover:bg-gray-100";

/**
 * `published` is the 2-second success transient after a publish lands (plan
 * D10/eng D11) — the container's timer returns it to `ready`; the button is
 * natively disabled for the beat so the ✓ cannot be re-clicked.
 */
/* "hidden" is not a disabled Publish — it is no Publish control at all, for
   surfaces where publishing is not the viewer's to do. View mode is the
   case: the `action` slot used to hold SendForReview there and so replaced
   this button by accident; emptying the slot made Publish reappear. */
export type PublishState = "ready" | "disabled" | "anyway" | "published" | "hidden";

/**
 * The tool cluster (plan §2, eng D12) — DATA props, never a node: the deleted
 * `extra` slot let arbitrary buttons walk back into the bar within a day.
 * Role/view branching lives in the CONTAINER: it composes which fields to
 * pass (view mode: comments only; viewer: read-only-labelled issues); the
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
  /**
   * What the leftmost control says and does. In view mode it leaves the MODE,
   * not the product: "‹ Exit" there still went to the dashboard, so the most
   * prominent control on a preview screen took you out of the site entirely,
   * while getting back to editing was one row inside a ⋯ menu.
   */
  exitLabel?: string;
  /** Omit to render no save indicator at all — view mode, where nothing can
      become unsaved and the pill would be status about a machine the viewer is
      not operating. */
  save?: SaveState;
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
  /**
   * The CTA's verb, when the shell has worked out where the site actually
   * stands (`deriveLifecycleState`) — "Send for review", "Open feedback",
   * "Publish changes". Overrides the built-in label for the ready and blocked
   * states; the `published` success beat keeps its own "✓ Published".
   *
   * Wireframes §2: this is a state-dependent CTA, and the ONE filled button in
   * the shell. It is a label override rather than a second control on purpose —
   * the blocked branch's focusable/aria-disabled/tooltip behaviour is not worth
   * reimplementing per verb.
   */
  ctaLabel?: string;
  /** One sentence naming the site's position, as the button's title. */
  ctaHint?: string;
  /**
   * The live site, when there is one. Rendered as `● Live · domain` beside the
   * save pill — the settled half of the CTA's story.
   *
   * Load-bearing next to `ctaLabel`: on a site that is live with nothing
   * waiting, the derivation returns no next move and the CTA disappears. Without
   * this chip, "your site is live" would have no representation in the shell at
   * all, and a finished site would look identical to one that was never
   * published.
   */
  liveUrl?: string | null;
  /** Replaces the built-in Publish button — e.g. an editor who sends for review instead. */
  action?: React.ReactNode;
  /** The ⋯ site menu — a node that owns its own trigger (SiteMenu). */
  menu?: React.ReactNode;
}

/** The host, for the live chip. A URL the server never validated must not
 *  throw inside a render — an unparseable one falls back to itself. */
function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const PUBLISH_LABEL: Record<PublishState, string> = {
  ready: "Publish",
  disabled: "Publish",
  anyway: "Publish anyway",
  published: "✓ Published",
  hidden: "",
};

export function Topbar({
  siteName, onExit, exitLabel = "‹ Exit", save, savedAt, onSave, review, tools, presence,
  unreadCount = 0, onOpenNotifications, publish = "ready", publishBusy, onPublish,
  publishBlockedReason, ctaLabel, ctaHint, liveUrl, action, menu,
}: TopbarProps) {
  const hasTools = Boolean(tools && (tools.onPreview || tools.onToggleComments || tools.issues));
  return (
    <header
      // Conformance anchor. The bar wears only utility classes, so any selector
      // built from them breaks on the next drain commit — which is exactly what
      // happened: scripts/conformance/surfaces/shell-default.json waited on
      // `.bd-topbar`, a class that exists in no file under src/. Rendered once
      // (StudioHeader.tsx), so the id is unambiguous.
      data-testid="topbar"
      className={
        /* The bar measures itself so the compact tiers of plan §7 key off the
           space it actually has, not the viewport — the shell's rails eat
           into it. `tw:@container` sets `container-type: inline-size`;
           SaveStatus's own `tw:@max-[1200px]:hidden` (its timestamp) keys
           off this ancestor. */
        "tw:flex tw:items-center tw:gap-3 tw:h-14 tw:flex-none tw:@container " +
        "tw:px-4 tw:bg-white tw:border-b tw:border-gray-200 " +
        "tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-gray-900"
      }
    >
      <Button color="light" size="xs" onClick={onExit} className={EXIT_BTN_CLASS}>
        {exitLabel}
      </Button>

      <span
        className="tw:text-[13px] tw:font-medium tw:text-gray-900 tw:max-w-[200px] tw:min-w-[120px] tw:shrink tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap"
        title={siteName}
      >
        {siteName}
      </span>

      {/* Nothing in a read-only view can become unsaved, so "Saved · just now"
          is status about a machine the viewer is not operating. `save` is
          omitted there rather than rendering a permanently-green pill. */}
      {save ? <SaveStatus state={save} savedAt={savedAt} onRetry={onSave} /> : null}

      {liveUrl ? (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          /* The domain, not the URL: `https://bella-cucina.vercel.app/` in a
             56px bar pushes the site name out of it. The href keeps the whole
             thing, and the title says where it goes. */
          title={`Open the live site — ${liveUrl}`}
          className={
            "tw:inline-flex tw:flex-none tw:items-center tw:gap-1.5 tw:h-6 tw:px-2 tw:rounded " +
            "tw:text-[12px] tw:text-gray-600 tw:no-underline tw:hover:bg-gray-100 tw:hover:text-gray-900 " +
            "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)] tw:focus-visible:outline-none"
          }
        >
          <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-green-600" aria-hidden="true" />
          <span className="tw:sr-only">Live at </span>
          {hostOf(liveUrl)}
        </a>
      ) : null}

      {review ? (
        <ReviewBadge {...review} />
      ) : null}

      <span className="tw:flex-1" />

      {hasTools && tools ? (
        <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:pr-2 tw:mr-1 tw:border-r tw:border-gray-200">
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

      <span className="tw:relative tw:inline-flex tw:flex-none">
        <IconButton
          label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          onClick={onOpenNotifications}
        >
          <BellIcon />
        </IconButton>
        {unreadCount > 0 ? (
          <span
            className="tw:absolute tw:top-1 tw:right-0.5 tw:w-2 tw:h-2 tw:rounded-full tw:bg-[var(--bk-accent)] tw:[box-shadow:0_0_0_2px_var(--bk-bg-card)]"
            aria-hidden="true"
          />
        ) : null}
      </span>

      {action ?? (
        publish === "hidden" ? null :
        publish === "published" ? (
          /* Success transient — disabled for its 2s beat. green-100/green-600
             are exact hex matches for --bk-success-tint/--bk-success-text. */
          <Button
            color="light"
            size="xs"
            disabled
            className="tw:border-transparent tw:bg-green-100 tw:text-green-600 tw:opacity-100"
          >
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
          <Tooltip
            content={publishBlockedReason ?? "Publishing is unavailable"}
            placement="bottom-end"
            arrow={false}
            className="tw:max-w-[280px] tw:whitespace-normal"
          >
            <Button
              aria-disabled="true"
              disabled={publishBusy}
              aria-busy={publishBusy || undefined}
              onClick={() => {}}
              size="xs"
              className={PUBLISH_BTN_CLASS}
            >
              {ctaLabel ?? PUBLISH_LABEL[publish]}
            </Button>
          </Tooltip>
        ) : (
          <Button
            disabled={publishBusy}
            aria-busy={publishBusy || undefined}
            onClick={onPublish}
            size="xs"
            title={ctaHint}
            className={PUBLISH_BTN_CLASS}
          >
            {ctaLabel ?? PUBLISH_LABEL[publish]}
          </Button>
        )
      )}

      {menu}
    </header>
  );
}

const REVIEW_BASE_CLASS =
  "tw:inline-flex tw:items-center tw:gap-1 tw:h-6 tw:px-2 tw:border-0 tw:rounded-full " +
  "tw:text-xs tw:font-medium tw:whitespace-nowrap";

/* T8/D7 rule 3 — neutral-unless-blocking. "In review" and "Approved" are
   information, not instructions: they sit on gray so the bar's colour budget
   stays with the two signals that gate a publish (Issues chip, save trouble).
   Only "Changes requested" — the one review state that blocks — keeps amber.
   `info` and `success` are visually identical by design (same neutral
   surface); only `warning` gets its own look. */
const REVIEW_TONE_CLASS: Record<ReviewTone, string> = {
  info: "tw:bg-gray-100 tw:text-gray-600",
  success: "tw:bg-gray-100 tw:text-gray-600",
  warning: "tw:bg-yellow-50 tw:text-yellow-800",
};

/* F23: reviewer names are unbounded — cap the pill, keep the truth in `title`. */
const REVIEW_LABEL_CLASS = "tw:max-w-[140px] tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap";

/**
 * A clickable pill when there is somewhere to go, plain text when there is not.
 * A button that does nothing is worse than a label that never claimed to.
 */
function ReviewBadge({ label, tone, title, onClick }: ReviewPill) {
  const className = `${REVIEW_BASE_CLASS} ${REVIEW_TONE_CLASS[tone]}`;
  if (!onClick) {
    return (
      <span className={className} title={title ?? label}>
        <span className={REVIEW_LABEL_CLASS}>{label}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`${className} tw:cursor-pointer tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]`}
      title={title ?? label}
      onClick={onClick}
    >
      <span className={REVIEW_LABEL_CLASS}>{label}</span>
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

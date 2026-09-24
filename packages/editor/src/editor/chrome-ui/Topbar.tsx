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
 * `tools` is the ONE bounded cluster (plan §2: Quick preview · Comments,
 * typed as data props; the IssueChip and the Live chip left the bar in C3 —
 * Issues opens from the site menu and ⌘K, the live URL is a site-menu row). There is deliberately no `extra` node
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
import { SaveStatus, type SaveState } from "./SaveStatus";
import { Presence, type PresenceProps } from "./Presence";

/* Publish geometry (2026-08-03). Both Publish branches used to render a bare
   `<Button>` with no `size`, so they took flowbite's default md — 40px tall,
   14px text — while every other Button in this bar declares `size="xs"`. The
   board (681:26 `btn/publish`, and Button 9:102 `Kind=primary, Size=md`) puts
   the primary CTA at 32px with 13px medium text. The omission was the only
   reason it stood 8px taller than the design and than the bar's own rhythm.
   Stated once here so the two branches cannot drift apart again. */
/* 680:22 on all three topbar frames (681:26, 682:4576, 682:4651): 32 tall,
   16 horizontal, a 14/20 label. It shipped 20 horizontal and 13. The 10px
   VERTICAL the boards also declare is nominal — 10 + a 20 line + 10 is 40 and
   the same node fixes its height at 32 — so it is carried as a box-model value
   the explicit height overrides, which is what Figma is doing too. */
/* Board 4418:123573 (v3 IA): Publish at 13/500. */
const PUBLISH_BTN_CLASS = "tw:h-8 tw:px-4 tw:py-2.5 tw:text-[13px] tw:leading-5 tw:font-medium";

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
/* Board 4418:123573 (v3 IA): Exit is 13/500 in gray-700. */
const EXIT_BTN_CLASS =
  "tw:border-transparent tw:bg-transparent tw:h-7 tw:px-2.5 tw:text-[13px] tw:font-medium " +
  "tw:text-[var(--bk-gray-700)] tw:enabled:hover:bg-[var(--bk-gray-100)]";

/* Board 4418:123573: the shell search, 320×36, placeholder + ⌘K. It is the
   ⌘K door — a button drawn as a field (the palette owns the typing). */
const SEARCH_CLASS =
  "tw:flex tw:flex-none tw:items-center tw:gap-2 tw:h-9 tw:w-[320px] tw:px-3 tw:rounded-md tw:border tw:border-[var(--bk-border)] " +
  "tw:bg-[var(--bk-bg-card)] tw:text-[13px] tw:text-[var(--bk-ink-muted)] tw:cursor-text tw:hover:border-[var(--bk-gray-400)] " +
  "tw:focus-visible:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const SEARCH_KBD =
  "tw:ml-auto tw:rounded tw:border tw:border-[var(--bk-border)] tw:px-1.5 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* Board 4418:123573: Preview is a 76×32 bordered TEXT button, not an eye. */
const PREVIEW_BTN_CLASS =
  "tw:h-8 tw:w-[76px] tw:px-0 tw:text-[13px] tw:font-medium tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:text-[var(--bk-ink)]";

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
 * pass (view mode: comments only); the
 * bar renders exactly what it receives and learns no roles.
 */
export interface TopbarTools {
  onPreview?: () => void;
  previewBusy?: boolean;
  commentsPressed?: boolean;
  onToggleComments?: () => void;
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
  /** The page being edited — the crumb after the site (board 4418:123573:
   *  "Bella Cucina › Home"). Omit for no page crumb. */
  pageName?: string | null;
  /** The site crumb's click — board 4418:126034's hotspot/crumb-site opens
   *  the Pages panel (4418:90494). Omit and the site name is plain text. */
  onOpenPages?: () => void;
  /** The page crumb's click — hotspot/crumb-page lands on the base shell
   *  (4418:123573: drawer closed). Omit and the page is plain text. */
  onPageCrumb?: () => void;
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
  /** The save pill's click — the container routes it by state (B2): History
   *  for saved/saving/unsaved, a retry for error, the recovery dialog for a
   *  conflict. Omit for offline, where `saveHint` carries the reason. */
  onSaveClick?: () => void;
  /** The tooltip on a pill with nothing to click (offline). */
  saveHint?: string;
  /** The review round's current truth. Omit when no review is in flight. */
  review?: ReviewPill | null;
  /** The daily-loop cluster: Quick preview · Comments. */
  tools?: TopbarTools | null;
  /** The shell search field (⌘K). Omit and no field is drawn. */
  onOpenSearch?: () => void;
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
  /** Replaces the built-in Publish button — e.g. an editor who sends for review instead. */
  action?: React.ReactNode;
  /** The ⋯ site menu — a node that owns its own trigger (SiteMenu). */
  menu?: React.ReactNode;
}

const CRUMB_CLASS =
  "tw:h-auto tw:min-w-0 tw:truncate tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[14px] tw:leading-5 " +
  "tw:font-medium tw:text-[var(--bk-accent)] tw:hover:underline tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

const PAGE_CRUMB_CLASS =
  "tw:h-auto tw:min-w-0 tw:truncate tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[14px] tw:leading-5 " +
  "tw:font-medium tw:text-[var(--bk-ink)] tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

const PUBLISH_LABEL: Record<PublishState, string> = {
  ready: "Publish",
  disabled: "Publish",
  anyway: "Publish anyway",
  published: "✓ Published",
  hidden: "",
};

export function Topbar({
  siteName, pageName, onOpenPages, onPageCrumb, onExit, exitLabel = "‹ Exit", save, savedAt, onSaveClick, saveHint, review, tools, presence,
  unreadCount = 0, onOpenNotifications, publish = "ready", publishBusy, onPublish,
  publishBlockedReason, ctaLabel, ctaHint, action, menu, onOpenSearch,
}: TopbarProps) {
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
        "tw:px-3 tw:bg-white tw:border-b tw:border-[var(--bk-gray-100)] " +
        "tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-[var(--bk-ink)]"
      }
    >
      <Button color="light" size="xs" onClick={onExit} className={EXIT_BTN_CLASS} data-testid="topbar-exit">
        {exitLabel}
      </Button>

      {/* 680:11 on all three topbar frames — 681:26 (which shell-default
          measures) and 682:4576 / 682:4651 on the S5 flow frames — is a FIXED
          200 column at 14/20. It shipped 13px in a 120..200 elastic box, so
          the site's own name read at the size of the controls around it and
          the whole bar re-laid itself when the name changed length. */}
      {/* The breadcrumb (C5 G1-004): the site in accent opens the Pages
          panel; the page crumb returns to the base shell. Board 4418:123573
          puts the shell search at x356, so the crumb column is 267 (it was
          681:26's 200). */}
      <span
        className="tw:flex tw:items-center tw:gap-1 tw:text-[14px] tw:leading-5 tw:font-medium tw:w-[267px] tw:shrink tw:min-w-0 tw:whitespace-nowrap"
        data-testid="topbar-site-name"
      >
        {onOpenPages ? (
          <Button
            color="light"
            size="xs"
            onClick={onOpenPages}
            className={CRUMB_CLASS}
            title={siteName}
            data-testid="topbar-crumb-site"
          >
            {siteName}
          </Button>
        ) : (
          <span className="tw:min-w-0 tw:truncate tw:text-[var(--bk-ink)]" title={siteName}>
            {siteName}
          </span>
        )}
        {pageName ? (
          <>
            <span aria-hidden="true" className="tw:flex-none tw:text-[var(--bk-ink-muted)]">›</span>
            {onPageCrumb ? (
              <Button
                color="light"
                size="xs"
                onClick={onPageCrumb}
                aria-current="page"
                className={PAGE_CRUMB_CLASS}
                title={pageName}
                data-testid="topbar-crumb-page"
              >
                {pageName}
              </Button>
            ) : (
              <span
                aria-current="page"
                className="tw:min-w-0 tw:truncate tw:text-[var(--bk-ink)]"
                title={pageName}
                data-testid="topbar-crumb-page"
              >
                {pageName}
              </span>
            )}
          </>
        ) : null}
      </span>

      {/* Nothing in a read-only view can become unsaved, so "Saved · just now"
          is status about a machine the viewer is not operating. `save` is
          omitted there rather than rendering a permanently-green pill. */}
      {onOpenSearch ? (
        <button type="button" className={SEARCH_CLASS} onClick={onOpenSearch} data-testid="topbar-search">
          <SearchGlyph />
          <span className="tw:truncate">Search pages, layers, assets…</span>
          <kbd className={SEARCH_KBD}>⌘K</kbd>
        </button>
      ) : null}

      {save ? <SaveStatus state={save} savedAt={savedAt} onClick={onSaveClick} hint={saveHint} /> : null}


      {review ? (
        <ReviewBadge {...review} />
      ) : null}

      {/* Board 4418:123573: the comments toggle sits with the review chip. */}
      {tools?.onToggleComments ? (
        <IconButton label="Comments" pressed={Boolean(tools.commentsPressed)} onClick={tools.onToggleComments}>
          <CommentIcon />
        </IconButton>
      ) : null}


      <span className="tw:flex-1" />


      {presence ? <Presence {...presence} /> : null}

      <span className="tw:relative tw:inline-flex tw:flex-none">
        <IconButton
          label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          onClick={onOpenNotifications}
        >
          <BellIcon />
        </IconButton>
        {unreadCount > 0 ? (
          /* Board 4418:123573: a count badge, not a dot. */
          <span
            className="tw:absolute tw:-top-0.5 tw:-right-1 tw:flex tw:min-w-5 tw:h-5 tw:items-center tw:justify-center tw:rounded-full tw:px-1 tw:bg-[var(--bk-accent)] tw:text-[11px] tw:font-medium tw:leading-none tw:text-white tw:[box-shadow:0_0_0_2px_var(--bk-bg-card)]"
            aria-hidden="true"
            data-testid="topbar-unread-badge"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </span>

      {tools?.onPreview ? (
        <Button
          color="light"
          size="xs"
          onClick={tools.previewBusy ? undefined : tools.onPreview}
          disabled={tools.previewBusy}
          aria-busy={tools.previewBusy || undefined}
          className={PREVIEW_BTN_CLASS}
          data-testid="topbar-preview"
        >
          {tools.previewBusy ? <SpinnerIcon /> : "Preview"}
        </Button>
      ) : null}

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
            data-testid="topbar-publish"
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

/* Board B3-01 7569:190283, decision #26 (C2): tones via the status tokens —
   warning-tint for Changes requested, success-tint for Approved, neutral
   otherwise. (T8/D7 rule 3 had `success` on the neutral surface; the chip
   set's tone variants were drawn since, and the container still demotes a
   warning chip to neutral when two louder ambers are on the bar.) */
const REVIEW_TONE_CLASS: Record<ReviewTone, string> = {
  info: "tw:bg-[var(--bk-gray-100)] tw:text-[var(--bk-ink-soft)]",
  success: "tw:bg-[var(--bk-success-tint)] tw:text-[var(--bk-success-text)]",
  warning: "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]",
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
      <span className={className} title={title ?? label} data-testid="topbar-review-pill">
        <span className={REVIEW_LABEL_CLASS} data-testid="topbar-review-label">{label}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`${className} tw:cursor-pointer tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]`}
      title={title ?? label}
      onClick={onClick}
      data-testid="topbar-review-pill"
    >
      <span className={REVIEW_LABEL_CLASS} data-testid="topbar-review-label">{label}</span>
    </button>
  );
}

/* Inline 24px glyphs matching the Figma icon components 681:4338 / 681:4343.
   Eye/Comment/Spinner: Figma nodes pending T1 (as-built ledger pattern). */
function SearchGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

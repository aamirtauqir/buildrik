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
 * 2L9 `Shell/Topbar` 497:99433 (1440×56), left → right, 8 apart: Exit ·
 * the site's name as plain text (identity, not navigation) · "Site settings"
 * (icon + label) · History (Undo · Redo) · flexible space · the review
 * status · Comments · presence · notifications · Preview · Publish · ⋯.
 * The save status is not here: it lives in the bottom bar (497:99485).
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
import { Bell, MessageSquare, Redo, Settings, Undo } from "lucide-react";
/* The LOCAL Tooltip — see HelpTooltip.tsx. */
import { Tooltip } from "./Tooltip";
import { IconButton } from "./Icon";
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
/* Board 497:99433: Publish is 82 wide. A longer verb ("Send for review")
   grows it rather than clipping. */
const PUBLISH_BTN_CLASS = "tw:flex-none tw:h-8 tw:min-w-[82px] tw:px-4 tw:py-2.5 tw:text-[13px] tw:leading-5 tw:font-medium";

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
/* Board 497:99433: Exit is a 48×32 Ghost, "Exit" with no chevron. */
const EXIT_BTN_CLASS =
  "tw:border-transparent tw:bg-transparent tw:h-8 tw:min-w-12 tw:px-2.5 tw:text-[13px] tw:font-medium " +
  "tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-100)]";

/* Board 497:99433 `Site settings / visible labeled entry`: 140×32, the gear
   then the label, drawn without a border on the bar. */
const SITE_SETTINGS_BTN_CLASS =
  "tw:flex-none tw:h-8 tw:w-[140px] tw:justify-start tw:gap-3.5 tw:px-3 tw:border-transparent tw:bg-transparent " +
  "tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-100)]";

/* The topbar carries no search field in any state (OWNER DECISIONS
   2026-10-03): the resting ⌘K button went first — ⌘K / Ctrl+K is the
   palette's door — and then the drawer-owned field (board 4418:100087 and its
   siblings), which moved into each panel as chrome-ui's PanelSearch. */
/* Board 497:99433: Preview is an 82×32 Secondary TEXT button, not an eye. */
const PREVIEW_BTN_CLASS =
  "tw:flex-none tw:h-8 tw:w-[82px] tw:px-0 tw:text-[13px] tw:font-medium tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:text-[var(--bk-ink)]";

/**
 * `published` is the 2-second success transient after a publish lands (plan
 * D10/eng D11) — the container's timer returns it to `ready`; the button is
 * natively disabled for the beat so the ✓ cannot be re-clicked.
 */
/* "hidden" is not a disabled Publish — it is no Publish control at all, for
   surfaces where publishing is not the viewer's to do. View mode is the
   case: the `action` slot used to hold SendForReview there and so replaced
   this button by accident; emptying the slot made Publish reappear. */
export type PublishState = "ready" | "disabled" | "published" | "hidden";

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
export type ReviewTone = "neutral" | "info" | "warning" | "success";
export interface ReviewPill {
  label: string;
  tone: ReviewTone;
  title?: string;
  onClick?: () => void;
}

/**
 * The topbar's History group — board 497:99433 `History / one undo for the
 * whole editor`: an Undo + Redo icon pair, no text, the editor's only undo
 * controls (owner decision "one undo"). The container owns the composer and
 * the platform chord text; the bar only draws.
 */
export interface TopbarHistory {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** Formatted chords, e.g. "⌘Z" / "⇧⌘Z" on macOS, "Ctrl+Z" elsewhere. */
  undoChord: string;
  redoChord: string;
}

export interface TopbarProps {
  /** The site's name — identity, not navigation (board 497:99433). */
  siteName: string;
  /** "Site settings" — the visible, labelled door to the site's settings.
   *  Omit where settings are not the viewer's (view mode). */
  onOpenSiteSettings?: () => void;
  onExit?: () => void;
  /**
   * What the leftmost control says and does. In view mode it leaves the MODE,
   * not the product: "‹ Exit" there still went to the dashboard, so the most
   * prominent control on a preview screen took you out of the site entirely,
   * while getting back to editing was one row inside a ⋯ menu.
   */
  exitLabel?: string;
  /** Undo / Redo. Omit where nothing can be edited (view mode). */
  history?: TopbarHistory | null;
  /** The review round's current truth. Omit when no review is in flight. */
  review?: ReviewPill | null;
  /** The daily-loop cluster: Quick preview · Comments. */
  tools?: TopbarTools | null;
  presence?: PresenceProps | null;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  publish?: PublishState;
  publishBusy?: boolean;
  onPublish?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Set when Publish is the publish tray's TOGGLE (design-2l9 Task 1.7):
   * whether the tray is open. The button then carries `aria-expanded` and
   * `aria-controls`, and stays pressable while a publish runs — the tray,
   * not this button, shows the run and every reason the CTA is shut.
   */
  publishExpanded?: boolean;
  /** The id of the surface the toggle opens. */
  publishControls?: string;
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

const PUBLISH_LABEL: Record<PublishState, string> = {
  ready: "Publish",
  disabled: "Publish",
  published: "✓ Published",
  hidden: "",
};

export function Topbar({
  siteName, onOpenSiteSettings, onExit, exitLabel = "Exit", history, review, tools, presence,
  unreadCount = 0, onOpenNotifications, publish = "ready", publishBusy, onPublish, publishExpanded, publishControls,
  publishBlockedReason, ctaLabel, ctaHint, action, menu,
}: TopbarProps) {
  return (
    <header
      // Conformance anchor. The bar wears only utility classes, so any selector
      // built from them breaks on the next drain commit — which is exactly what
      // happened: the V1 recipe surfaces/shell-default.json (retired 2026-10-07 with its V1 spec) waited on
      // `.bd-topbar`, a class that exists in no file under src/. Rendered once
      // (StudioHeader.tsx), so the id is unambiguous.
      data-testid="topbar"
      className={
        /* Board 497:99433: 56 tall, children 8 apart, 13 in from each edge. */
        "tw:flex tw:items-center tw:gap-2 tw:h-[var(--bk-size-topbar)] tw:flex-none " +
        "tw:px-[13px] tw:bg-white tw:border-b tw:border-[var(--bk-gray-100)] " +
        "tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-[var(--bk-ink)]"
      }
    >
      <Button color="light" size="xs" onClick={onExit} className={`tw:flex-none ${EXIT_BTN_CLASS}`} data-testid="topbar-exit">
        {exitLabel}
      </Button>

      {/* Board 497:99433 `Site identity / not navigation`: the name as plain
          text in a 176 column — not a crumb, not a button. */}
      <span
        /* Narrow-width rule (design-2l9 Task 1.2): this column is the ONE
           thing that gives way as the bar narrows — it ellipsizes down to
           80px (full name in its title) while every other control keeps its
           size, so at the 1024 minimum nothing wraps or clips. */
        className="tw:w-[176px] tw:shrink tw:min-w-[80px] tw:truncate tw:whitespace-nowrap tw:px-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]"
        title={siteName}
        data-testid="topbar-site-name"
      >
        {siteName}
      </span>

      {onOpenSiteSettings ? (
        <Button
          color="light"
          size="xs"
          onClick={onOpenSiteSettings}
          className={SITE_SETTINGS_BTN_CLASS}
          data-testid="topbar-site-settings"
        >
          <Settings size={16} aria-hidden="true" className="tw:flex-none" />
          Site settings
        </Button>
      ) : null}

      {history ? <HistoryGroup {...history} /> : null}

      <span className="tw:flex-1" />

      {review ? (
        <ReviewBadge {...review} />
      ) : null}

      {/* Board 497:99433: Comments (message-square) follows the review status. */}
      {tools?.onToggleComments ? (
        <IconButton label="Comments" pressed={Boolean(tools.commentsPressed)} onClick={tools.onToggleComments}>
          <MessageSquare size={16} aria-hidden="true" />
        </IconButton>
      ) : null}

      {presence ? <Presence {...presence} className="tw:flex-none" /> : null}

      <span className="tw:relative tw:inline-flex tw:flex-none">
        <IconButton
          label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          onClick={onOpenNotifications}
        >
          <Bell size={16} aria-hidden="true" />
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
              /* Boards 4418:123573 / 4418:126059 draw a blocked Publish at 40%. */
              className={`${PUBLISH_BTN_CLASS} tw:opacity-40`}
            >
              {ctaLabel ?? PUBLISH_LABEL[publish]}
            </Button>
          </Tooltip>
        ) : (
          <Button
            disabled={publishExpanded === undefined ? publishBusy : undefined}
            aria-busy={publishBusy || undefined}
            aria-expanded={publishExpanded}
            aria-controls={publishExpanded ? publishControls : undefined}
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

/* Board 497:99433 `In review · 2`: the review status is TEXT — 13 medium,
   no pill, no dot, no chevron — in a 32 tall hit area. The tone survives
   only as the text colour (neutral/info ink-soft; warning and success their
   accessible status tokens), because "Changes requested" and "Approved"
   still need to read differently from "In review" (authority:
   code:review-tones). */
const REVIEW_BASE_CLASS =
  "tw:flex-none tw:inline-flex tw:items-center tw:h-8 tw:px-0 tw:border-0 tw:rounded tw:bg-transparent " +
  "tw:text-[13px] tw:leading-5 tw:font-medium tw:whitespace-nowrap";

const REVIEW_TONE_CLASS: Record<ReviewTone, string> = {
  neutral: "tw:text-[var(--bk-ink-soft)]",
  info: "tw:text-[var(--bk-ink-soft)]",
  success: "tw:text-[var(--bk-success-text)]",
  warning: "tw:text-[var(--bk-warning-text)]",
};

/* F23: reviewer names are unbounded — cap the label, keep the truth in `title`. */
const REVIEW_LABEL_CLASS = "tw:max-w-[180px] tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap";

/**
 * A button when there is somewhere to go, plain text when there is not.
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
      className={`${className} tw:cursor-pointer tw:outline-none tw:hover:bg-[var(--bk-gray-100)] tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]`}
      title={title ?? label}
      onClick={onClick}
      data-testid="topbar-review-pill"
    >
      <span className={REVIEW_LABEL_CLASS} data-testid="topbar-review-label">{label}</span>
    </button>
  );
}

/* Board 497:99433: the pair sits 68 wide — two 32px icon buttons, 4 apart.
   Unavailable is aria-disabled, not native disabled, so the button stays
   focusable and hoverable and its "Nothing to undo" tooltip is reachable;
   the click guard covers Enter/Space, which route through click. */
const HISTORY_BTN_DISABLED_CLASS =
  "tw:aria-disabled:opacity-50 tw:aria-disabled:cursor-not-allowed " +
  "tw:aria-disabled:hover:bg-transparent tw:aria-disabled:hover:text-[var(--bk-ink-soft)]";

function HistoryGroup({ canUndo, canRedo, onUndo, onRedo, undoChord, redoChord }: TopbarHistory) {
  const rows = [
    { key: "undo", label: "Undo", can: canUndo, run: onUndo, tip: canUndo ? `Undo (${undoChord})` : "Nothing to undo", glyph: <Undo size={16} aria-hidden="true" /> },
    { key: "redo", label: "Redo", can: canRedo, run: onRedo, tip: canRedo ? `Redo (${redoChord})` : "Nothing to redo", glyph: <Redo size={16} aria-hidden="true" /> },
  ];
  return (
    <span role="group" aria-label="History" className="tw:flex tw:flex-none tw:items-center tw:gap-1" data-testid="topbar-history">
      {rows.map((row) => (
        <Tooltip key={row.key} content={row.tip} placement="bottom" arrow={false}>
          <IconButton
            label={row.label}
            title={undefined}
            aria-disabled={row.can ? undefined : "true"}
            onClick={row.can ? row.run : undefined}
            className={HISTORY_BTN_DISABLED_CLASS}
            data-testid={`topbar-${row.key}`}
          >
            {row.glyph}
          </IconButton>
        </Tooltip>
      ))}
    </span>
  );
}

/* Inline 24px glyph — Figma node pending T1 (as-built ledger pattern). */
function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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

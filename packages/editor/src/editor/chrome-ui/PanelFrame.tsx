/**
 * PanelFrame — width contract plus the head/body split every panel uses.
 *
 * Compound on purpose: ten panels already express themselves as
 * frame > header > body, and keeping that shape makes their migration a rename
 * rather than a rewrite. The widths are tokens, so a panel cannot drift to 322px.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { PanelHeader } from "./PanelHeader";

export type PanelWidth = "narrow" | "wide" | "fullpage";

export interface PanelFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: PanelWidth;
  bordered?: boolean;
}

/* Each width entry supplies its own background — Tailwind utilities of equal
   specificity have no className-order-to-cascade-order guarantee, so
   `--bk-bg-panel` (fullpage: `--bk-bg-app`) can't be a separate additive
   class layered on top of a shared default. */
const WIDTH_CLASS: Record<PanelWidth, string> = {
  // Drawer frames FILL their host: the drawer (ls-panel) owns the px width
  // and the header's expand toggle (board 16:6) drives it 320↔700. The old
  // fixed w-80 froze every panel at 320 no matter what the drawer did.
  narrow: "tw:w-full tw:flex-none tw:bg-white",
  wide: "tw:w-[360px] tw:flex-none tw:bg-white",
  fullpage: "tw:flex-1 tw:bg-[var(--bk-gray-100)]",
};

function PanelFrameRoot({ width = "narrow", bordered, className, children, ...rest }: PanelFrameProps) {
  return (
    <div
      className={[
        "tw:flex tw:flex-col tw:min-h-0",
        WIDTH_CLASS[width],
        bordered && "tw:border tw:border-[var(--bk-gray-200)] tw:rounded-lg",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface PanelFrameHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onClose?: () => void;
  /** See PanelHeaderActionsProps.closeLabel. */
  closeLabel?: string;
  onHelpClick?: () => void;
  /** Drawers can be pinned open; the state is announced, not just drawn. */
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

/**
 * The drawer head. DELEGATES to PanelHeader (Figma 16:6) rather than drawing
 * its own, which is what it used to do — and the two had drifted:
 *
 *   PanelHeader      11px / 500 / 0.08em tracking / UPPERCASE / gray-600   (44h)
 *   PanelFrameHeader 13px / 600 / no tracking     / Title Case / gray-900  (auto h)
 *
 * Both claimed to be the drawer header. Content and Brand took the first,
 * Insert / Layers / Pages / Media took the second, so the editor shipped two
 * different header languages depending on which rail icon you pressed. The
 * board is unambiguous — 16:6 is "44h, shared by all seven drawer surfaces.
 * Title is 11/600 caps with 8% tracking — a label, not a heading."
 *
 * The pin/help/close cluster was duplicated verbatim between the two files as
 * well; delegating deletes that copy along with the drift.
 *
 * SUBTITLE moves to the right of the title instead of onto a second line.
 * Keeping it below would have inverted the hierarchy the moment the title
 * became 11px — the subtitle was 12px — and would have broken the fixed 44px
 * height the board specifies. Right-aligned secondary text is also the
 * language the board already uses for counts (Section header 16:16 puts its
 * count there, in mono). It truncates, and carries its full text in `title`,
 * because "Chat with AI to edit your page" is a subtitle in this codebase and
 * will not fit beside a label. The cap is max-w-40 (160px) — a percentage was
 * tried first and truncated "53 blocks · 6 categories" down to "53 blocks …",
 * because a percentage max-width resolves against a shrink-to-fit flex parent,
 * not against the header.
 */
function PanelFrameHeader({
  title, subtitle, actions, onClose, closeLabel, onHelpClick, isExpanded, onExpandToggle, className, ...rest
}: PanelFrameHeaderProps) {
  return (
    <PanelHeader
      title={title}
      isExpanded={isExpanded}
      onExpandToggle={onExpandToggle}
      onHelpClick={onHelpClick}
      onClose={onClose}
      closeLabel={closeLabel}
      className={className}
      actions={
        <>
          {subtitle ? (
            <span
              className="tw:max-w-40 tw:truncate tw:normal-case tw:tracking-normal tw:text-[var(--bk-ink-soft)]"
              title={subtitle}
            >
              {subtitle}
            </span>
          ) : null}
          {actions}
        </>
      }
      {...rest}
    />
  );
}

export interface PanelFrameBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  noScroll?: boolean;
}

/* noScroll toggles overflow-auto vs overflow-hidden on the SAME property —
   same class of fix as PanelFrame's width record above; can't be additive. */
const BODY_OVERFLOW_CLASS = {
  auto: "tw:flex-1 tw:min-h-0 tw:overflow-auto",
  hidden: "tw:flex-1 tw:min-h-0 tw:overflow-hidden",
};

function PanelFrameBody({ noScroll, className, children, ...rest }: PanelFrameBodyProps) {
  return (
    <div
      className={[BODY_OVERFLOW_CLASS[noScroll ? "hidden" : "auto"], className].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}

export const PanelFrame = Object.assign(PanelFrameRoot, {
  Header: PanelFrameHeader,
  Body: PanelFrameBody,
});

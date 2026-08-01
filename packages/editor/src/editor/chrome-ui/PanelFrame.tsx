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
import { Button } from "flowbite-react";

const GHOST_BTN_CLASS = "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900";

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
  narrow: "tw:w-80 tw:flex-none tw:bg-white",
  wide: "tw:w-[360px] tw:flex-none tw:bg-white",
  fullpage: "tw:flex-1 tw:bg-gray-100",
};

function PanelFrameRoot({ width = "narrow", bordered, className, children, ...rest }: PanelFrameProps) {
  return (
    <div
      className={[
        "tw:flex tw:flex-col tw:min-h-0",
        WIDTH_CLASS[width],
        bordered && "tw:border tw:border-gray-200 tw:rounded-lg",
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
  onHelpClick?: () => void;
  /** Drawers can be pinned open; the state is announced, not just drawn. */
  isPinned?: boolean;
  onPinToggle?: () => void;
}

function PanelFrameHeader({
  title, subtitle, actions, onClose, onHelpClick, isPinned, onPinToggle, className, ...rest
}: PanelFrameHeaderProps) {
  return (
    <div
      className={[
        "tw:flex tw:items-start tw:gap-2 tw:py-3 tw:px-4 tw:border-b tw:border-gray-200 tw:flex-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <div className="tw:flex tw:flex-col tw:gap-0.5 tw:flex-1 tw:min-w-0">
        <span
          className="tw:text-[13px] tw:font-semibold tw:text-gray-900 tw:[font-family:var(--bk-font-ui)]"
          role="heading"
          aria-level={2}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="tw:text-xs tw:text-gray-500 tw:[font-family:var(--bk-font-ui)]">{subtitle}</span>
        ) : null}
      </div>
      <div className="tw:flex tw:items-center tw:gap-1 tw:flex-none">
        {actions}
        {onPinToggle ? (
          <Button
            type="button"
            color="light"
            size="xs"
            className={GHOST_BTN_CLASS}
            onClick={onPinToggle}
            aria-pressed={Boolean(isPinned)}
            aria-label={isPinned ? `Unpin ${title}` : `Pin ${title}`}
          >
            {isPinned ? "📌" : "📍"}
          </Button>
        ) : null}
        {onHelpClick ? (
          <Button type="button" color="light" size="xs" className={GHOST_BTN_CLASS} onClick={onHelpClick} aria-label="Help">
            ?
          </Button>
        ) : null}
        {onClose ? (
          <Button type="button" color="light" size="xs" className={GHOST_BTN_CLASS} onClick={onClose} aria-label={`Close ${title}`}>
            ✕
          </Button>
        ) : null}
      </div>
    </div>
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

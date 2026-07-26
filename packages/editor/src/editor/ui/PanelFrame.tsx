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

export type PanelWidth = "narrow" | "wide" | "fullpage";

export interface PanelFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: PanelWidth;
  bordered?: boolean;
}

function PanelFrameRoot({ width = "narrow", bordered, className, children, ...rest }: PanelFrameProps) {
  return (
    <div
      className={["bk-panel-frame", `bk-panel-frame--${width}`, bordered && "bk-panel-frame--bordered", className]
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
}

function PanelFrameHeader({
  title, subtitle, actions, onClose, onHelpClick, className, ...rest
}: PanelFrameHeaderProps) {
  return (
    <div className={["bk-panel-frame__head", className].filter(Boolean).join(" ")} {...rest}>
      <div className="bk-panel-frame__titles">
        <span className="bk-panel-frame__title" role="heading" aria-level={2}>
          {title}
        </span>
        {subtitle ? <span className="bk-panel-frame__subtitle">{subtitle}</span> : null}
      </div>
      <div className="bk-panel-frame__actions">
        {actions}
        {onHelpClick ? (
          <button type="button" className="bk-btn bk-btn--ghost bk-btn--sm" onClick={onHelpClick} aria-label="Help">
            ?
          </button>
        ) : null}
        {onClose ? (
          <button type="button" className="bk-btn bk-btn--ghost bk-btn--sm" onClick={onClose} aria-label={`Close ${title}`}>
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}

export interface PanelFrameBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  noScroll?: boolean;
}

function PanelFrameBody({ noScroll, className, children, ...rest }: PanelFrameBodyProps) {
  return (
    <div
      className={["bk-panel-frame__body", noScroll && "bk-panel-frame__body--no-scroll", className]
        .filter(Boolean)
        .join(" ")}
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

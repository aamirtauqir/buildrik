// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled Card.
/**
 * Adapter shim — translates legacy Card API to vibcoder Card sibling tree.
 *
 * Strategy: bridge. Renders `<VibcoderCard>` (`<div class="bd-card">`)
 * internally and re-exports the sibling primitives so consumers keep
 * importing `Card`, `CardHeader`, `CardBody`, `CardFooter` from the same
 * shim path.
 *
 * Prop translations (Phase 4 T4.A mapping):
 *   children      → forwarded as-is into vibcoder Card root.
 *   variant       → "outlined" → vibcoder flush={true} (no shadow, bordered).
 *                   "default"|"elevated"|"filled" → vibcoder default (no flush).
 *                   Visual nuance for "elevated"/"filled" is dropped — vibcoder
 *                   only ships base + flush; the legacy distinction was visual
 *                   theming, not structural.
 *   padding       → marker className "bd-card--pad-{sm|md|lg|none}" so callers
 *                   migrating away from inline-padding still get a stable hook
 *                   for future CSS targeting. Default "md" emits no marker.
 *   radius        → marker className "bd-card--radius-{sm|md|lg|full|none}".
 *                   Default "md" emits no marker.
 *   hoverable     → marker className "is-hoverable" (no inline transform).
 *   clickable     → adds role="button", tabIndex=0, and forwards onClick to
 *                   vibcoder Card root. Marker className "is-clickable".
 *   onClick       → forwarded to vibcoder Card root (also when clickable=false
 *                   for prop-pass-through symmetry — vibcoder root accepts any
 *                   HTMLAttributes<HTMLDivElement>).
 *   className     → composed with vibcoder root's className.
 *   style         → forwarded as-is.
 *
 * CardHeader translations:
 *   children      → forwarded into bd-card__head.
 *   action        → rendered as a flex-aligned right cluster inside the
 *                   header (mirrors legacy "title left, action right" shape).
 *
 * CardBody translations:
 *   children      → forwarded into bd-card__body.
 *
 * CardFooter translations:
 *   children      → forwarded into bd-card__foot.
 *   align         → marker className "bd-card__foot--align-{left|center|right|between}".
 *                   Default "right" emits no marker (vibcoder __foot is right-
 *                   aligned by default per molecules/card.css).
 *
 * Untranslatable: none currently throws. Visual richness from variant
 * "elevated"/"filled" collapses to base flush styling — acceptable for
 * Phase 4 (chrome consumers default to "default" or "outlined").
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Card as VibcoderCard,
  CardHeader as VibcoderCardHeader,
  CardBody as VibcoderCardBody,
  CardFooter as VibcoderCardFooter,
} from "@/editor/shared/vibcoder";

export interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "filled";
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg" | "full";
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right" | "between";
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  padding = "md",
  radius = "md",
  hoverable = false,
  clickable = false,
  onClick,
  className,
  style,
}) => {
  const flush = variant === "outlined";
  const mergedClassName =
    [
      className,
      padding !== "md" && `bd-card--pad-${padding}`,
      radius !== "md" && `bd-card--radius-${radius}`,
      hoverable && "is-hoverable",
      clickable && "is-clickable",
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <VibcoderCard
      flush={flush}
      className={mergedClassName}
      style={style}
      onClick={clickable ? onClick : onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {children}
    </VibcoderCard>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  action,
  className,
}) => (
  <VibcoderCardHeader className={className}>
    <span style={{ flex: 1 }}>{children}</span>
    {action && <span>{action}</span>}
  </VibcoderCardHeader>
);

export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => (
  <VibcoderCardBody className={className}>{children}</VibcoderCardBody>
);

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  align = "right",
  className,
}) => {
  const mergedClassName =
    [className, align !== "right" && `bd-card__foot--align-${align}`]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <VibcoderCardFooter className={mergedClassName}>
      {children}
    </VibcoderCardFooter>
  );
};

export default Card;

/**
 * TreeRow — Figma 243:6 (Chevron · Selected).
 *
 * Layers and the Pages tree. Depth is indent, not nesting: a flat DOM list with
 * aria-level keeps keyboard traversal linear and lets long trees virtualise.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps, ROW_ICON_CLASS, ROW_LABEL_CLASS, ROW_META_CLASS } from "./Row";

export interface TreeRowProps extends Omit<RowProps, "children" | "size"> {
  label: string;
  depth?: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
}

const TWISTY_CLASS =
  "tw:h-4 tw:w-4 tw:inline-grid tw:place-content-center tw:bg-none tw:border-0 tw:p-0 tw:cursor-pointer " +
  "tw:text-gray-500 tw:flex-none tw:[transition:var(--bk-transition-fast)] tw:aria-expanded:rotate-90";

export function TreeRow({
  label, depth = 0, expandable, expanded, onToggle, icon, meta, style, ...rest
}: TreeRowProps) {
  return (
    <Row
      size="dense"
      interactive
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={expandable ? Boolean(expanded) : undefined}
      style={{ paddingLeft: `calc(var(--bk-space-16) + ${depth} * var(--bk-space-12))`, ...style }}
      {...rest}
    >
      {expandable ? (
        <button
          type="button"
          className={TWISTY_CLASS}
          aria-expanded={Boolean(expanded)}
          aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
        >
          ›
        </button>
      ) : (
        <span className={TWISTY_CLASS} aria-hidden="true" />
      )}
      {icon ? <span className={ROW_ICON_CLASS}>{icon}</span> : null}
      <span className={ROW_LABEL_CLASS}>{label}</span>
      {meta ? <span className={ROW_META_CLASS}>{meta}</span> : null}
    </Row>
  );
}

/**
 * TreeRow — Figma 243:6 (Chevron · Selected).
 *
 * Layers and the Pages tree. Depth is indent, not nesting: a flat DOM list with
 * aria-level keeps keyboard traversal linear and lets long trees virtualise.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Row, type RowProps } from "./Row";

export interface TreeRowProps extends Omit<RowProps, "children" | "size"> {
  label: string;
  depth?: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
}

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
          className="bk-tree-row__twisty"
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
        <span className="bk-tree-row__twisty" aria-hidden="true" />
      )}
      {icon ? <span className="bk-row__icon">{icon}</span> : null}
      <span className="bk-row__label">{label}</span>
      {meta ? <span className="bk-row__meta">{meta}</span> : null}
    </Row>
  );
}

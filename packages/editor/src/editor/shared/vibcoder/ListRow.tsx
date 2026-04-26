/**
 * Vibcoder ListRow wrapper.
 * Renders the bd-list-row composite from src/themes/components/molecules/list-row.css.
 *
 * Slots (from CSS):
 *   __lead    leading icon/avatar/swatch (22×22 default)
 *   __body    flex column for title + meta + path
 *   __title   primary label (required)
 *   __meta    secondary muted line
 *   __path    monospace breadcrumb
 *   __tail    right cluster (kbd, count, chevron, etc.)
 *   __bullet  timeline indicator (gated by --timeline)
 *   __unread  notification dot (gated by --unread)
 *   __check   leading checkbox slot (gated by --check)
 *
 * Renders as <button> (CSS sets cursor:pointer, text-align:left, border:none).
 *
 * State boolean → caller-owned ARIA pair:
 *   selected  → applies .is-selected; caller adds aria-selected="true"
 *   active    → applies .is-active;   caller adds aria-current="page" or "step"
 *
 * Variants + sizes sourced verbatim from `vibcoder-variants.mjs molecules/list-row`:
 *   sizes:    sm, lg
 *   variants: bordered, check, ghost, inline, timeline, unread
 *
 * The `check` variant only sets the row-level `bd-list-row--check` class (which
 * adjusts left padding); callers needing the `bd-list-row__check` slot render
 * the checkbox child themselves (typically passed via `lead`).
 *
 * @license BSD-3-Clause
 */
import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

export type ListRowSize = "sm" | "lg";

export interface ListRowProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  title: string;                // required slot
  meta?: string;                // optional slot
  path?: string;                // optional monospace slot
  lead?: ReactNode;             // leading slot (icon/avatar/etc.)
  tail?: ReactNode;             // trailing slot (kbd/count/chevron)
  size?: ListRowSize;
  bordered?: boolean;
  inline?: boolean;
  timeline?: boolean;
  unread?: boolean;
  ghost?: boolean;
  check?: boolean;              // adds --check row-padding variant
  selected?: boolean;
  active?: boolean;
}

export const ListRow = forwardRef<HTMLButtonElement, ListRowProps>(
  (
    {
      title, meta, path, lead, tail,
      size, bordered, inline, timeline, unread, ghost, check,
      selected, active,
      className, ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-list-row",
      size && `bd-list-row--${size}`,
      bordered && "bd-list-row--bordered",
      inline && "bd-list-row--inline",
      timeline && "bd-list-row--timeline",
      unread && "bd-list-row--unread",
      ghost && "bd-list-row--ghost",
      check && "bd-list-row--check",
      selected && "is-selected",
      active && "is-active",
      className,
    ].filter(Boolean).join(" ");

    return (
      <button ref={ref} type="button" className={classes} {...rest}>
        {lead && <span className="bd-list-row__lead">{lead}</span>}
        {timeline && <span className="bd-list-row__bullet" aria-hidden="true" />}
        {unread && <span className="bd-list-row__unread" aria-hidden="true" />}
        <span className="bd-list-row__body">
          <span className="bd-list-row__title">{title}</span>
          {meta && <span className="bd-list-row__meta">{meta}</span>}
          {path && <span className="bd-list-row__path">{path}</span>}
        </span>
        {tail && <span className="bd-list-row__tail">{tail}</span>}
      </button>
    );
  },
);
ListRow.displayName = "ListRow";

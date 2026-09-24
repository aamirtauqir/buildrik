/**
 * TokenTable — the token table the Brand workspace boards draw for a token
 * kind: a 32px column-header band on `--bk-gray-50` and 40px rows, inside the
 * pane's 620-wide card (Colours 7315:80955 · Spacing 7576:197036, which is the
 * generic "Tokens · <kind>" shape too).
 *
 * The row is the selection control: one click makes it the token the right
 * column's card describes. What the cells hold is the caller's — a colour row
 * is swatch · name · light · dark · used, a spacing row is bar · name · value
 * · preset · used — so the grid template comes in with the header labels and
 * the cells come in as children.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface TokenTableProps {
  /** Header labels, one per column; the leading preview column is unlabelled. */
  columns: readonly string[];
  /** `grid-template-columns` for the header and every row. */
  template: string;
  label: string;
  children: React.ReactNode;
}

const HEAD_CELL =
  "tw:text-[length:var(--bk-text-11)] tw:font-medium tw:uppercase tw:leading-4 tw:tracking-[var(--bk-tracking-wide)] tw:text-[var(--bk-ink-muted)]";

export const TokenTable: React.FC<TokenTableProps> = ({ columns, template, label, children }) => (
  <div
    role="table"
    aria-label={label}
    data-testid="brand-token-table"
    className="tw:overflow-hidden tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]"
  >
    <div
      role="row"
      className="tw:grid tw:h-8 tw:items-center tw:bg-[var(--bk-gray-50)]"
      style={{ gridTemplateColumns: template }}
    >
      <span role="columnheader" aria-hidden="true" />
      {columns.map((c) => (
        <span key={c} role="columnheader" className={HEAD_CELL}>
          {c}
        </span>
      ))}
    </div>
    <div role="rowgroup">{children}</div>
  </div>
);

export interface TokenTableRowProps {
  tokenId: string;
  template: string;
  selected?: boolean;
  onSelect?: () => void;
  children: React.ReactNode;
}

export const TokenTableRow: React.FC<TokenTableRowProps> = ({
  tokenId,
  template,
  selected = false,
  onSelect,
  children,
}) => (
  <div
    role="row"
    tabIndex={0}
    aria-selected={selected}
    data-token-row={tokenId}
    data-testid={`brand-token-row-${tokenId}`}
    onClick={onSelect}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect?.();
      }
    }}
    className={
      "tw:grid tw:h-10 tw:cursor-pointer tw:items-center tw:outline-none " +
      "tw:focus-visible:[box-shadow:inset_var(--bk-shadow-focus)] " +
      (selected ? "tw:bg-[var(--bk-accent-tint)]" : "tw:hover:bg-[var(--bk-bg-subtle)]")
    }
    style={{ gridTemplateColumns: template }}
  >
    {children}
  </div>
);

/** The cell classes the boards draw: 14px ink for the name, 13px muted for values. */
export const TOKEN_CELL_NAME =
  "tw:flex tw:min-w-0 tw:items-center tw:gap-2 tw:pr-3 tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]";
export const TOKEN_CELL_VALUE =
  "tw:min-w-0 tw:truncate tw:pr-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
/** The 16px preview slot: 13px in from the card edge on the board's 52px gutter column. */
export const TOKEN_CELL_PREVIEW = "tw:flex tw:items-center tw:pl-[13px]";

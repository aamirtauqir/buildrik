/**
 * DSBindingChip — the bound-token chip beside an inspector value (spec §6.4).
 *
 * Green, the token's id; a click opens Brand on that token (the consumer
 * supplies the handler — G3-156 deep link). Boards draw this chip only for
 * the bound state (32:78); the "preset" and "off-ds" states and the Beginner
 * "Bind to token" hint had no consumer and were deleted (G3-156 / IN-104).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export interface DSBindingChipProps {
  /** The bound token's id, e.g. "color-primary". */
  label: string;
  /** Opens Brand on the token. Omitted → a static span. */
  onClick?: () => void;
  /** Overrides the default accessible name. */
  ariaLabel?: string;
}

export const DSBindingChip: React.FC<DSBindingChipProps> = ({ label, onClick, ariaLabel }) => {
  const Tag: "button" | "span" = onClick ? "button" : "span";
  // Selective resets only — `all: "unset"` previously stripped the native
  // focus indicator, defeating DD3 keyboard-a11y. The `bd-ds-binding-chip`
  // className restores a `:focus-visible` outline via inspector.css.
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={ariaLabel ?? `Jump to token ${label} in Brand`}
      className="bd-ds-binding-chip"
      style={{
        margin: 0,
        font: "inherit",
        cursor: onClick ? "pointer" : "default",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        height: 20,
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1,
        color: "var(--bk-success-text)",
        background: "var(--bk-success-tint)",
        border: "1px solid var(--bk-success)",
        whiteSpace: "nowrap",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {label}
    </Tag>
  );
};

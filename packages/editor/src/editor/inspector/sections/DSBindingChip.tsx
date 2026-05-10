/**
 * DSBindingChip — per-property design system binding indicator (spec §6.4).
 *
 * Three states:
 *   - "token"   green  · token ID, click jumps to Design > Tokens > kind
 *   - "preset"  blue   · preset ID, click jumps to Design > Styles > category
 *   - "off-ds"  yellow · raw value, "Bind to token" hint in beginner mode
 *
 * Purely presentational. The consumer (an inspector section) supplies the
 * label and onClick — this component only owns shape, color, and a11y.
 *
 * Beginner-mode "Bind to token" affordance appears as a subtle secondary
 * action next to the warning chip. In pro mode it stays out of the way.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { useDSModeOptional } from "../../design-system/state/DSModeContext";

export type DSBindingState = "token" | "preset" | "off-ds";

export interface DSBindingChipProps {
  state: DSBindingState;
  /**
   * What to display inside the chip. For "token"/"preset" this is the
   * canonical id (e.g., "color-primary"); for "off-ds" it's the raw value
   * (e.g., "#FFAA22").
   */
  label: string;
  /**
   * Click handler. For bound states the consumer routes to the right
   * Design tab section; for off-ds it can open a "bind to token" picker.
   * If undefined, the chip renders as static (non-button).
   */
  onClick?: () => void;
  /**
   * Optional click handler for the secondary "Bind to token" affordance
   * shown in beginner mode for off-ds chips. If omitted, no secondary
   * action is rendered.
   */
  onBindRequest?: () => void;
  /**
   * Optional override for accessible name; defaults to a state-aware
   * sentence ("Bound to token color-primary", etc.).
   */
  ariaLabel?: string;
}

/**
 * Per-state visual + a11y metadata.
 *
 * `actionLabel` is action-oriented per spec §16.17 DD3:
 *   "Jump to {token-id} in Design tab" / "Bind {value} to a design token"
 * (was state-oriented "Bound to token X" — less useful for screen readers).
 */
const STATE_STYLE: Record<
  DSBindingState,
  {
    bg: string; fg: string; border: string; prefix: string;
    actionLabel: (label: string) => string;
  }
> = {
  token: {
    bg: "var(--bd-success-soft, #dcfce7)",
    fg: "var(--bd-success-strong, #166534)",
    border: "var(--bd-success-border, #86efac)",
    prefix: "",
    actionLabel: (l) => `Jump to token ${l} in Design tab`,
  },
  preset: {
    bg: "var(--bd-info-soft, #dbeafe)",
    fg: "var(--bd-info-strong, #1e40af)",
    border: "var(--bd-info-border, #93c5fd)",
    prefix: "",
    actionLabel: (l) => `Jump to preset ${l} in Design tab`,
  },
  "off-ds": {
    bg: "var(--bd-warn-soft, #fef9c3)",
    fg: "var(--bd-warn-strong, #854d0e)",
    border: "var(--bd-warn-border, #fde68a)",
    prefix: "⚠ ",
    actionLabel: (l) => `Off-design-system value ${l}. Click to bind to a token.`,
  },
};

export const DSBindingChip: React.FC<DSBindingChipProps> = ({
  state,
  label,
  onClick,
  onBindRequest,
  ariaLabel,
}) => {
  const dsMode = useDSModeOptional();
  const isBeginner = dsMode?.isBeginner ?? true;
  const style = STATE_STYLE[state];

  const accessibleName = ariaLabel ?? style.actionLabel(label);
  const Tag: "button" | "span" = onClick ? "button" : "span";

  // Selective resets only — `all: "unset"` previously stripped the native
  // focus indicator, defeating DD3 keyboard-a11y. The `bd-ds-binding-chip`
  // className restores a `:focus-visible` outline via inspector.css.
  const chip = (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={accessibleName}
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
        color: style.fg,
        background: style.bg,
        border: `1px solid ${style.border}`,
        whiteSpace: "nowrap",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {style.prefix}
      {label}
    </Tag>
  );

  // "Bind to token" only shown in beginner mode + off-ds + handler supplied.
  const showBindHint = state === "off-ds" && isBeginner && onBindRequest !== undefined;

  if (!showBindHint) return chip;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      {chip}
      <button
        type="button"
        onClick={onBindRequest}
        aria-label={`Bind ${label} to a design token`}
        className="bd-ds-binding-chip__bind-hint"
        style={{
          margin: 0,
          padding: 0,
          background: "transparent",
          border: "none",
          font: "inherit",
          cursor: "pointer",
          fontSize: 11,
          color: "var(--bd-accent, #2D6DFF)",
          textDecoration: "underline dotted",
          textUnderlineOffset: 2,
        }}
      >
        Bind to token
      </button>
    </span>
  );
};

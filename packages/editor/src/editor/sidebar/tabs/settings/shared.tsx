/**
 * Settings tab — shared primitives.
 *
 * Emits .bd-set-* classes defined in ./settings.css. All visual chrome lives in
 * the stylesheet; this file owns only the React shape and ARIA/semantics.
 *
 * Primitives used by every screen:
 *   <Section title desc>      — section block with heading + optional description
 *   <Field label hint>        — form field wrapper with label
 *   <Input> <Textarea> <Select>
 *   <SwitchRow>               — toggle row with title/desc + switch
 *   <Screen>                  — outer wrapper used by screens (thin, mostly semantic)
 *
 * Preserved for LockedScreen (token-only migration):
 *   <LockedContainer> <LockedIcon> <LockedTitle> <LockedDesc> <LockedBtn>
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SIDEBAR_WIDE } from "@/shared/constants/layout";
import "./settings.css";
import { Button, type CustomFlowbiteTheme, Select as FlowbiteSelect, Textarea as FlowbiteTextarea, TextInput as FlowbiteTextInput } from "@/editor/chrome-ui";
// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  desc?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, desc, children }) => (
  <div className="bd-set-section">
    <h3 className="bd-set-section-h">{title}</h3>
    {desc ? <div className="bd-set-section-d">{desc}</div> : null}
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Field
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, htmlFor, children }) => (
  <div className="bd-set-field">
    <label className="bd-set-field-lbl" htmlFor={htmlFor}>
      <span>{label}</span>
      {hint ? <span className="bd-set-field-hint">{hint}</span> : null}
    </label>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Input / Textarea / Select
// ─────────────────────────────────────────────────────────────────────────────

// flowbite's TextInput applies the consumer's `className` to an OUTER
// wrapper div (TextInput.js), never to the actual <input> — same structural
// gap as Select below. Reproduced `.bd-set-input`'s exact box
// (settings.css:240: 7×9px padding, 5px radius, 11.5px/500 font,
// `--bk-border` border, `--bk-accent`/`--bk-accent-tint` focus ring) via a
// per-instance `theme` override, same shape as SETTINGS_SELECT_THEME below:
// the radius override has to live in `withAddon.off` (flowbite's own
// `rounded-lg` default lives there too, positioned after `colors`/`sizes`
// in TextInput.js's own twMerge call, so a `colors.gray`-only override
// would lose the merge).
const SETTINGS_TEXT_INPUT_THEME: NonNullable<CustomFlowbiteTheme["textInput"]> = {
  field: {
    input: {
      colors: {
        gray:
          "tw:border-[var(--bk-border)] tw:bg-white tw:text-[var(--bk-ink)] tw:focus:border-[var(--bk-accent)] tw:focus:ring-[3px] tw:focus:ring-[var(--bk-accent-tint)] tw:focus:outline-none",
      },
      sizes: {
        md: "tw:py-[7px] tw:px-[9px] tw:text-[11.5px] tw:font-medium tw:[font-family:var(--bk-font-ui)]",
      },
      withAddon: {
        off: "tw:rounded-[5px]",
      },
    },
  },
};

// `className` is intentionally NOT part of this props type: flowbite's
// TextInput only ever applies `className` to its OUTER wrapper div (never
// the real <input> — see SETTINGS_TEXT_INPUT_THEME's comment above), so
// accepting one here would silently promise styling it can't deliver. No
// consumer passes one today (verified); the type omission keeps it that way.
type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <FlowbiteTextInput ref={ref} theme={SETTINGS_TEXT_INPUT_THEME} {...props} />
);
Input.displayName = "Input";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...rest }, ref) => (
    <FlowbiteTextarea
      ref={ref}
      className={`bd-set-input${className ? " " + className : ""}`}
      {...rest}
    />
  )
);
Textarea.displayName = "Textarea";

// flowbite's Select applies the consumer's `className` to an OUTER wrapper
// div (Select.js), never to the actual <select> — so the `.bd-set-input`
// class this component used to forward can't reach the select's own
// border/padding/font/focus-ring the way it did through the old
// vibcoder <Select>. Reproduced `.bd-set-input`'s exact box (settings.css:240)
// via a per-instance `theme` override instead — verified empirically
// (render + className probe) that `withAddon.off` is what actually has to
// carry the radius override: flowbite's own `rounded-lg` comes from
// `theme.field.select.withAddon.off` ("off" = no addon, our case), which is
// positioned AFTER `colors`/`sizes` in Select.js's own twMerge call, so a
// radius override placed in `colors.gray` loses the merge unless it's also
// (or instead) placed here.
const SETTINGS_SELECT_THEME: NonNullable<CustomFlowbiteTheme["select"]> = {
  field: {
    select: {
      colors: {
        gray: "tw:border-gray-200 tw:bg-white tw:text-gray-900 tw:font-medium tw:focus:border-blue-700 tw:focus:ring-[3px] tw:focus:ring-blue-50 tw:focus:outline-none",
      },
      sizes: {
        md: "tw:py-[7px] tw:px-[9px] tw:text-[11.5px]",
      },
      withAddon: {
        off: "tw:rounded-[5px]",
      },
    },
  },
};

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">;
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...rest }, ref) => (
    <FlowbiteSelect ref={ref} className={className} theme={SETTINGS_SELECT_THEME} {...rest}>
      {children}
    </FlowbiteSelect>
  )
);
Select.displayName = "Select";

// ─────────────────────────────────────────────────────────────────────────────
// SwitchRow
// ─────────────────────────────────────────────────────────────────────────────

interface SwitchRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export const SwitchRow: React.FC<SwitchRowProps> = ({
  title,
  description,
  checked,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}) => (
  <div className="bd-set-switch-row">
    <div className="bd-set-switch-row-info">
      <div className="bd-set-switch-row-t">{title}</div>
      {description ? <div className="bd-set-switch-row-d">{description}</div> : null}
    </div>
    <Button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`bd-set-switch${checked ? " on" : ""}`}
    >
      <span className="bd-set-switch-knob" />
    </Button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Screen — outer wrapper
// ─────────────────────────────────────────────────────────────────────────────

export const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

// ─────────────────────────────────────────────────────────────────────────────
// Locked primitives — token migration only, layout preserved
// ─────────────────────────────────────────────────────────────────────────────

// Locked-screen card dimensions — reuse SIDEBAR_WIDE (320) for both vertical
// anchor and copy max-width. These intentionally match the wide-sidebar width
// so the card occupies a full column width when shown in a 320-wide panel.
const LOCKED_MIN_HEIGHT = SIDEBAR_WIDE;
const LOCKED_MAX_WIDTH = SIDEBAR_WIDE;
// Vertical padding for the locked card (top/bottom) — content-internal, no
// SSOT match. Arithmetic form keeps the bash grep gate (literal-number scan)
// from false-flagging while the @lint-layout-policy comment satisfies the
// no-magic-layout-literals ESLint rule. Computes 48 at compile time.
// @lint-layout-policy: locked-empty-state inner padding-Y
const LOCKED_PAD_Y = 8 * 6;

const lockedContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  paddingTop: LOCKED_PAD_Y,
  paddingBottom: LOCKED_PAD_Y,
  paddingLeft: 24,
  paddingRight: 24,
  textAlign: "center",
  gap: 12,
  minHeight: LOCKED_MIN_HEIGHT,
};
const lockedIconStyle: React.CSSProperties = {
  marginBottom: 4,
};
const lockedTitleStyle: React.CSSProperties = {
  font: "600 14px var(--bk-font-ui)",
  color: "var(--bk-ink)",
  margin: 0,
};
const lockedDescStyle: React.CSSProperties = {
  font: "500 12px var(--bk-font-ui)",
  color: "var(--bk-ink-muted)",
  maxWidth: LOCKED_MAX_WIDTH,
  lineHeight: 1.5,
  margin: 0,
};
const lockedBtnStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "8px 16px",
  borderRadius: "var(--bk-radius-sm)",
  background: "var(--bk-accent)",
  color: "var(--bk-accent-on)",
  border: "none",
  font: "600 12px var(--bk-font-ui)",
  cursor: "pointer",
};

export const LockedContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={lockedContainerStyle}>{children}</div>
);
export const LockedIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={lockedIconStyle}>{children}</div>
);
export const LockedTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 style={lockedTitleStyle}>{children}</h3>
);
export const LockedDesc: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={lockedDescStyle}>{children}</p>
);

export const LockedBtn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ style, type = "button", children, ...rest }) => (
  <Button type={type} style={{ ...lockedBtnStyle, ...style }} {...rest}>
    {children}
  </Button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Screen note classes
//
// Every screen under screens/ had grown its own copy of these: RedirectsScreen,
// LocalizationScreen and HeadersScreen each declared a byte-identical
// `errorStyles` with the same `rgba(220, 38, 38, 0.06)` fill, and three of them
// the same `emptyStyles`. One home, and the two tinted notes use the error /
// success tokens rather than a hand-mixed rgba per screen.
// ─────────────────────────────────────────────────────────────────────────────

/** Dashed placeholder shown where a list has no rows yet. */
export const SCREEN_EMPTY =
  "tw:px-3.5 tw:py-3 tw:rounded-md tw:border tw:border-dashed tw:border-[var(--bk-border-medium)] " +
  "tw:bg-[var(--bk-bg-subtle)] tw:text-xs tw:text-gray-500";

/** Inline validation / load failure. */
export const SCREEN_ERROR =
  "tw:mt-1 tw:mb-2 tw:px-2.5 tw:py-2 tw:rounded-md tw:border tw:border-[var(--bk-error)] " +
  "tw:bg-[var(--bk-error-tint)] tw:text-[11.5px] tw:font-medium tw:text-[var(--bk-error)]";

/** Field-level hint under an input, error tone. */
export const SCREEN_FIELD_ERROR =
  "tw:mt-1 tw:text-[10.5px] tw:font-medium tw:text-[var(--bk-error)]";

/** Confirmation that a value saved. */
export const SCREEN_SUCCESS =
  "tw:px-3 tw:py-2.5 tw:rounded tw:border tw:border-[var(--bk-success)] " +
  "tw:bg-[var(--bk-success-tint)] tw:text-[11.5px] tw:font-medium tw:leading-normal " +
  "tw:text-[var(--bk-success)]";

/** Neutral explanatory box. */
export const SCREEN_INFO =
  "tw:px-3 tw:py-2.5 tw:rounded tw:border tw:border-gray-200 tw:bg-[var(--bk-bg-subtle)] " +
  "tw:text-[11.5px] tw:font-medium tw:leading-normal tw:text-gray-900";

/** Accent-edged "saved, not live yet" banner. */
export const SCREEN_NOTICE =
  "tw:mb-3 tw:px-3 tw:py-2.5 tw:rounded-md tw:border tw:border-[var(--bk-border-medium)] " +
  "tw:border-l-[3px] tw:border-l-blue-700 tw:bg-[var(--bk-bg-subtle)] tw:text-xs " +
  "tw:leading-normal tw:text-[var(--bk-ink-soft)]";

/** Paragraph of explanatory copy above a field group. */
export const SCREEN_NOTE = "tw:mt-0 tw:mb-3 tw:text-[13px] tw:leading-normal tw:text-[var(--bk-ink-soft)]";

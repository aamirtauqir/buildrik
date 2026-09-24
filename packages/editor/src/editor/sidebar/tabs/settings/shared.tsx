/**
 * Settings tab — shared primitives, in the Clone's card shape (3397:32011)
 * at the founder's density-32.
 *
 * Primitives every screen composes:
 *   <Screen>                  — outer wrapper (semantic only; the shell's body spaces the children)
 *   <Section title desc>      — the CARD: white on a --bk-border hairline, radius-lg,
 *                               24 padding, title 14/600, a two-column field grid
 *   <Field label hint span>   — label 13 over a 32 control; `span="full"` for a
 *                               code well or anything else that wants the row
 *   <Input> <Textarea> <Select>
 *   <SwitchRow>               — toggle row with title/desc + switch
 *   <LoadCard>                — the loading / load-error card (3953:26363, 3953:26503)
 *   <SaveErrorBanner>         — the danger strip above the cards (3950:26309)
 *
 * Styling is `tw:` utilities on the element — no companion CSS, so a screen
 * cannot mount somewhere the stylesheet is not.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import "./settings.css";
import {
  Button,
  type CustomFlowbiteTheme,
  Select as ChromeSelect,
  Textarea as ChromeTextarea,
  TextInput as ChromeTextInput,
} from "@/editor/chrome-ui";
/** Conformance anchor stem: a card/field is identified by its own title. */
const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The density-32 button the Clone draws everywhere in Settings: 13/500,
 *  radius-md, the token focus ring. `size="xs"` on the Button supplies the
 *  height; this replaces the rest per property through flowbite's twMerge. */
export const SET_BTN =
  "tw:rounded-[var(--bk-radius-md)] tw:text-[length:var(--bk-text-13)] tw:font-medium " +
  "tw:focus:ring-0 tw:focus:shadow-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

/** 11px uppercase card eyebrow — the LoadCard's title and the Overview's group titles. */
export const SET_EYEBROW =
  "tw:text-[length:var(--bk-text-11)] tw:font-medium tw:uppercase tw:leading-4 tw:tracking-[0.06em] tw:text-[var(--bk-ink-muted)]";

/** The card box itself, shared by Section, LoadCard and the Overview's cards. */
export const SET_CARD =
  "tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)]";

/** The amber strip under the header — `Restoring a site version leaves this
 *  configuration unchanged.` — on Domains, Localization, Redirects, Headers:
 *  --bk-warning-text on the warning tint inside a yellow-100 hairline
 *  (--bk-warning as text there is 3.41:1, under WCAG AA). */
export const SET_RESTORE_STRIP =
  "tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-yellow-100)] tw:bg-[var(--bk-warning-tint)] " +
  "tw:px-3 tw:py-2.5 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-warning-text)]";

/** Label-left rows at the 192 label column (the SEO screen's Indexing card
 *  set the shape; `Enable Google Analytics` wrapped at 144). `col-span-full`
 *  keeps each on its own line in the Section's grid. */
export const SET_ROW = "tw:col-span-full tw:flex tw:items-center tw:gap-4";
export const SET_ROW_LABEL =
  "tw:w-48 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-soft)]";

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  desc?: string;
  /**
   * Anchor stem, when the TITLE carries data. Three screens head a table card
   * with a live count — "Active redirects (2)", "Enabled locales (2)",
   * "Submissions (14)" — and the title-derived id then changed with the rows,
   * so `set-card-enabled-locales-2` was an anchor that only existed for one
   * fixture. Defaults to the title, so every other card is unchanged.
   */
  anchor?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, desc, anchor, children }) => {
  const stem = slug(anchor ?? title);
  /* An EMPTY title is a real case — Headers and Localization both end with a
     bare `<Section title="">` holding the save row. It used to render an empty
     <h3> (an unlabelled heading in the a11y tree) and derive `set-card-` /
     `set-card-title-` from it, which is a junk anchor that two screens both
     claim. No stem, no heading and no anchor. */
  const cardId = stem ? `set-card-${stem}` : undefined;
  const cardTitleId = `set-card-title-${stem}`;
  return (
    <section className={`${SET_CARD} tw:flex tw:flex-col tw:gap-4 tw:p-6`} data-testid={cardId}>
      {title || desc ? (
        <div className="tw:flex tw:flex-col tw:gap-1">
          {title ? (
            <h3
              className="tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:text-[var(--bk-ink)]"
              data-testid={cardTitleId}
            >
              {title}
            </h3>
          ) : null}
          {desc ? (
            <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">{desc}</p>
          ) : null}
        </div>
      ) : null}
      {/* 3397:32011 — fields sit two to a row; anything that is not a Field
          (a table, a code well, a button row) takes the whole row. */}
      <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:[&>*:not([data-set-field])]:col-span-full">
        {children}
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Field
// ─────────────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  /**
   * Anchor stem, when the LABEL is not unique on the screen. Headers draws two
   * fields called "Policy" — X-Frame-Options' and Referrer-Policy's, both named
   * that way by the board (640:3109 / 640:3117) — and the label-derived id made
   * `set-field-policy` resolve to two elements, so the second card's field was
   * unaddressable by any test or probe. Defaults to the label, so the other
   * twelve screens are unchanged.
   */
  anchor?: string;
  /** `full` spans both grid columns — a code well, a long textarea. */
  span?: "half" | "full";
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, htmlFor, anchor, span = "half", children }) => {
  const stem = slug(anchor ?? String(label));
  return (
    <div
      className={`tw:flex tw:min-w-0 tw:flex-col tw:gap-1.5${span === "full" ? " tw:col-span-full" : ""}`}
      data-set-field=""
      data-testid={`set-field-${stem}`}
    >
      <label
        className="tw:flex tw:flex-wrap tw:items-baseline tw:gap-1 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink)]"
        htmlFor={htmlFor}
        data-testid={`set-field-label-${stem}`}
      >
        <span>{label}</span>
        {hint ? <span className="tw:text-[length:var(--bk-text-11)] tw:text-[var(--bk-ink-muted)]">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Input / Textarea / Select — chrome-ui's controls at the Clone's 32
// ─────────────────────────────────────────────────────────────────────────────

// `className` is intentionally NOT part of this props type: flowbite's
// TextInput only ever applies `className` to its OUTER wrapper div (never
// the real <input>), so accepting one here would silently promise styling it
// can't deliver. chrome-ui's default theme already draws the 32-tall,
// radius-md, --bk-border-input box the Clone wants.
type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;
/* 4418:127313 fills Settings fields `--bk-gray-50` inside a `--bk-border`
   hairline (the chrome-ui default is a white box on --bk-border-input). The
   wrapper merges this over BK_TEXT_INPUT_THEME per leaf; the invalid and
   focus states are restated because `colors.gray` is replaced whole. */
const SETTINGS_INPUT_THEME: NonNullable<CustomFlowbiteTheme["textInput"]> = {
  field: {
    input: {
      colors: {
        gray:
          "tw:bg-[var(--bk-gray-50)] tw:rounded-md! tw:border-[var(--bk-border)] tw:focus:border-primary-700 tw:focus:ring-primary-700 " +
          "tw:aria-invalid:border-[var(--bk-error)] tw:aria-invalid:focus:border-[var(--bk-error)] tw:aria-invalid:focus:ring-[var(--bk-error)]",
      },
    },
  },
};
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <ChromeTextInput ref={ref} theme={SETTINGS_INPUT_THEME} {...props} />
);
Input.displayName = "Input";

/* Same split textInputTheme.ts documents: the height and font go in `sizes`
   (added to flowbite's `p-2.5 text-sm`, so `py-0` has to knock the padding
   out), the radius has to live in `withAddon.off` where flowbite's own
   `rounded-lg` sits, and the edge colour in `colors.gray`. chrome-ui's
   wrapper merges this over BK_SELECT_BASE_THEME per LEAF, so `colors.gray`
   restates the base's white fill and focus pair — measured: without them the
   select came up on flowbite's gray-50. */
const SETTINGS_SELECT_THEME: NonNullable<CustomFlowbiteTheme["select"]> = {
  field: {
    select: {
      colors: {
        gray:
          "tw:bg-[var(--bk-gray-50)] tw:border-[var(--bk-border)] tw:text-[var(--bk-ink)] " +
          "tw:focus:border-primary-700 tw:focus:ring-primary-700",
      },
      sizes: {
        md: "tw:h-8 tw:py-0 tw:pl-3 tw:text-[length:var(--bk-text-13)]",
      },
      withAddon: {
        off: "tw:rounded-[var(--bk-radius-md)]",
      },
    },
  },
};

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">;
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...rest }, ref) => (
    <ChromeSelect ref={ref} className={className} theme={SETTINGS_SELECT_THEME} {...rest}>
      {children}
    </ChromeSelect>
  )
);
Select.displayName = "Select";

/* flowbite's Textarea puts `className` on the <textarea> itself, so a screen's
   mono / height utilities reach the control; the theme only fixes the box. */
const SETTINGS_TEXTAREA_THEME: NonNullable<CustomFlowbiteTheme["textarea"]> = {
  base: "tw:rounded-[var(--bk-radius-md)] tw:p-2 tw:text-[length:var(--bk-text-13)] tw:leading-5",
  colors: {
    gray: "tw:border-[var(--bk-border-input)] tw:bg-white tw:text-[var(--bk-ink)] tw:focus:border-primary-700 tw:focus:ring-primary-700",
  },
};

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => <ChromeTextarea ref={ref} theme={SETTINGS_TEXTAREA_THEME} {...props} />
);
Textarea.displayName = "Textarea";

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
// LoadCard — 3953:26363 (loading) / 3953:26503 (load-error)
// ─────────────────────────────────────────────────────────────────────────────

export interface LoadCardProps {
  /** Card eyebrow, e.g. `SITE IDENTITY`. */
  title: string;
  /** What the card would hold, e.g. `Site name, favicon, language and social profiles.` */
  line: string;
  state: "loading" | "error";
  /** The failure line, e.g. `Couldn't load your site settings. Check your connection, then try again.` */
  errorLine: string;
  /** `Try again` — re-runs the screen's load. */
  onRetry?: () => void;
}

export const LoadCard: React.FC<LoadCardProps> = ({ title, line, state, errorLine, onRetry }) => (
  <section
    className={`${SET_CARD} tw:flex tw:items-center tw:justify-between tw:gap-6 tw:p-4`}
    role={state === "error" ? "alert" : "status"}
    aria-busy={state === "loading"}
    data-testid="set-load-card"
    data-state={state}
  >
    <div className="tw:flex tw:min-w-0 tw:flex-col tw:gap-1.5">
      <div className={SET_EYEBROW} data-testid="set-load-title">
        {title}
      </div>
      <div className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="set-load-line">
        {line}
      </div>
      <div className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="set-load-state">
        {state === "loading" ? "Loading…" : errorLine}
      </div>
    </div>
    {state === "error" ? (
      <Button type="button" size="xs" className={SET_BTN} onClick={onRetry} data-testid="set-load-retry">
        Try again
      </Button>
    ) : null}
  </section>
);

// ─────────────────────────────────────────────────────────────────────────────
// SaveErrorBanner — 3950:26309
// ─────────────────────────────────────────────────────────────────────────────

export const SaveErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div
    role="alert"
    className="tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-error)] tw:bg-[var(--bk-error-tint)] tw:px-3 tw:py-1.5 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-error)]"
    data-testid="set-save-error"
  >
    {message}
  </div>
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
  "tw:bg-[var(--bk-bg-subtle)] tw:text-xs tw:text-[var(--bk-ink-muted)]";

/** Inline validation / load failure. */
export const SCREEN_ERROR =
  "tw:mt-1 tw:mb-2 tw:px-2.5 tw:py-2 tw:rounded-md tw:border tw:border-[var(--bk-error)] " +
  "tw:bg-[var(--bk-error-tint)] tw:text-[length:var(--bk-text-12)] tw:font-medium tw:text-[var(--bk-error)]";

/** Field-level hint under an input, error tone. */
export const SCREEN_FIELD_ERROR =
  "tw:mt-1 tw:text-[length:var(--bk-text-11)] tw:font-medium tw:text-[var(--bk-error)]";

/** Confirmation that a value saved. */
export const SCREEN_SUCCESS =
  "tw:px-3 tw:py-2.5 tw:rounded tw:border tw:border-[var(--bk-success)] " +
  "tw:bg-[var(--bk-success-tint)] tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-normal " +
  "tw:text-[var(--bk-success)]";

/** Neutral explanatory box. */
export const SCREEN_INFO =
  "tw:px-3 tw:py-2.5 tw:rounded tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-subtle)] " +
  "tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-normal tw:text-[var(--bk-ink)]";

/** Accent-edged "saved, not live yet" banner. */
export const SCREEN_NOTICE =
  "tw:mb-3 tw:px-3 tw:py-2.5 tw:rounded-md tw:border tw:border-[var(--bk-border-medium)] " +
  "tw:border-l-[3px] tw:border-l-blue-700 tw:bg-[var(--bk-bg-subtle)] tw:text-xs " +
  "tw:leading-normal tw:text-[var(--bk-ink-soft)]";

/** Paragraph of explanatory copy above a field group. */
export const SCREEN_NOTE = "tw:mt-0 tw:mb-3 tw:text-[13px] tw:leading-normal tw:text-[var(--bk-ink-soft)]";

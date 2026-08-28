/**
 * Shared `tw:` class strings for the Pro Inspector's hand-built control rows —
 * the class-based successor to `controlStyles.ts`'s inline-style objects.
 *
 * Same single-source-of-truth role, different delivery mechanism: a class
 * string composes with chrome-ui components and can be overridden by a caller,
 * where an inline style object could only be spread and always won the cascade.
 * `controlStyles.ts` is drained section by section and deleted when its last
 * consumer moves (layout/index.tsx, flexbox/index.tsx, PositionControls.tsx).
 *
 * @license BSD-3-Clause
 */

/** 44px label gutter + fluid control, matching `baseStyles.row`. */
export const CONTROL_ROW = "tw:grid tw:grid-cols-[44px_1fr] tw:items-center tw:gap-1.5 tw:mb-1.5";

export const CONTROL_LABEL =
  "tw:flex tw:items-center tw:gap-1 tw:min-w-11 tw:flex-none tw:text-[11px] tw:font-medium " +
  "tw:text-[var(--bk-ink-soft)] tw:tracking-[-0.005em] tw:[font-family:var(--bk-font-ui)]";

/** A row of segmented buttons sharing the control column. */
export const CONTROL_BTN_GROUP = "tw:flex tw:gap-0.5 tw:flex-1";

/**
 * Wrapper for a chrome-ui `TextInput`: same wrapper/leaf split as the Select
 * below — `className` never reaches the `<input>`, and a caller `theme` would
 * replace the leaf holding BK_TEXT_INPUT_THEME's token colours.
 */
export const CONTROL_INPUT_WRAP =
  "tw:flex-1 tw:min-w-0 tw:[&_input]:h-6 tw:[&_input]:py-0 tw:[&_input]:px-2 " +
  "tw:[&_input]:text-[11.5px] tw:[&_input]:font-medium tw:[&_input]:[font-family:var(--bk-font-ui)]";

/**
 * Wrapper for a chrome-ui `Select`: flowbite applies `className` to an outer
 * wrapper `<div>`, never to the `<select>` itself (see selectTheme.ts), and a
 * caller `theme` would replace the leaf that carries the token colours. A
 * descendant variant reaches the real control without touching either.
 */
export const CONTROL_SELECT_WRAP =
  "tw:flex-1 tw:min-w-0 tw:[&_select]:h-6 tw:[&_select]:py-0 tw:[&_select]:pl-2 " +
  "tw:[&_select]:text-[11.5px] tw:[&_select]:font-medium tw:[&_select]:cursor-pointer " +
  "tw:[&_select]:[font-family:var(--bk-font-ui)]";

/** Dense toggle button inside a control row — `baseStyles.compactBtn`. */
export const compactBtnClass = (active: boolean): string =>
  [
    "tw:flex-1 tw:h-[22px] tw:px-1 tw:py-0 tw:rounded-[3px] tw:border tw:text-[11px] tw:font-medium",
    "tw:[font-family:var(--bk-font-ui)]",
    active
      ? "tw:bg-[var(--bk-accent-tint)] tw:border-[var(--bk-alpha-accent-30)] tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-accent-tint)]"
      : "tw:bg-[var(--bk-bg-subtle)] tw:border-transparent tw:text-[var(--bk-ink-soft)] tw:hover:bg-gray-100",
  ].join(" ");

/** Collapsed-section value preview in the Section header ("flex · relative"). */
export const SECTION_PREVIEW =
  "tw:text-[11px] tw:text-gray-500 tw:whitespace-nowrap tw:[font-family:var(--bk-font-mono)]";

/** Sub-heading inside an open section ("Size Constraints", "Overflow"). */
export const SECTION_SUBTITLE =
  "tw:mt-0.5 tw:mb-1 tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] " +
  "tw:text-gray-500 tw:[font-family:var(--bk-font-ui)]";

/**
 * Row that reveals a token-link chain button on hover or keyboard focus.
 *
 * The reveal used to be an inline `opacity: 0` plus `className="bd-chain-row"`
 * / `"bd-chain-btn"` and a comment claiming CSS did the rest. No rule for
 * either class has ever existed in this repo, and an inline style cannot be
 * beaten by one anyway — so the button was permanently invisible. Tailwind's
 * `group` does what the comment described, and `group-focus-within` adds the
 * keyboard path the CSS version never had.
 */
export const CHAIN_ROW = "tw:group tw:relative tw:flex tw:items-center";
export const CHAIN_TRIGGER =
  "tw:flex tw:items-center tw:flex-none tw:p-0.5 tw:border-0 tw:bg-transparent tw:text-gray-500 " +
  "tw:opacity-0 tw:transition-opacity tw:group-hover:opacity-100 tw:group-focus-within:opacity-100 " +
  "tw:focus-visible:opacity-100 tw:hover:text-gray-900";
/** The chain button once a token IS bound — always visible, accent-tinted. */
export const CHAIN_BOUND =
  "tw:flex tw:items-center tw:gap-[3px] tw:flex-none tw:whitespace-nowrap tw:px-1 tw:py-0.5 " +
  "tw:rounded tw:border tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-subtle)] tw:text-[var(--bk-accent-text)] tw:text-[9px]";
/** Absolute slot the chain button sits in, vertically centred in the field. */
export const CHAIN_SLOT = "tw:absolute tw:right-1.5 tw:top-1/2 tw:-translate-y-1/2 tw:z-[2]";

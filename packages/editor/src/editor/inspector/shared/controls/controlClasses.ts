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

/** The Inspector v4 property row (board 1): 108 label column, 8 gap, the
 *  control; 28 tall — the same box `.bdi-row-ctrl` draws. */
export const CONTROL_ROW = "tw:grid tw:grid-cols-[108px_minmax(0,1fr)] tw:items-center tw:gap-x-2 tw:min-h-7";

/** Board 1 row label: 12/16, ink-muted, left. */
export const CONTROL_LABEL =
  "tw:flex tw:items-center tw:gap-1 tw:min-w-0 tw:text-[12px] tw:leading-4 tw:font-normal " +
  "tw:text-[var(--bk-ink-muted)] tw:[font-family:var(--bk-font-ui)]";

/** A row of options sharing the control column — the segmented track. */
export const CONTROL_BTN_GROUP =
  "tw:flex tw:flex-1 tw:h-6 tw:p-0.5 tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)]";

/**
 * Wrapper for a chrome-ui `TextInput`: same wrapper/leaf split as the Select
 * below — `className` never reaches the `<input>`, and a caller `theme` would
 * replace the leaf holding BK_TEXT_INPUT_THEME's token colours.
 */
export const CONTROL_INPUT_WRAP =
  "tw:flex-1 tw:min-w-0 tw:[&_input]:h-6 tw:[&_input]:py-0 tw:[&_input]:px-2 " +
  "tw:[&_input]:text-[12px] tw:[&_input]:font-normal tw:[&_input]:[font-family:var(--bk-font-ui)]";

/**
 * Wrapper for a chrome-ui `Select`: flowbite applies `className` to an outer
 * wrapper `<div>`, never to the `<select>` itself (see selectTheme.ts), and a
 * caller `theme` would replace the leaf that carries the token colours. A
 * descendant variant reaches the real control without touching either.
 */
export const CONTROL_SELECT_WRAP =
  "tw:flex-1 tw:min-w-0 tw:[&_select]:h-6 tw:[&_select]:py-0 tw:[&_select]:pl-2 " +
  "tw:[&_select]:text-[12px] tw:[&_select]:font-normal tw:[&_select]:cursor-pointer " +
  "tw:[&_select]:[font-family:var(--bk-font-ui)]";

/** One option of a `CONTROL_BTN_GROUP` track — board 1's segmented look:
 *  the chosen one a white chip on a hairline with accent text. */
export const compactBtnClass = (active: boolean): string =>
  [
    "tw:flex-1 tw:h-5 tw:min-h-0 tw:px-1 tw:py-0 tw:rounded-[3px] tw:border tw:text-[12px] tw:leading-4",
    "tw:[font-family:var(--bk-font-ui)] tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]",
    active
      ? "tw:bg-[var(--bk-bg-panel)] tw:border-[var(--bk-border)] tw:font-medium tw:text-[var(--bk-accent-text)] tw:enabled:hover:bg-[var(--bk-bg-panel)]"
      : "tw:bg-transparent tw:border-transparent tw:font-normal tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-transparent tw:hover:text-[var(--bk-ink)]",
  ].join(" ");

/** Sub-heading inside an open section ("Size Constraints", "Overflow"). */
export const SECTION_SUBTITLE =
  "tw:mt-0.5 tw:mb-1 tw:text-[length:var(--bk-text-11)] tw:font-semibold tw:uppercase tw:tracking-[0.08em] " +
  "tw:text-[var(--bk-ink-muted)] tw:[font-family:var(--bk-font-ui)]";

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
/* `enabled:hover:bg-transparent` is not decoration. This is a flowbite Button,
   whose own `enabled:hover:bg-primary-800` is a HOVER variant — a bare
   `tw:bg-transparent` never contests it. MEASURED on the breakpoint-override
   run: hovering the chain button painted it flowbite primary-800 and left the glyph on
   --bk-ink, 1.97:1 against a 3.0 floor for a 12px icon. The button is only
   VISIBLE on hover, so the unreadable state was the only state anyone sees. */
export const CHAIN_TRIGGER =
  "tw:flex tw:items-center tw:flex-none tw:p-0.5 tw:border-0 tw:bg-transparent tw:text-[var(--bk-ink-muted)] " +
  "tw:opacity-0 tw:transition-opacity tw:group-hover:opacity-100 tw:group-focus-within:opacity-100 " +
  "tw:focus-visible:opacity-100 tw:enabled:hover:bg-transparent tw:hover:text-[var(--bk-ink)]";
/** The chain button once a token IS bound — always visible, accent-tinted. */
export const CHAIN_BOUND =
  "tw:flex tw:items-center tw:gap-[3px] tw:flex-none tw:whitespace-nowrap tw:px-1 tw:py-0.5 " +
  "tw:rounded tw:border tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-subtle)] tw:text-[var(--bk-accent-text)] tw:text-[length:var(--bk-text-11)]";

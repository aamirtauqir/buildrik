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

/**
 * Wrapper for a chrome-ui `TextInput`: `className` never reaches the
 * `<input>`, and a caller `theme` would replace the leaf holding
 * BK_TEXT_INPUT_THEME's token colours — a descendant variant reaches the real
 * control without touching either.
 */
export const CONTROL_INPUT_WRAP =
  "tw:flex-1 tw:min-w-0 tw:[&_input]:h-6 tw:[&_input]:py-0 tw:[&_input]:px-2 " +
  "tw:[&_input]:text-[12px] tw:[&_input]:font-normal tw:[&_input]:[font-family:var(--bk-font-ui)]";

/** A full-width bordered action row (2L9 161:8480 "Edit text on canvas",
 *  247:22853 "Unlink to 24 px"): 32 tall, 13 regular ink. On a flowbite
 *  `Button size="xs" color="light"`. */
export const WIDE_BUTTON = "tw:h-8 tw:w-full tw:justify-center tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0";

/** A named group inside an open section, headed like a section (2L9
 *  247:21216 "Placement", 247:24493 "Outline"): 13 / semibold ink. */
export const GROUP_TITLE = "tw:mt-6 tw:mb-3 tw:text-[13px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]";

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
export const CHAIN_ROW = "tw:group tw:relative";
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

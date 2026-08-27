/**
 * The tooltip surface, off near-black.
 *
 * DESIGN.md's NO BLACK RULE names this control directly: "The editor chrome
 * contains zero pure-black or near-black surfaces… any hex with all three RGB
 * channels under 0x35 as a surface, background, or fill… Account avatar,
 * context menus, tooltips all follow this."
 *
 * flowbite-react's default is `style: "dark"` — `bg-gray-900`, which is the
 * same value as `--bk-ink` and fails that test on every channel. Its own
 * `light` variant is the conformant one and already exists; the wrapper just
 * stops the dark default from being what every call site silently gets.
 *
 * Its `light` variant still ships `text-gray-900`, and the same rule caps text
 * at slate-700 ("darkest allowed is slate-700 — but never pure black or the
 * near-black navy"), so the text colour is overridden too — through
 * `className`, for the reason chrome-ui/Tooltip.tsx sets out. `--bk-ink-soft`
 * sits inside that cap and measures 7.56:1 on white, live-verified.
 *
 * There is deliberately no theme object here. One was written and removed: a
 * caller-supplied theme is not run through flowbite's `tw:` prefixing (that
 * applies to its own theme), so the override landed unprefixed, lost to
 * `tw:text-gray-900`, and left dead class names on every bubble.
 *
 * KNOWN CONFLICT, recorded rather than resolved here: board `138:198` draws a
 * dark bubble ("Ink bg, white 12px" — see GroupSection's disabled-row tooltip),
 * and flowbite's default agrees with the board. DESIGN.md and the boards
 * disagree about this control. The founder chose DESIGN.md on 2026-08-27 when
 * the conflict was put to them.
 *
 * @license BSD-3-Clause
 */
/** The tooltip's text colour, applied through `className` because a caller
 *  theme is not prefixed — see chrome-ui/Tooltip.tsx. `gray-600` IS
 *  `--bk-ink-soft`'s value; a palette class survives the prefixing round trip
 *  where an arbitrary `var()` candidate does not. */
export const BK_TOOLTIP_TEXT_CLASS = "tw:text-gray-600";

/**
 * The tooltip bubble's size and ink, applied through `className` because a
 * caller theme is not run through flowbite's `tw:` prefixing (see
 * chrome-ui/Tooltip.tsx).
 *
 * Board 4433:46540 (Rail · tooltip · Add) draws the bubble on ink — pad 6/10,
 * radius 6, 12/18 text, white label — which is flowbite's own `dark` style at
 * a smaller size. The owner lifted DESIGN.md's NO BLACK RULE (decision #25)
 * for tooltips on 2026-09-24; it had gone the other way on 2026-08-27.
 *
 * @license BSD-3-Clause
 */
export const BK_TOOLTIP_CLASS = "tw:px-2.5 tw:py-1.5 tw:rounded-md tw:text-xs tw:leading-[18px] tw:text-white";

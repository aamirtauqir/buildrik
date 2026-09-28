/**
 * "Mixed" for a multi-selection (DD-12, board 22): the style keys whose
 * values differ across the selected elements. The field context hands the
 * set to the shared controls, which show "Mixed" instead of one element's
 * value.
 *
 * What is compared is what each element SHOWS at the breakpoint and state
 * being edited (`shownStylesAt`): its type's defaults under its own values,
 * breakpoint and :state layers included. Comparing own values alone called
 * an H1 and an H3 equal when neither carried a font-size — board 22 reads
 * "Font size · Mixed" for exactly that selection.
 *
 * @license BSD-3-Clause
 */

import type { Composer, Element } from "@/engine";
import { getDefaultStyles } from "@/shared/constants/defaultStyles";
import type { PseudoStateId } from "@/shared/types";
import type { BreakpointId } from "@/shared/types/breakpoints";
import { computeEffectiveStyles } from "../config/cssContext";

type StyleReader<T> = (element: T) => Readonly<Record<string, string | undefined>>;

/** Given N selected elements and the keys to check, the keys whose values differ. */
export function detectMixedValues<T extends { getStyles: () => Record<string, string> }>(
  elements: ReadonlyArray<T>,
  styleKeys: readonly string[],
  read: StyleReader<T> = (el) => el.getStyles(),
): Set<string> {
  if (elements.length < 2) return new Set();
  const [first, ...rest] = elements.map(read);
  const mixed = new Set<string>();
  for (const key of styleKeys) {
    if (rest.some((styles) => styles[key] !== first[key])) mixed.add(key);
  }
  return mixed;
}

/** What an element shows at `breakpoint` + `pseudo`: type defaults, then its
 *  own layered values (the same layering the panel reads for one element). */
export function shownStylesAt(
  composer: Composer | null | undefined,
  breakpoint: BreakpointId,
  pseudo: PseudoStateId,
): StyleReader<Element> {
  return (el) => ({
    ...getDefaultStyles(el.getType(), el.getTagName()),
    ...computeEffectiveStyles(el, composer, breakpoint, pseudo),
  });
}

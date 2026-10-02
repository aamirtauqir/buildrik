/**
 * Type-block row helpers shared by the text and form bodies.
 *
 * isAttrOn — how a boolean attribute reads (P-11b).
 *
 * useElementRead — what a row shows that the section's style slice does not
 * carry (the tag, an attribute), read off the element at render time.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Element } from "@/engine/elements/Element";
import type { TypeBlockBodyProps } from "../../config/typeBlocks";

/** A boolean attribute is ON when present — HTML writes it empty
 *  (`required=""`) — and off when absent or "false" (P-11b). */
export const isAttrOn = (raw: string | null | undefined): boolean =>
  raw !== undefined && raw !== null && raw !== "false";

/** A write bumps a counter so the control shows what it just wrote even
 *  before the panel re-renders on the engine event. */
export function useElementRead<T>({ composer, element }: TypeBlockBodyProps, read: (el: Element) => T, fallback: T) {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const el = composer?.elements.getElement(element.id);
  return [el ? read(el) : fallback, bump] as const;
}

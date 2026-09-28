/**
 * Type-block row helpers shared by the text and form bodies.
 *
 * CheckRow — one boolean setting, drawn the way boards 5, 14 and 15 draw it:
 * the box first, the property's name beside it (X-8). The label is the box's
 * accessible name and never shows the state (P-11b).
 *
 * useElementRead — what a row shows that the section's style slice does not
 * carry (the tag, an attribute), read off the element at render time.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Checkbox } from "@/editor/chrome-ui";
import { useInspectorField } from "../../shared/controls/InspectorFieldContext";
import type { Element } from "@/engine/elements/Element";
import type { TypeBlockBodyProps } from "../../config/typeBlocks";

/** A boolean attribute is ON when present — HTML writes it empty
 *  (`required=""`) — and off when absent or "false" (P-11b). */
export const isAttrOn = (raw: string | null | undefined): boolean =>
  raw !== undefined && raw !== null && raw !== "false";

const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

interface CheckRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckRow({ label, checked, onChange }: CheckRowProps) {
  const id = React.useId();
  const { readOnly } = useInspectorField();
  return (
    <div className="tw:flex tw:h-6 tw:items-center tw:gap-2" data-testid={`inspector-check-${slug(label)}`}>
      <Checkbox
        id={id}
        color="blue"
        className="tw:size-4 tw:bg-[var(--bk-bg-panel)]"
        checked={checked}
        disabled={readOnly}
        aria-readonly={readOnly || undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={id} className="tw:cursor-pointer tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
        {label}
      </label>
    </div>
  );
}

/** A write bumps a counter so the control shows what it just wrote even
 *  before the panel re-renders on the engine event. */
export function useElementRead<T>({ composer, element }: TypeBlockBodyProps, read: (el: Element) => T, fallback: T) {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  const el = composer?.elements.getElement(element.id);
  return [el ? read(el) : fallback, bump] as const;
}

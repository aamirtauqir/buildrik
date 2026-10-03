/**
 * CheckRow — the Inspector's one boolean row (boards 5, 6, 9, 10, 12–15, 19):
 * the box first, the property's name beside it (X-8). The label is the box's
 * accessible name and never shows the state (P-11b).
 *
 * Field-context aware like the other shared controls: read-only keeps the
 * value legible and refuses the change (DD-18); with a `property`, a
 * multi-selection that disagrees reads as mixed and an override draws its dot.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Checkbox } from "@/editor/chrome-ui";
import { rowTestId } from "./ControlRow";
import { FieldDot } from "./FieldDot";
import { useInspectorField } from "./InspectorFieldContext";

export interface CheckRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The CSS property the box edits, when it edits one. */
  property?: string;
  /** Replaces the row's derived `inspector-row-<label>` anchor. */
  testId?: string;
}

export function CheckRow({ label, checked, onChange, property, testId }: CheckRowProps) {
  const field = useInspectorField(property);
  const id = React.useId();
  const boxRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (boxRef.current) boxRef.current.indeterminate = field.mixed;
  }, [field.mixed]);
  return (
    <div className="tw:flex tw:min-h-6 tw:items-center tw:gap-2 tw:px-1 tw:py-1" data-testid={testId ?? rowTestId(label)}>
      <Checkbox
        ref={boxRef}
        id={id}
        color="blue"
        checked={checked}
        aria-checked={field.mixed ? "mixed" : undefined}
        aria-readonly={field.readOnly || undefined}
        onChange={(e) => {
          const next = e.target.checked;
          if (!field.readOnly) field.discrete(() => onChange(next));
        }}
        className="tw:size-4 tw:shrink-0 tw:bg-[var(--bk-bg-panel)]"
      />
      <label
        htmlFor={id}
        className={`${field.readOnly ? "tw:cursor-default" : "tw:cursor-pointer"} tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]`}
      >
        {label}
      </label>
      <FieldDot field={field} />
    </div>
  );
}

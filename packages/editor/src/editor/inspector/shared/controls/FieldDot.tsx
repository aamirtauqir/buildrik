/**
 * FieldDot — a field's override dot, drawn from the field context: one
 * OverrideDot per kind that overrides the property here (R-DD-14). Nothing
 * when nothing does. Lives beside the controls that draw it.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { OverrideDot } from "./OverrideDot";
import type { InspectorField } from "./InspectorFieldContext";

export function FieldDot({ field }: { field: InspectorField }) {
  if (field.overrides.length === 0) return null;
  return (
    <>
      {field.overrides.map((kind) => (
        <OverrideDot
          key={kind}
          kind={kind}
          label={field.overrideLabels[kind] ?? ""}
          onReset={field.readOnly ? undefined : () => field.resetOverride(kind)}
        />
      ))}
    </>
  );
}

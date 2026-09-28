/**
 * InspectorFieldContext — what every field in the Inspector body needs to
 * know about the panel it sits in (R-DD-14, DD-18, DD-12):
 *   - read-only, and why (locked element, or a pending save conflict);
 *   - which properties show "Mixed" across a multi-selection;
 *   - which properties are overridden, by what (breakpoint, :state, master),
 *     and how to reset one.
 *
 * `ProInspector` provides it once; the shared controls read it through
 * `useInspectorField(property)` so read-only, "Mixed" and the override dot are
 * drawn by the controls — never re-implemented per section. A section only
 * adds `property="padding-top"` to the rows it owns.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export type OverrideKind = "breakpoint" | "pseudo" | "master";

export interface InspectorFieldContextValue {
  readOnly: boolean;
  readOnlyReason: "locked" | "conflict" | null;
  mixedKeys: ReadonlySet<string>;
  overrides: ReadonlyMap<string, readonly OverrideKind[]>;
  /** "Tablet", ":hover" — what an override dot names. */
  overrideLabels: Readonly<Partial<Record<OverrideKind, string>>>;
  resetOverride: (property: string, kind: OverrideKind) => void;
}

const EMPTY: InspectorFieldContextValue = {
  readOnly: false,
  readOnlyReason: null,
  mixedKeys: new Set(),
  overrides: new Map(),
  overrideLabels: {},
  resetOverride: () => undefined,
};

export const InspectorFieldContext = React.createContext<InspectorFieldContextValue>(EMPTY);

export interface InspectorField {
  readOnly: boolean;
  readOnlyReason: InspectorFieldContextValue["readOnlyReason"];
  /** The selection disagrees about this property. */
  mixed: boolean;
  /** What overrides this property here (empty when nothing does). */
  overrides: readonly OverrideKind[];
  overrideLabels: InspectorFieldContextValue["overrideLabels"];
  resetOverride: (kind: OverrideKind) => void;
}

const NONE: readonly OverrideKind[] = [];

export function useInspectorField(property?: string): InspectorField {
  const ctx = React.useContext(InspectorFieldContext);
  return {
    readOnly: ctx.readOnly,
    readOnlyReason: ctx.readOnlyReason,
    mixed: property ? ctx.mixedKeys.has(property) : false,
    overrides: property ? ctx.overrides.get(property) ?? NONE : NONE,
    overrideLabels: ctx.overrideLabels,
    resetOverride: (kind) => {
      if (property) ctx.resetOverride(property, kind);
    },
  };
}

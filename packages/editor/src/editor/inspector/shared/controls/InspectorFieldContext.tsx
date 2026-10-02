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
  /** Run a discrete action (segment, select choice, toggle, Reset) as its own
   *  undo step — `useStyleHandlers.runDiscrete`. Absent: just run it. */
  runDiscrete?: (action: () => void) => void;
}

const EMPTY: InspectorFieldContextValue = {
  readOnly: false,
  readOnlyReason: null,
  mixedKeys: new Set(),
  overrides: new Map(),
  overrideLabels: {},
  resetOverride: () => undefined,
};

const runNow = (action: () => void) => action();

export const InspectorFieldContext = React.createContext<InspectorFieldContextValue>(EMPTY);

export interface InspectorField {
  readOnly: boolean;
  readOnlyReason: InspectorFieldContextValue["readOnlyReason"];
  /** The selection disagrees about this property — and the user has not
   *  started typing in this field (see `startTyping`). */
  mixed: boolean;
  /** Call on every keystroke: from the first one until `stopTyping` (blur) the
   *  field shows what is typed instead of "Mixed". A write lands on the whole
   *  selection, but the selection is only re-read when the debounced engine
   *  write commits (300 ms) — until then the field stayed pinned to "" and each
   *  keystroke replaced the last: "36" typed into Font size wrote 6px on all
   *  three headings. */
  startTyping: () => void;
  stopTyping: () => void;
  /** What overrides this property here (empty when nothing does). */
  overrides: readonly OverrideKind[];
  overrideLabels: InspectorFieldContextValue["overrideLabels"];
  resetOverride: (kind: OverrideKind) => void;
  /** A click-once control (segment, select, checkbox) wraps its write in this,
   *  so it is its own undo step rather than merged with the edit before or
   *  after it. Typing does not: keystrokes are meant to coalesce. */
  discrete: (action: () => void) => void;
}

const NONE: readonly OverrideKind[] = [];

/** The accessible name of a field the selection disagrees about (board 22). */
export const mixedName = (label: string): string => `${label}, Mixed values`;

export function useInspectorField(property?: string): InspectorField {
  const ctx = React.useContext(InspectorFieldContext);
  const [typing, setTyping] = React.useState(false);
  return {
    readOnly: ctx.readOnly,
    readOnlyReason: ctx.readOnlyReason,
    mixed: property ? ctx.mixedKeys.has(property) && !typing : false,
    startTyping: () => setTyping(true),
    stopTyping: () => setTyping(false),
    overrides: property ? ctx.overrides.get(property) ?? NONE : NONE,
    overrideLabels: ctx.overrideLabels,
    resetOverride: (kind) => {
      if (property) ctx.resetOverride(property, kind);
    },
    discrete: ctx.runDiscrete ?? runNow,
  };
}

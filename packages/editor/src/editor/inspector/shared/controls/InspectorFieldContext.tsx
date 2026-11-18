/**
 * InspectorFieldContext — what every field in the Inspector body needs to
 * know about the panel it sits in (R-DD-14, DD-18, DD-12):
 *   - read-only, and why (locked element, a pending save conflict, or an
 *     engine edit lock);
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

/** One property a layer overrides: its value there, and what removing it
 *  reveals underneath (2L9 S13 / S15, IC05). */
export interface OverrideEntry {
  property: string;
  value: string;
  fallback: string;
}

export interface InspectorFieldContextValue {
  readOnly: boolean;
  /** `not-loaded` / `view`: an engine edit lock (Task 1.6) — the site has not
   *  loaded, or it is being viewed (view mode, time travel). */
  readOnlyReason: "locked" | "conflict" | "not-loaded" | "view" | null;
  mixedKeys: ReadonlySet<string>;
  overrides: ReadonlyMap<string, readonly OverrideKind[]>;
  /** "Tablet", ":hover" — what an override dot names. */
  overrideLabels: Readonly<Partial<Record<OverrideKind, string>>>;
  resetOverride: (property: string, kind: OverrideKind) => void;
  /** The current breakpoint layer's own properties with their Desktop
   *  fallback — a section lists its share (2L9 IC05). Absent on Desktop. */
  breakpointEntries?: readonly OverrideEntry[];
  /** Run a discrete action (segment, select choice, toggle, Reset) as its own
   *  undo step — `useStyleHandlers.runDiscrete`. Absent: just run it. */
  runDiscrete?: (action: () => void) => void;
  /** Say what a write just did, with an Undo bound to that step (2L9 I07:
   *  "Converted using root font 16px · Undo"). Absent: say nothing. */
  announce?: (message: string) => void;
  /** Who and where a write lands — "Hero intro" / "Desktop · Default state"
   *  (2L9 39:9114's "Color for …" head). Absent: not said. */
  target?: { name: string; editing: string };
  /** A multi-selection's per-target shown value of a property, named as
   *  Layers names it (2L9 B05's source list). Absent / one target: []. */
  sourcesOf?: (property: string) => readonly InspectorSource[];
}

export interface InspectorSource {
  id: string;
  name: string;
  value: string;
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
  /** See `InspectorFieldContextValue.announce`. */
  announce: (message: string) => void;
  /** See `InspectorFieldContextValue.target`. */
  target?: { name: string; editing: string };
}

const NONE: readonly OverrideKind[] = [];

/** The accessible name of a field the selection disagrees about (board 22). */
export const mixedName = (label: string): string => `${label}, Mixed values`;

const NO_SOURCES: readonly InspectorSource[] = [];

/** Each selected target's own shown value of `property` (B05). */
export function useInspectorSources(property: string): readonly InspectorSource[] {
  const ctx = React.useContext(InspectorFieldContext);
  return ctx.sourcesOf?.(property) ?? NO_SOURCES;
}

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
    announce: ctx.announce ?? (() => undefined),
    target: ctx.target,
  };
}

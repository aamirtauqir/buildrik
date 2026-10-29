/**
 * Which tab subview is open, for which element. A subview replaces part of
 * a tab's body:
 *   binding     — the Content tab's binding detail (Play F2.05: "‹ Back to
 *                 Content · {Property} binding"), the whole body;
 *   interaction — an open interaction (2L9 I15): Behavior shows only its
 *                 Interactions section;
 *   add-field   — a form's "Add field" list (2L9 156:3109): Content shows
 *                 only its Fields section;
 *   override-review — the review before removing a layer's overrides (S13,
 *                 S15): Style / Effects show nothing under it;
 *   reset-style — the review before Reset style (S20): the tab's whole body.
 * The section that opens it and the tab renderer that honours it are
 * different components, so the value lives here. Selecting another element
 * closes it (the renderer shows it only for the element it was opened on).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export type SubviewKind = "binding" | "interaction" | "add-field" | "override-review" | "reset-style";
export interface Subview {
  kind: SubviewKind;
  elementId: string;
}

let open: Subview | null = null;
const listeners = new Set<() => void>();

export function openSubview(next: Subview | null): void {
  if (open?.kind === next?.kind && open?.elementId === next?.elementId) return;
  open = next;
  listeners.forEach((l) => l());
}

/** Close `kind` if it is the one open (a section leaving its own subview). */
export function closeSubview(kind: SubviewKind): void {
  if (open?.kind === kind) openSubview(null);
}

/** The open subview, or null. */
export function useSubview(): Subview | null {
  return React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
  );
}

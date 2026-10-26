/**
 * Which element's binding detail is open (2L9 Play F2.05: "‹ Back to
 * Content · {Property} binding"). The subview replaces the Content tab's
 * body, so the property row and the Dynamic bindings summary open it and the
 * tab renderer reads it — three places, one value. Selecting another element
 * closes it (the renderer only shows it for the element it was opened on).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

let openFor: string | null = null;
const listeners = new Set<() => void>();

export function openBindingDetail(elementId: string | null): void {
  if (openFor === elementId) return;
  openFor = elementId;
  listeners.forEach((l) => l());
}

/** The element whose binding detail is open, or null. */
export function useBindingDetail(): string | null {
  return React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => openFor,
  );
}

/**
 * Command Operations
 * Reusable element mutation helpers used by default commands
 *
 * @module engine/commands/commandOperations
 * @license BSD-3-Clause
 */

import { snapToGrid } from "../../shared/utils/dragDrop";
import { EVENTS } from "../../shared/constants/events";
import { isValidBreakpoint } from "../../shared/constants/breakpoints";
import type { BreakpointId } from "../../shared/types/breakpoints";
import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";

/** Direction for z-index reordering */
export type ReorderDirection = "forward" | "backward" | "front" | "back";

/**
 * A-5: the part of a selection a destructive op (delete/cut) may remove.
 * Locking and instance membership are read straight from the element (the
 * single source of truth — see ElementSerialization.isLocked /
 * isComponentInstance), not from a panel's own tracking set.
 *
 * Takes the RAW selection (callers apply topMost() to what it keeps) and
 * never substitutes anything for what was selected. An element goes only if
 * it is not locked, not in a component instance, and removing it takes no
 * locked element with it — no locked descendant (its subtree goes with it),
 * and no locked ancestor that is itself in the selection (⌘A selected the
 * locked container, so its contents stay with it). A lock covers only the
 * element itself elsewhere in the editor, so a child picked on its own
 * inside a locked container can still be deleted. ⌘A still removes the
 * unlocked siblings of a locked image, while an explicit Delete on the
 * section around it removes nothing — the first A-5 fix swapped in that
 * section's other children and deleted them unasked (review I-1). `skipped`
 * says the selection shrank.
 * Lives here (not defaultCommands.ts, which imports FROM this module) so
 * delete/cut and nudgeSelected below share it without a circular import.
 */
export function dropLockedAndInstances(elements: Element[]): {
  kept: Element[];
  skipped: boolean;
  /** The LOCKED_ELEMENTS_SKIPPED payload: `{ reason: "instance" }` when every
   *  dropped element is a component part rather than locked (L2-016). */
  skippedPayload: { reason: "instance" } | undefined;
} {
  const selected = new Set(elements.map((el) => el.getId()));
  const isLockBound = (el: Element) => el.isLocked() || hasLockedDescendant(el) || hasSelectedLockedAncestor(el, selected);
  const kept = elements.filter((el) => !el.isComponentInstance() && !isLockBound(el));
  const dropped = elements.filter((el) => !kept.includes(el));
  const instanceOnly = dropped.length > 0 && !dropped.some(isLockBound);
  return { kept, skipped: dropped.length > 0, skippedPayload: instanceOnly ? { reason: "instance" } : undefined };
}

function hasLockedDescendant(el: Element): boolean {
  return el.getChildren().some((child) => child.isLocked() || hasLockedDescendant(child));
}

function hasSelectedLockedAncestor(el: Element, selected: Set<string>): boolean {
  for (let p = el.getParent(); p; p = p.getParent()) if (p.isLocked() && selected.has(p.getId())) return true;
  return false;
}

/**
 * Nudge the currently selected element by (deltaX, deltaY) pixels.
 * Applies position changes via inline styles.
 * Respects snap-to-grid setting when enabled.
 *
 * IMPORTANT 2: a locked element nudged anyway —
 * the delete/cut/toggleLock/drop-target guards from A-5 never reached the
 * keyboard-arrow path. Skips a locked (or instance-owned) selection and
 * emits the same LOCKED_ELEMENTS_SKIPPED event delete/cut emit, so the
 * shell's toast fires the same way.
 */
export function nudgeSelected(composer: Composer, deltaX: number, deltaY: number): void {
  const selected = composer.selection.getSelected();
  if (!selected) return;
  if (selected.isLocked?.() || selected.isComponentInstance?.()) {
    composer.emit(EVENTS.LOCKED_ELEMENTS_SKIPPED, undefined);
    return;
  }

  const elementId = selected.getId();
  const domElement = document.querySelector(`[data-buildrick-id="${elementId}"]`) as HTMLElement;
  if (!domElement) return;

  composer.beginTransaction("nudge");

  // Get current position or default to 0
  const style = window.getComputedStyle(domElement);
  const currentLeft = parseFloat(style.left) || 0;
  const currentTop = parseFloat(style.top) || 0;

  // For elements without position, set relative positioning
  if (style.position === "static") {
    selected.setStyle("position", "relative");
  }

  // Calculate new position
  let newLeft = currentLeft + deltaX;
  let newTop = currentTop + deltaY;

  // Apply snap-to-grid if enabled
  const state = composer.getState();
  if (state.snapToGrid && state.gridSize > 0) {
    const snapped = snapToGrid({ x: newLeft, y: newTop }, state.gridSize);
    newLeft = snapped.x;
    newTop = snapped.y;
  }

  // Apply new position
  selected.setStyle("left", `${newLeft}px`);
  selected.setStyle("top", `${newTop}px`);

  composer.endTransaction();
  composer.emit(EVENTS.ELEMENT_NUDGED, { elementId, deltaX, deltaY });
}

/**
 * Reorder the currently selected element within its parent.
 * @param direction - 'forward' | 'backward' | 'front' | 'back'
 */
export function reorderElement(composer: Composer, direction: ReorderDirection): void {
  const selected = composer.selection.getSelected();
  if (!selected) return;

  const parent = selected.getParent();
  if (!parent) return;

  const siblings = parent.getChildren();
  const currentIndex = siblings.findIndex((s) => s.getId() === selected.getId());
  if (currentIndex === -1) return;

  composer.beginTransaction("reorder");

  /* `x.insertAfter(y)` puts Y after X — the DOM's direction, and what
     Element.ops.test locks. These four read the other way round for a while,
     so Bring Forward moved the NEXT sibling and Bring to Front moved the last
     one; only Send Backward looked right, because swapping two adjacent
     siblings gives the same answer whichever one you move. */
  switch (direction) {
    case "forward":
      // One position later (the next sibling ends up in front of it)
      if (currentIndex < siblings.length - 1) {
        siblings[currentIndex + 1].insertAfter(selected);
      }
      break;

    case "backward":
      // One position earlier
      if (currentIndex > 0) {
        siblings[currentIndex - 1].insertBefore(selected);
      }
      break;

    case "front":
      // Last child = painted on top
      if (currentIndex < siblings.length - 1) {
        siblings[siblings.length - 1].insertAfter(selected);
      }
      break;

    case "back":
      // First child = painted behind
      if (currentIndex > 0) {
        siblings[0].insertBefore(selected);
      }
      break;
  }

  composer.endTransaction();
  composer.emit(EVENTS.ELEMENT_REORDERED, {
    elementId: selected.getId(),
    direction,
  });
}

/**
 * P-1: the lock gate every Inspector write passes through (and pasteStyles).
 *
 * Returns the elements a write may change — locked ones dropped, missing ones
 * ignored. A lock covers the element itself, as everywhere else in the
 * editor; the stricter removal rule (locked descendants, instances) is
 * dropLockedAndInstances above.
 *
 * SIDE EFFECT — not a pure filter: when it drops a locked element it emits
 * LOCKED_ELEMENTS_SKIPPED (once per call), the same signal delete/cut/nudge
 * raise, and the shell shows the "locked" toast (useClipboardToasts). Call it
 * only where a write is actually being attempted; to merely ASK whether an
 * element is locked, read `isLocked()`.
 */
export function writableElements<T extends Element>(
  composer: Composer,
  elements: ReadonlyArray<T | null | undefined>,
): T[] {
  const present = elements.filter((el): el is T => Boolean(el));
  /* `?.`: several suites hand the panel partial element doubles. */
  const kept = present.filter((el) => !el.isLocked?.());
  if (kept.length !== present.length) composer.emit(EVENTS.LOCKED_ELEMENTS_SKIPPED, undefined);
  return kept;
}

/**
 * P-1: may a write change element `elementId` right now? Resolves the id and
 * runs it through writableElements, so a LOCKED element also signals the skip
 * (LOCKED_ELEMENTS_SKIPPED → the "locked" toast) — call it at the moment a
 * write is attempted, not to decide what to render. A missing element is
 * `false`, silently.
 */
export function canWrite(composer: Composer, elementId: string): boolean {
  return writableElements(composer, [composer.elements.getElement(elementId)]).length > 0;
}

/**
 * P-1: run one Inspector write on `element` as one undo step — or refuse it
 * when the element is locked (writableElements says so). Returns whether the
 * write ran, so a caller can keep its local view in step.
 */
export function writeElement<T extends Element>(
  composer: Composer,
  element: T | null | undefined,
  label: string,
  write: (element: T) => void,
): boolean {
  const [el] = writableElements(composer, [element]);
  if (!el) return false;
  composer.beginTransaction?.(label);
  try {
    write(el);
  } finally {
    composer.endTransaction?.();
  }
  return true;
}

/**
 * The breakpoint an edit made on the canvas belongs to: the composer's device
 * (the shell keeps it in step with the device switcher). "wide" has no
 * override layer of its own, so it edits the base — as the Inspector does
 * (ProInspector maps an unknown device to desktop).
 */
export function activeBreakpoint(composer: Pick<Composer, "device">): BreakpointId {
  const device = composer.device;
  return device && isValidBreakpoint(device) ? device : "desktop";
}

/**
 * The element's styles as they apply at `breakpoint`: the base, with that
 * breakpoint's override on top. The read side of setStyleAt.
 */
export function stylesAt(
  composer: Pick<Composer, "styles"> | null | undefined,
  el: Element,
  breakpoint: BreakpointId,
): Record<string, string> {
  const base = { ...(el.getStyles?.() || {}) };
  if (breakpoint === "desktop" || !composer?.styles) return base;
  return { ...base, ...composer.styles.getBreakpointStyle(el.getId(), breakpoint) };
}

/**
 * Set (or, with "", remove) one style property at `breakpoint` — the element's
 * base styles on desktop, its override rule on tablet/mobile. The one branch
 * the Inspector and the canvas-direct writes share. No lock check and no
 * transaction: callers run it inside writeElement / writableElements.
 */
export function setStyleAt(
  composer: Pick<Composer, "styles"> | null | undefined,
  el: Element,
  breakpoint: BreakpointId,
  property: string,
  value: string,
): void {
  if (breakpoint === "desktop") {
    if (value === "") el.removeStyle?.(property);
    else el.setStyle?.(property, value);
  } else if (value === "") {
    composer?.styles?.removeBreakpointStyleProperty(el.getId(), breakpoint, property);
  } else {
    composer?.styles?.setBreakpointStyle(el.getId(), breakpoint, { [property]: value });
  }
}

/**
 * A style write made directly on the canvas (resize handles, keyboard resize,
 * spacing spots, keyboard nudge): refused when the element is locked (the
 * "locked" toast), written at the active breakpoint, one undo step. These
 * paths used to call `element.setStyle` — base styles at every device, no lock
 * check (audit 2026-10-08 P1-2/P1-3). Returns whether the write ran.
 */
export function writeCanvasStyles(
  composer: Composer,
  element: Element | null | undefined,
  label: string,
  styles: Record<string, string>,
): boolean {
  const breakpoint = activeBreakpoint(composer);
  return writeElement(composer, element, label, (el) => {
    for (const [property, value] of Object.entries(styles)) setStyleAt(composer, el, breakpoint, property, value);
  });
}

/**
 * P-10: paste `composer.styleClipboard` onto an element — the ONE paste-style
 * implementation for the Inspector ⋯, the canvas Style › Paste and ⌥⌘V.
 *
 * Merges key by key: a property the copied element did not carry stays on the
 * target. The ⋯ and canvas menu used `setStyles`, which replaced the whole
 * style map and wiped those properties, while ⌥⌘V merged — three doors, two
 * results. One transaction, so one undo takes the paste back. A locked
 * element is refused (P-1).
 *
 * Returns how many properties were applied (0 when nothing was).
 */
export function pasteStyles(composer: Composer, element: Element): number {
  const clipboard = composer.styleClipboard;
  const keys = clipboard ? Object.keys(clipboard) : [];
  if (!clipboard || keys.length === 0) return 0;
  const ran = writeElement(composer, element, "paste-styles", (el) => {
    for (const key of keys) el.setStyle(key, clipboard[key]);
  });
  return ran ? keys.length : 0;
}

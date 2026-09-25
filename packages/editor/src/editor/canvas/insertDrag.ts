/**
 * The Add-drawer drag in flight — board 4418:100890 (owner: the visual state
 * of the existing drag, not a separate mode). The drawer says what is being
 * dragged; the canvas says where it would land; the canvas cue, the footer
 * readout and the drawer's note all read both through `useInsertDrag`.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { elementTypeLabel, LAYER_NAME_KEY } from "@/shared/constants/elementTypeLabels";
import { elementLocation } from "./utils/elementInfo";

export interface InsertDragTarget {
  /** "Home › Hero › Content" — the container that receives the drop. */
  path: string;
  /** The container's own name ("Content"). */
  into: string;
  /** The sibling it lands after ("Subtitle"), or null when it goes first. */
  after: string | null;
}

interface NamedElement {
  getId(): string;
  getType(): string;
  getParent(): NamedElement | null;
  getChildren(): NamedElement[];
  getCustomData?(key: string): unknown;
}

const nameOf = (el: NamedElement): string => {
  const layer = el.getCustomData?.(LAYER_NAME_KEY);
  return typeof layer === "string" && layer ? layer : elementTypeLabel(el.getType());
};

/** Where a drop on `targetId` at `position` lands, in the board's words. */
export function describeInsertTarget(
  composer: Composer,
  targetId: string,
  position: "before" | "after" | "inside",
): InsertDragTarget | null {
  const target = composer.elements.getElement(targetId) as NamedElement | undefined;
  if (!target) return null;
  const container = position === "inside" ? target : target.getParent();
  if (!container) return null;
  const kids = container.getChildren();
  const prev =
    position === "inside" ? kids.at(-1) : position === "after" ? target : kids[kids.findIndex((k) => k.getId() === targetId) - 1];
  return {
    path: elementLocation(composer, container.getId(), true),
    into: nameOf(container),
    after: prev ? nameOf(prev) : null,
  };
}

export function announceInsertDrag(composer: Composer, label: string | null): void {
  composer.emit(EVENTS.UI_INSERT_DRAG, { label });
}

export function announceInsertTarget(composer: Composer, target: InsertDragTarget | null): void {
  composer.emit(EVENTS.UI_INSERT_DRAG_TARGET, target);
}

/** The drag in flight: its label while an Add row is held, and its landing. */
export function useInsertDrag(composer: Composer | null | undefined): {
  label: string | null;
  target: InsertDragTarget | null;
} {
  const [label, setLabel] = React.useState<string | null>(null);
  const [target, setTarget] = React.useState<InsertDragTarget | null>(null);
  React.useEffect(() => {
    if (!composer) return;
    const onDrag = (p: { label: string | null }) => {
      setLabel(p?.label ?? null);
      if (!p?.label) setTarget(null);
    };
    const onTarget = (t: InsertDragTarget | null) => setTarget(t ?? null);
    composer.on(EVENTS.UI_INSERT_DRAG, onDrag);
    composer.on(EVENTS.UI_INSERT_DRAG_TARGET, onTarget);
    return () => {
      composer.off(EVENTS.UI_INSERT_DRAG, onDrag);
      composer.off(EVENTS.UI_INSERT_DRAG_TARGET, onTarget);
    };
  }, [composer]);
  return { label, target: label ? target : null };
}

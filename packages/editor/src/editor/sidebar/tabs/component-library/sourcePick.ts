/**
 * sourcePick — "Update {component} from a selection" (2L9 B6-K12 → K15).
 *
 *   choose  (K12)  the Components area explains it: Choose on canvas · Cancel
 *   picking (K13)  the panel closes, a bar over the canvas asks for a section
 *   picking + source (K14)  the bar names the chosen section; Return to review
 *   review  (K15)  Components shows the source beside the master, the counts,
 *                  and Update · Choose another · Cancel
 *
 * One session per composer, held here so the panel (which unmounts while the
 * canvas has the room) and the canvas bar read the same state. Every move
 * emits UI_COMPONENT_SOURCE_PICK; `useSourcePick` re-reads on it.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { ELEMENT_TYPE_LABELS } from "@/shared/constants/elementTypeLabels";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import type { ToastInput } from "@/editor/chrome-ui";
import type { ComponentDefinition } from "@/shared/types/components";
import { captureComponentThumbnail } from "./captureComponentThumbnail";

export type SourcePickPhase = "choose" | "picking" | "review";

export interface SourcePick {
  componentId: string;
  phase: SourcePickPhase;
  /** The element chosen on the canvas; null until one is. */
  sourceId: string | null;
}

const sessions = new WeakMap<Composer, SourcePick>();

function put(composer: Composer, next: SourcePick | null): void {
  if (next) sessions.set(composer, next);
  else sessions.delete(composer);
  composer.emit(EVENTS.UI_COMPONENT_SOURCE_PICK, next);
}

export function getSourcePick(composer: Composer | null): SourcePick | null {
  return (composer && sessions.get(composer)) ?? null;
}

/** K12: "Update from selection…" on a master's summary. */
export function beginUpdateFromSelection(composer: Composer, componentId: string): void {
  put(composer, { componentId, phase: "choose", sourceId: null });
}

/** K12 → K13 ("Choose on canvas", or K15's "Choose another"). */
export function chooseOnCanvas(composer: Composer): void {
  const pick = sessions.get(composer);
  if (!pick) return;
  put(composer, { ...pick, phase: "picking", sourceId: null });
  composer.emit(EVENTS.UI_LEFT_PANEL_CLOSE);
}

/** K14: the canvas selection became the source (or stopped being one). */
export function setPickedSource(composer: Composer, sourceId: string | null): void {
  const pick = sessions.get(composer);
  if (!pick || pick.phase !== "picking" || pick.sourceId === sourceId) return;
  put(composer, { ...pick, sourceId });
}

/** K14 → K15: back to Components with the source. */
export function returnToReview(composer: Composer): void {
  const pick = sessions.get(composer);
  if (!pick?.sourceId) return;
  put(composer, { ...pick, phase: "review" });
  composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "components" });
}

/** Cancel from any step: the session ends; from the canvas, Components comes back. */
export function cancelUpdateFromSelection(composer: Composer): void {
  const pick = sessions.get(composer);
  if (!pick) return;
  put(composer, null);
  if (pick.phase === "picking") composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "components" });
}

/** The session, kept current. */
export function useSourcePick(composer: Composer | null): SourcePick | null {
  const [pick, setPick] = React.useState(() => getSourcePick(composer));
  React.useEffect(() => {
    if (!composer) return;
    const sync = () => setPick(getSourcePick(composer));
    sync();
    composer.on(EVENTS.UI_COMPONENT_SOURCE_PICK, sync);
    return () => {
      composer.off(EVENTS.UI_COMPONENT_SOURCE_PICK, sync);
    };
  }, [composer]);
  return pick;
}

type El = NonNullable<ReturnType<Composer["elements"]["getElement"]>>;

/** K13: "Locked and nested component content can't be chosen." A page root,
 *  a locked element or one under a lock, and anything inside an instance
 *  (the instance itself may be chosen — its edits become the master) are not
 *  sources. */
export function isPickableSource(composer: Composer, elementId: string): boolean {
  const el = composer.elements.getElement(elementId);
  if (!el || !el.getParent()) return false;
  for (let at: El | null = el; at; at = at.getParent()) if (at.isLocked()) return false;
  const holder = composer.components?.findInstanceContainingElement?.(elementId);
  return !holder || holder.elementId === elementId;
}

/** "Section 3" / "Section 3 on Home" — a page's top-level section by its
 *  place, anything deeper by its layer name. */
export function sourceLabel(composer: Composer, elementId: string): { name: string; page: string | null; full: string } {
  const el = composer.elements.getElement(elementId);
  if (!el) return { name: "the selection", page: null, full: "the selection" };
  let top: El = el;
  while (top.getParent()?.getParent()) top = top.getParent()!;
  const root = top.getParent();
  const page = (composer.elements.getAllPages?.() ?? []).find((p) => p.root?.id === root?.getId());
  const name =
    el === top
      ? getLayerName(el) || `Section ${(root?.getChildren?.() ?? []).findIndex((c) => c.getId() === el.getId()) + 1}`
      : getLayerName(el) || ELEMENT_TYPE_LABELS[el.getType()] || "Element";
  return { name, page: page?.name ?? null, full: page ? `${name} on ${page.name}` : name };
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * K15's Update: promote the chosen source to the master and fan it out, then
 * end the session. The receipt (2L9 217:41149, B6-K16) names the source and
 * its page — "Hero card updated from Section 3 on Home · 12 instances" — and
 * its Undo restores the master (⌘Z reverts pages, not definitions). Lost
 * overrides are said, never dropped in silence.
 */
export async function commitUpdateFromSelection(
  composer: Composer,
  component: ComponentDefinition,
  sourceId: string,
): Promise<ToastInput> {
  const before = composer.components.snapshotComponent(component.id);
  const { full } = sourceLabel(composer, sourceId);
  /* P-4: a throw is a failed update, said like one — not an unhandled rejection. */
  const { updated, instancesSynced, overridesDropped } = await composer.components
    .updateComponentMaster(component.id, sourceId)
    .catch(() => ({ updated: false, instancesSynced: 0, overridesDropped: 0 }));
  if (!updated) return { description: `Couldn't update "${component.name}" from that selection.`, tone: "error", duration: 4000 };

  put(composer, null);
  void captureComponentThumbnail(composer, component.id, sourceId);
  const from = `${component.name} updated from ${full}`;
  const headline = instancesSynced > 0 ? `${from} · ${count(instancesSynced, "instance", "instances")}` : from;
  const action = before
    ? { label: "Undo", onClick: () => void composer.components.revertComponentMaster(component.id, before.component.masterTree) }
    : undefined;
  if (overridesDropped > 0) {
    return {
      description: `${headline}. ${count(overridesDropped, "override", "overrides")} couldn't be re-applied and ${overridesDropped === 1 ? "was" : "were"} lost.`,
      tone: "warning",
      duration: 8000,
      ...(action && { action }),
    };
  }
  return { description: headline, ...(action && { action }) };
}

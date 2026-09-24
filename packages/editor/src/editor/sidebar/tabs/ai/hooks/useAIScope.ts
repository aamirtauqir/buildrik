/**
 * useAIScope — what the AI panel's run may touch, following the selection.
 *
 * The selection manager announces changes in steps: `select()` emits
 * selected(new) and THEN deselected(old); `selectMultiple()` emits
 * multiple(all) and THEN selected(first). Reacting to each event let the
 * last one win — "Whole page" after picking a second element, the first
 * element after a multi-select (L2-V3, boards 6881:65478 / 69981). The hook
 * now reads the selection once it has settled (a microtask after the last
 * event of a burst).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import type { AIScope, AIScopeStatus } from "../types";
import { EVENTS } from "@/shared/constants/events";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { ELEMENT_TYPE_LABELS } from "@/shared/constants/elementTypeLabels";

interface UseAIScopeResult {
  scope: AIScope;
  status: AIScopeStatus;
  lock: () => void;
  unlock: () => void;
}

/** The kind of thing the boards append to the name: "Hero section",
 *  "Heading text", "Menu preview image", "Flex container". */
const NOUN: Record<string, string> = {
  section: "section",
  hero: "section",
  container: "container",
  flex: "container",
  grid: "container",
  columns: "container",
  "collection-list": "list",
  heading: "text",
  paragraph: "text",
  text: "text",
  image: "image",
  video: "video",
  button: "button",
  link: "link",
  input: "input",
  textarea: "input",
  select: "input",
  form: "form",
};

/** "Hero section" — the layer's name (else aria-label, else the type label)
 *  and the kind, unless the name already is the kind ("Image"). */
export function scopeLabel(el: Element): string {
  const type = el.getType();
  const name =
    (typeof el.getCustomData === "function" ? getLayerName(el) : undefined) ??
    el.getAttribute?.("aria-label") ??
    ELEMENT_TYPE_LABELS[type] ??
    type.charAt(0).toUpperCase() + type.slice(1);
  const noun = NOUN[type];
  return noun && name.toLowerCase() !== noun ? `${name} ${noun}` : name;
}

function scopeOf(selected: readonly Element[]): AIScope {
  if (selected.length > 1) return { kind: "multi", count: selected.length };
  if (selected.length === 1) return { kind: "element", id: selected[0].getId(), label: scopeLabel(selected[0]) };
  return { kind: "page" };
}

const SELECTION_EVENTS = [
  EVENTS.ELEMENT_SELECTED,
  EVENTS.ELEMENT_DESELECTED,
  EVENTS.SELECTION_MULTIPLE,
  EVENTS.SELECTION_ADDED,
  EVENTS.SELECTION_REMOVED,
  EVENTS.SELECTION_CLEARED,
] as const;

export function useAIScope(composer: Composer | null): UseAIScopeResult {
  const [scope, setScope] = React.useState<AIScope>(
    () => scopeOf(composer?.selection?.getAllSelected?.() ?? []),
  );
  const [status, setStatus] = React.useState<AIScopeStatus>("idle");
  const statusRef = React.useRef<AIScopeStatus>("idle");
  statusRef.current = status;

  React.useEffect(() => {
    if (!composer) return;
    let queued = false;
    let live = true;
    const sync = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        if (!live || statusRef.current === "locked") return;
        setScope(scopeOf(composer.selection?.getAllSelected?.() ?? []));
      });
    };
    for (const evt of SELECTION_EVENTS) composer.on(evt, sync);
    if (statusRef.current !== "locked") setScope(scopeOf(composer.selection?.getAllSelected?.() ?? []));
    return () => {
      live = false;
      for (const evt of SELECTION_EVENTS) composer.off(evt, sync);
    };
  }, [composer]);

  const lock = React.useCallback(() => setStatus("locked"), []);
  const unlock = React.useCallback(() => setStatus("idle"), []);

  return { scope, status, lock, unlock };
}

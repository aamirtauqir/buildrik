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
 * The selection gives the default; `choose()` widens it (boards 6891:73760
 * "All sections like this (4)", 6891:73974 "Whole site (3 pages)"), and a
 * new selection drops the choice again.
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
  /** The scopes the band offers for the current selection, widest last. */
  options: () => AIScope[];
  choose: (scope: AIScope) => void;
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

const typeLabel = (type: string): string =>
  ELEMENT_TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);

/** The element's own name — its layer name, else its aria-label. */
function ownName(el: Element): string | undefined {
  return (typeof el.getCustomData === "function" ? getLayerName(el) : undefined) ?? el.getAttribute?.("aria-label") ?? undefined;
}

/** "Hero section" — the layer's name (else aria-label, else the type label)
 *  and the kind, unless the name already is the kind ("Image"). */
export function scopeLabel(el: Element): string {
  const type = el.getType();
  const name = ownName(el) ?? typeLabel(type);
  const noun = NOUN[type];
  return noun && name.toLowerCase() !== noun ? `${name} ${noun}` : name;
}

/** What the run's copy calls one element: "Hero", or "the selected heading".
 *  A section block's type label is already a name ("Hero", 4418:105401). */
function runName(el: Element): string {
  const type = el.getType();
  const own = ownName(el);
  if (own) return own;
  if (NOUN[type] === "section" && type !== "section") return typeLabel(type);
  return `the selected ${typeLabel(type).toLowerCase()}`;
}

function scopeOf(selected: readonly Element[]): AIScope {
  if (selected.length > 1) return { kind: "multi", ids: selected.map((e) => e.getId()) };
  if (selected.length === 1) {
    const el = selected[0];
    return { kind: "element", id: el.getId(), label: scopeLabel(el), name: runName(el) };
  }
  return { kind: "page" };
}

/** Every element on the active page, root first. */
export function activePageElements(composer: Composer): Element[] {
  const rootId = composer.elements.getActivePage?.()?.root?.id;
  const root = rootId ? composer.elements.getElement(rootId) : undefined;
  if (!root) return [];
  const out: Element[] = [];
  const walk = (e: Element) => {
    out.push(e);
    for (const c of e.getChildren?.() ?? []) walk(c);
  };
  walk(root);
  return out;
}

/** The scopes the band offers: the selection, the elements like it on this
 *  page (only when there is more than one), the page, and every page (only
 *  when there is more than one). */
function scopeOptions(composer: Composer, base: AIScope): AIScope[] {
  const out: AIScope[] = [];
  if (base.kind === "element" || base.kind === "multi") out.push(base);
  if (base.kind === "element") {
    const type = composer.elements.getElement(base.id)?.getType();
    const ids = type ? activePageElements(composer).filter((e) => e.getType() === type).map((e) => e.getId()) : [];
    if (type && ids.length > 1) out.push({ kind: "similar", ids, noun: NOUN[type] === "section" ? "sections" : `${typeLabel(type).toLowerCase()}s` });
  }
  out.push({ kind: "page" });
  const pages = composer.elements.getAllPages?.().length ?? 1;
  if (pages > 1) out.push({ kind: "site", pages });
  return out;
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
  /* A widened scope the user picked from the band; a new selection drops it. */
  const [chosen, setChosen] = React.useState<AIScope | null>(null);
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
        setChosen(null);
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
  const options = React.useCallback(() => (composer ? scopeOptions(composer, scope) : [scope]), [composer, scope]);
  const choose = React.useCallback((next: AIScope) => {
    if (statusRef.current === "locked") return;
    setChosen(next.kind === scope.kind ? null : next);
  }, [scope.kind]);

  return { scope: chosen ?? scope, status, lock, unlock, options, choose };
}

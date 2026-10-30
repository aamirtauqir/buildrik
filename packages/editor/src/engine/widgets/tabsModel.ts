/**
 * Tabs model — explicit tab↔panel pairs and the initial pair (design-2l9 C01
 * `245:36832`, B-21; docs/design-2l9/engine-tabs.md).
 *
 * The pair lives on the elements as `data-tab-key` (tab button and panel) and
 * the root's `data-tabs-initial`, so save, history, copy, duplicate, import
 * and export carry it unchanged. A block saved before the keys pairs by
 * position — read-only — until `ensureTabKeys` writes them. Every write here
 * is one history step (a composer transaction). The published behaviour is
 * `export/tabsRuntime.ts`.
 *
 * @license BSD-3-Clause
 */
import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";

export interface TabPair {
  key: string;
  tabId: string;
  panelId: string;
  label: string;
}

export interface TabsState {
  pairs: TabPair[];
  /** The key shown first. */
  initial: string | null;
  /** Saved before keys: paired by position until `ensureTabKeys`. */
  legacy: boolean;
}

function parts(composer: Composer, rootId: string): { root: Element; list: Element; tabs: Element[]; panels: Element[] } | null {
  const root = composer.elements.getElement(rootId);
  if (!root) return null;
  const list = root.getChildren().find((c) => c.getAttribute("role") === "tablist");
  if (!list) return null;
  const tabs = list.getChildren().filter((c) => c.getAttribute("role") === "tab");
  const panels = root.getChildren().filter((c) => c.getAttribute("role") === "tabpanel");
  return { root, list, tabs, panels };
}

function labelOf(el: Element): string {
  const own = el.getContent().replace(/<[^>]*>/g, "").trim();
  if (own) return own;
  for (const c of el.getChildren()) {
    const t = labelOf(c);
    if (t) return t;
  }
  return "";
}

function wrap<T>(composer: Composer, label: string, fn: () => T): T {
  composer.beginTransaction(label);
  try {
    const out = fn();
    composer.endTransaction();
    return out;
  } catch (e) {
    composer.rollbackTransaction();
    throw e;
  }
}

export function readTabs(composer: Composer, rootId: string): TabsState | null {
  const p = parts(composer, rootId);
  if (!p) return null;
  const legacy = !p.tabs.every((t) => t.getAttribute("data-tab-key"));
  const pairs: TabPair[] = [];
  p.tabs.forEach((tab, i) => {
    const key = legacy ? `#${i + 1}` : tab.getAttribute("data-tab-key")!;
    const panel = legacy ? p.panels[i] : p.panels.find((x) => x.getAttribute("data-tab-key") === key);
    if (panel) pairs.push({ key, tabId: tab.getId(), panelId: panel.getId(), label: labelOf(tab) });
  });
  const saved = p.root.getAttribute("data-tabs-initial");
  const selected = p.tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
  const initial = !legacy && saved && pairs.some((x) => x.key === saved) ? saved : (pairs[Math.max(0, selected)]?.key ?? null);
  return { pairs, initial, legacy };
}

function nextKey(used: Set<string>): string {
  for (let n = 1; ; n++) {
    const key = `tab-${String(n).padStart(2, "0")}`;
    if (!used.has(key)) return key;
  }
}

/** Writes keys (by position) and the initial pair on a block saved before them. */
export function ensureTabKeys(composer: Composer, rootId: string): void {
  const state = readTabs(composer, rootId);
  const p = parts(composer, rootId);
  if (!state || !p || !state.legacy) return;
  wrap(composer, "Pair tabs and panels", () => {
    const used = new Set<string>();
    const initialIndex = Math.max(0, state.pairs.findIndex((x) => x.key === state.initial));
    state.pairs.forEach((pair, i) => {
      const key = nextKey(used);
      used.add(key);
      composer.elements.getElement(pair.tabId)?.setAttribute("data-tab-key", key);
      composer.elements.getElement(pair.panelId)?.setAttribute("data-tab-key", key);
      if (i === initialIndex) p.root.setAttribute("data-tabs-initial", key);
    });
  });
}

/** Runs `fn` as ONE step, after a legacy block got its keys (same step). */
function edit<T>(composer: Composer, rootId: string, label: string, fn: (state: TabsState, p: NonNullable<ReturnType<typeof parts>>) => T): T | null {
  if (!readTabs(composer, rootId)) return null;
  return wrap(composer, label, () => {
    ensureTabKeys(composer, rootId);
    const state = readTabs(composer, rootId);
    const p = parts(composer, rootId);
    return state && p ? fn(state, p) : null;
  });
}

const labelFor = (composer: Composer, rootId: string, key: string): string => {
  const s = readTabs(composer, rootId);
  const at = s ? (s.legacy ? Number(key.replace(/\D/g, "")) - 1 : s.pairs.findIndex((x) => x.key === key)) : -1;
  return s?.pairs[at]?.label || "tab";
};

/** Which pair opens first — the published page and the canvas follow it.
 *  `key` may be a legacy position key ("#2") before the block has keys. */
export function setInitialTab(composer: Composer, rootId: string, key: string): void {
  const index = positionOf(composer, rootId, key);
  edit(composer, rootId, `Open ${labelFor(composer, rootId, key)} first`, (state, p) => {
    const pair = state.pairs[index];
    if (!pair) return;
    p.root.setAttribute("data-tabs-initial", pair.key);
    for (const tab of p.tabs) tab.setAttribute("aria-selected", tab.getId() === pair.tabId ? "true" : "false");
  });
}

function positionOf(composer: Composer, rootId: string, key: string): number {
  const s = readTabs(composer, rootId);
  return s ? s.pairs.findIndex((x) => x.key === key) : -1;
}

/** A new pair at the end: a tab copied from the last one, a panel likewise. */
export function addTab(composer: Composer, rootId: string, label?: string): TabPair | null {
  return edit(composer, rootId, "Add tab", (state) => {
    const last = state.pairs[state.pairs.length - 1];
    if (!last) return null;
    const key = nextKey(new Set(state.pairs.map((x) => x.key)));
    const name = label ?? `Tab ${state.pairs.length + 1}`;
    const tab = composer.elements.duplicateElement(last.tabId);
    const panel = composer.elements.duplicateElement(last.panelId);
    if (!tab || !panel) throw new Error("Add tab: could not copy the last pair");
    tab.setAttribute("data-tab-key", key);
    tab.setAttribute("aria-selected", "false");
    panel.setAttribute("data-tab-key", key);
    let text: Element = tab;
    while (text.getChildren().length) text = text.getChildren()[0];
    text.setContent(name);
    return { key, tabId: tab.getId(), panelId: panel.getId(), label: name };
  });
}

/** Button and panel move together (C01 "Move Details before Overview"). */
export function moveTab(composer: Composer, rootId: string, key: string, toIndex: number): void {
  const index = positionOf(composer, rootId, key);
  edit(composer, rootId, `Move ${labelFor(composer, rootId, key)}`, (state, p) => {
    const pair = state.pairs[index];
    if (!pair) return;
    const other = state.pairs.filter((x) => x.key !== pair.key);
    const before = other[Math.max(0, Math.min(toIndex, other.length))];
    const listKids = p.list.getChildren().filter((c) => c.getId() !== pair.tabId);
    composer.elements.moveElement(pair.tabId, p.list.getId(), before ? listKids.findIndex((c) => c.getId() === before.tabId) : listKids.length);
    const rootKids = p.root.getChildren().filter((c) => c.getId() !== pair.panelId);
    composer.elements.moveElement(pair.panelId, p.root.getId(), before ? rootKids.findIndex((c) => c.getId() === before.panelId) : rootKids.length);
  });
}

/** Removes a pair (tab and its panel); the last pair is kept. */
export function removeTab(composer: Composer, rootId: string, key: string): boolean {
  const index = positionOf(composer, rootId, key);
  return (
    edit(composer, rootId, `Remove ${labelFor(composer, rootId, key)}`, (state, p) => {
      const pair = state.pairs[index];
      if (!pair || state.pairs.length < 2) return false;
      composer.elements.removeElement(pair.tabId);
      composer.elements.removeElement(pair.panelId);
      if (state.initial === pair.key) p.root.setAttribute("data-tabs-initial", state.pairs.find((x) => x.key !== pair.key)!.key);
      return true;
    }) ?? false
  );
}

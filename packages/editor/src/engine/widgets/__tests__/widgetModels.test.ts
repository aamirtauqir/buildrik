// @vitest-environment jsdom
/**
 * The Tabs pair model (B-21, C01) and the Modal link model (B-17, C07/C10/C18)
 * on a real Composer: what the blocks write, each edit one history step, a
 * block saved before the models still read, and the published HTML — the
 * export path, never a deploy — switching tabs and opening / closing the
 * dialog with the runtimes the publish worker injects.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { installEngineBrowserStubs, removeEngineBrowserStubs, createTestComposer } from "@/engine/__tests__/test-utils/realComposer";
import { tabsBlockConfig } from "@/blocks/Components/Tabs";
import { modalBlockConfig } from "@/blocks/Components/Modal";
import { ExportEngine } from "@/engine/export/ExportEngine";
import { initTabsRuntime } from "@/engine/export/tabsRuntime";
import { initModalRuntime } from "@/engine/export/modalRuntime";
import { addTab, ensureTabKeys, moveTab, readTabs, removeTab, setInitialTab } from "../tabsModel";
import { duplicateModal, ensureModalLink, linkModal, readModal, setDialogBehavior } from "../modalModel";
import type { Composer } from "@/engine/Composer";

beforeAll(() => installEngineBrowserStubs());
afterAll(() => removeEngineBrowserStubs());
afterEach(() => { document.body.innerHTML = ""; });

function setup(): { c: Composer; rootId: string; hero: string } {
  const c = createTestComposer();
  const page = c.elements.createPage("Home");
  c.elements.setActivePage(page.id);
  const hero = c.elements.createElement("section");
  c.elements.addElement(hero, page.root.id);
  c.history.flushPending();
  return { c, rootId: page.root.id, hero: hero.getId() };
}

function oneStep(c: Composer, fn: () => void): number {
  c.history.flushPending();
  const before = c.history.getUndoCount();
  fn();
  c.history.flushPending();
  return c.history.getUndoCount() - before;
}

async function publishedBody(c: Composer): Promise<void> {
  const { files } = await new ExportEngine(c).exportAllPages({ format: "html" });
  const html = files.find((f) => f.name === "index.html")!.content;
  document.body.innerHTML = html.slice(html.indexOf("<body"), html.lastIndexOf("</body>")).replace(/^<body[^>]*>/, "");
}

describe("Tabs model (B-21)", () => {
  it("the block writes keyed pairs and the initial pair", () => {
    const { c, hero } = setup();
    const id = tabsBlockConfig.build!(c as never, hero)!;
    const s = readTabs(c, id)!;
    expect(s.legacy).toBe(false);
    expect(s.pairs.map((p) => [p.key, p.label])).toEqual([["tab-01", "Tab 1"], ["tab-02", "Tab 2"], ["tab-03", "Tab 3"]]);
    expect(s.initial).toBe("tab-01");
  });

  it("initial, add, move (button and panel together), remove — each one step", () => {
    const { c, hero } = setup();
    const id = tabsBlockConfig.build!(c as never, hero)!;
    expect(oneStep(c, () => setInitialTab(c, id, "tab-02"))).toBe(1);
    expect(readTabs(c, id)!.initial).toBe("tab-02");
    expect(oneStep(c, () => addTab(c, id, "Pricing"))).toBe(1);
    expect(readTabs(c, id)!.pairs.map((p) => p.label)).toEqual(["Tab 1", "Tab 2", "Tab 3", "Pricing"]);
    expect(oneStep(c, () => moveTab(c, id, "tab-02", 0))).toBe(1);
    const s = readTabs(c, id)!;
    expect(s.pairs.map((p) => p.key)).toEqual(["tab-02", "tab-01", "tab-03", "tab-04"]);
    /* The panels moved with their buttons. */
    const panels = c.elements.getElement(id)!.getChildren().filter((e) => e.getAttribute("role") === "tabpanel").map((e) => e.getAttribute("data-tab-key"));
    expect(panels).toEqual(["tab-02", "tab-01", "tab-03", "tab-04"]);
    expect(oneStep(c, () => removeTab(c, id, "tab-02"))).toBe(1);
    expect(readTabs(c, id)!.initial).toBe("tab-01");
    c.history.undo();
    expect(readTabs(c, id)!.pairs).toHaveLength(4);
  });

  it("a block saved before keys reads by position and gets keys on its first edit, in that edit's step", () => {
    const { c, hero } = setup();
    const id = tabsBlockConfig.build!(c as never, hero)!;
    const root = c.elements.getElement(id)!;
    root.removeAttribute("data-tabs-initial");
    for (const el of [root, ...root.getChildren(), ...root.getChildren()[0].getChildren()]) el.removeAttribute("data-tab-key");
    const s = readTabs(c, id)!;
    expect(s.legacy).toBe(true);
    expect(s.initial).toBe("#1");
    expect(oneStep(c, () => setInitialTab(c, id, "#3"))).toBe(1);
    const after = readTabs(c, id)!;
    expect(after.legacy).toBe(false);
    expect(after.initial).toBe("tab-03");
    ensureTabKeys(c, id);
  });

  it("the published page switches tabs (export path + runtime)", async () => {
    const { c, hero } = setup();
    const id = tabsBlockConfig.build!(c as never, hero)!;
    setInitialTab(c, id, "tab-02");
    await publishedBody(c);
    initTabsRuntime(document);
    const visible = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]')).filter((p) => !p.hidden).map((p) => p.getAttribute("data-tab-key"));
    expect(visible()).toEqual(["tab-02"]);
    document.querySelectorAll<HTMLElement>('[role="tab"]')[2].click();
    expect(visible()).toEqual(["tab-03"]);
    expect(document.querySelectorAll('[role="tab"]')[2].getAttribute("aria-selected")).toBe("true");
  });
});

describe("export carries both models", () => {
  it("writes the pair keys, the initial pair, the link and the behaviour into the published HTML", async () => {
    const { c, hero } = setup();
    tabsBlockConfig.build!(c as never, hero);
    modalBlockConfig.build!(c as never, hero);
    const { files } = await new ExportEngine(c).exportAllPages({ format: "html" });
    const html = files.find((f) => f.name === "index.html")!.content;
    const strip = (t: string) => t.replace(/ (class|style|data-buildrick-[a-z-]+|id)="[^"]*"/g, "").replace(/modal-[a-z0-9]+-[a-z0-9]+/g, "KEY");
    const tabs = strip(html.match(/<div[^>]*data-tabs-initial[\s\S]*?<\/button>/)![0]);
    expect(tabs).toMatchInlineSnapshot(`
      "<div data-tabs-initial="tab-01">
              <div role="tablist">
                <button role="tab" data-tab-key="tab-01" aria-selected="true">
                  <span>Tab 1</span>
                </button>"
    `);
    const dialog = strip(html.match(/<div[^>]*role="dialog"[^>]*>/)![0]);
    expect(dialog).toMatchInlineSnapshot(`"<div role="dialog" aria-modal="true" data-modal-key="KEY" data-modal-escape="true" data-modal-backdrop="true" data-modal-initial="closed">"`);
    expect(strip(html.match(/<button[^>]*data-modal-target[^>]*>/)![0])).toMatchInlineSnapshot(`"<button data-modal-target="KEY">"`);
  });
});

describe("Modal model (B-17)", () => {
  it("the block links trigger and dialog by key, the dialog at the page root", () => {
    const { c, hero } = setup();
    const triggerId = modalBlockConfig.build!(c as never, hero)!;
    const s = readModal(c, triggerId)!;
    expect(s.legacy).toBe(false);
    expect(s.triggerIds).toEqual([triggerId]);
    expect(s.atPageRoot).toBe(true);
    expect(s.behavior).toEqual({ escape: true, backdrop: true, initial: "closed" });
  });

  it("duplicate makes both and remaps the link; behaviour and link are one step each", () => {
    const { c, hero, rootId } = setup();
    const triggerId = modalBlockConfig.build!(c as never, hero)!;
    const first = readModal(c, triggerId)!;
    let copy: { triggerId: string; dialogId: string } | null = null;
    expect(oneStep(c, () => (copy = duplicateModal(c, triggerId)))).toBe(1);
    const dup = readModal(c, copy!.triggerId)!;
    expect(dup.dialogId).toBe(copy!.dialogId);
    expect(dup.key).not.toBe(first.key);
    expect(readModal(c, triggerId)!.dialogId).toBe(first.dialogId);
    expect(c.elements.getElement(copy!.dialogId)!.getParent()!.getId()).toBe(rootId);
    expect(oneStep(c, () => setDialogBehavior(c, triggerId, { escape: false, initial: "open" }))).toBe(1);
    expect(readModal(c, triggerId)!.behavior).toEqual({ escape: false, backdrop: true, initial: "open" });
    expect(oneStep(c, () => linkModal(c, copy!.triggerId, first.dialogId))).toBe(1);
    expect(readModal(c, first.dialogId)!.triggerIds.sort()).toEqual([triggerId, copy!.triggerId].sort());
    /* Deleting a trigger keeps its dialog. */
    c.elements.removeElement(triggerId);
    expect(c.elements.getElement(first.dialogId)).toBeDefined();
  });

  it("a modal saved before keys links by position, then gets keys", () => {
    const { c, hero } = setup();
    const triggerId = modalBlockConfig.build!(c as never, hero)!;
    const dialogId = readModal(c, triggerId)!.dialogId;
    c.elements.getElement(triggerId)!.removeAttribute("data-modal-target");
    c.elements.getElement(dialogId)!.removeAttribute("data-modal-key");
    const s = readModal(c, triggerId)!;
    expect(s.legacy).toBe(true);
    expect(s.dialogId).toBe(dialogId);
    const key = ensureModalLink(c, triggerId)!;
    expect(c.elements.getElement(triggerId)!.getAttribute("data-modal-target")).toBe(key);
  });

  it("the published page opens and closes the dialog (export path + runtime)", async () => {
    const { c, hero } = setup();
    const triggerId = modalBlockConfig.build!(c as never, hero)!;
    await publishedBody(c);
    initModalRuntime(document);
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    const trigger = document.querySelector<HTMLElement>("[data-modal-target]")!;
    expect(dialog.style.display).toBe("none");
    trigger.click();
    expect(dialog.style.display).not.toBe("none");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(dialog.style.display).toBe("none");
    trigger.click();
    dialog.querySelector<HTMLElement>("[data-modal-close]")!.click();
    expect(dialog.style.display).toBe("none");
    expect(triggerId).toBeTruthy();
  });
});

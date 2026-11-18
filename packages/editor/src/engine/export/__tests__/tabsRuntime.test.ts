// @vitest-environment jsdom
/**
 * Tabs runtime (C01 245:36832, B-21): pairs by key (or position, for blocks
 * saved before keys), the initial pair, ARIA, click + keyboard switching on a
 * published page, state only on the canvas. And the Tabs block's markup as
 * exported (R4 P0 #2, REA audit 2026-10-20): no runtime shipped, so clicking
 * "Tab 2" changed nothing; its per-element stylesheet hides panels 2 and 3.
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it } from "vitest";
import { initTabsRuntime } from "../tabsRuntime";
import { injectPageRuntimes } from "../publishPostProcess";

const ON = "color: blue; font-weight: 600";
const OFF = "color: gray; font-weight: 500";
function keyed(initial: string, order: string[] = ["tab-01", "tab-02"]): string {
  return (
    `<div class="tabs" data-tabs-initial="${initial}"><div role="tablist">` +
    order.map((k, i) => `<button role="tab" data-tab-key="${k}" aria-selected="${i === 0}" style="${i === 0 ? ON : OFF}">${k}</button>`).join("") +
    `</div>` +
    /* Panels deliberately in the OTHER order: pairing is by key, not position. */
    [...order].reverse().map((k) => `<div role="tabpanel" data-tab-key="${k}">${k} panel</div>`).join("") +
    `</div>`
  );
}
const legacy =
  `<div class="tabs"><div class="tabs-nav" role="tablist">` +
  `<button class="tab-button active" role="tab" aria-selected="true" style="${ON}">One</button>` +
  `<button class="tab-button" role="tab" aria-selected="false" style="${OFF}">Two</button></div>` +
  `<div class="tab-panel active" role="tabpanel" style="display: block">One panel</div>` +
  `<div class="tab-panel" role="tabpanel" style="display: none">Two panel</div></div>`;

const tabs = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'));
const panelOf = (t: HTMLElement) => document.getElementById(t.getAttribute("aria-controls")!)!;
const visible = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]')).filter((p) => !p.hasAttribute("hidden")).map((p) => p.textContent);

afterEach(() => { document.body.innerHTML = ""; });

describe("initTabsRuntime", () => {
  it("pairs by key, opens the initial pair and writes the tabs ARIA", () => {
    document.body.innerHTML = keyed("tab-02");
    initTabsRuntime(document);
    expect(visible()).toEqual(["tab-02 panel"]);
    const [a, b] = tabs();
    expect(panelOf(a).textContent).toBe("tab-01 panel");
    expect(panelOf(b).getAttribute("aria-labelledby")).toBe(b.id);
    expect(b.getAttribute("aria-selected")).toBe("true");
    expect([a.tabIndex, b.tabIndex]).toEqual([-1, 0]);
  });

  it("switches on click and with the arrow keys, Home and End (published page)", () => {
    document.body.innerHTML = keyed("tab-01", ["tab-01", "tab-02", "tab-03"]);
    initTabsRuntime(document);
    tabs()[1].click();
    expect(visible()).toEqual(["tab-02 panel"]);
    tabs()[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(visible()).toEqual(["tab-03 panel"]);
    expect(document.activeElement).toBe(tabs()[2]);
    tabs()[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(visible()).toEqual(["tab-01 panel"]);
    tabs()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(visible()).toEqual(["tab-03 panel"]);
    tabs()[2].dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(visible()).toEqual(["tab-01 panel"]);
  });

  it("a block saved before keys pairs by position, keeps its look, and switches it", () => {
    document.body.innerHTML = legacy;
    initTabsRuntime(document);
    expect(visible()).toEqual(["One panel"]);
    tabs()[1].click();
    expect(visible()).toEqual(["Two panel"]);
    expect(tabs()[1].getAttribute("style")).toBe(ON);
    expect(tabs()[0].getAttribute("style")).toBe(OFF);
    expect(tabs()[1].classList.contains("active")).toBe(true);
  });

  it("on the canvas shows state only, and reveals the panel holding the selection", () => {
    document.body.innerHTML = keyed("tab-01");
    const inside = document.querySelector('[role="tabpanel"][data-tab-key="tab-02"]')!;
    initTabsRuntime(document, { interactive: false, reveal: inside });
    expect(visible()).toEqual(["tab-02 panel"]);
    tabs()[0].click();
    expect(visible()).toEqual(["tab-02 panel"]);
  });
});

const TABS = `<style>.p2,.p3{display:none}.p1{display:block}</style>
<div class="tabs">
  <div class="tabs-nav" role="tablist">
    <button class="tab-button active" role="tab" aria-selected="true"><span>Tab 1</span></button>
    <button class="tab-button" role="tab" aria-selected="false"><span>Tab 2</span></button>
    <button class="tab-button" role="tab" aria-selected="false"><span>Tab 3</span></button>
  </div>
  <div class="tab-panel active p1" role="tabpanel"><p>One</p></div>
  <div class="tab-panel p2" role="tabpanel"><p>Two</p></div>
  <div class="tab-panel p3" role="tabpanel"><p>Three</p></div>
</div>`;

const blockTabs = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'));
const panels = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
const shown = (p: HTMLElement) => getComputedStyle(p).display !== "none" && !p.hidden;
const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

describe("initTabsRuntime — the Tabs block as published", () => {
  it("clicking a tab shows its panel, hides the others and moves aria-selected", () => {
    document.body.innerHTML = TABS;
    initTabsRuntime(document);
    blockTabs()[1].click();
    expect(blockTabs().map((t) => t.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);
    expect(panels().map(shown)).toEqual([false, true, false]);
  });

  it("Up and Down move selection like Left and Right", () => {
    document.body.innerHTML = TABS;
    initTabsRuntime(document);
    key(blockTabs()[0], "ArrowDown");
    expect(panels().map(shown)).toEqual([false, true, false]);
    key(blockTabs()[1], "ArrowUp");
    expect(panels().map(shown)).toEqual([true, false, false]);
  });

  it("links every tab to its panel and uses a roving tabindex", () => {
    document.body.innerHTML = TABS;
    initTabsRuntime(document);
    blockTabs().forEach((t, i) => {
      expect(t.getAttribute("aria-controls")).toBe(panels()[i].id);
      expect(panels()[i].getAttribute("aria-labelledby")).toBe(t.id);
    });
    expect(blockTabs().map((t) => t.tabIndex)).toEqual([0, -1, -1]);
  });

  it("arrow keys, Home and End move selection and focus, wrapping at the ends", () => {
    document.body.innerHTML = TABS;
    initTabsRuntime(document);
    blockTabs()[0].focus();
    key(blockTabs()[0], "ArrowLeft");
    expect(document.activeElement).toBe(blockTabs()[2]);
    expect(shown(panels()[2])).toBe(true);
    key(blockTabs()[2], "ArrowRight");
    expect(document.activeElement).toBe(blockTabs()[0]);
    key(blockTabs()[0], "End");
    expect(blockTabs()[2].getAttribute("aria-selected")).toBe("true");
    key(blockTabs()[2], "Home");
    expect(blockTabs().map((t) => t.tabIndex)).toEqual([0, -1, -1]);
  });

  it("is idempotent and its cleanup removes the listeners", () => {
    document.body.innerHTML = TABS;
    const stop = initTabsRuntime(document);
    initTabsRuntime(document);
    stop();
    blockTabs()[1].click();
    expect(blockTabs()[1].getAttribute("aria-selected")).toBe("false");
  });
});

describe("injectPageRuntimes — tabs", () => {
  it("injects the tabs runtime only on a page with a tablist, and the injected script works", () => {
    const plain = "<html><body><p>hi</p></body></html>";
    expect(injectPageRuntimes(plain)).toBe(plain);
    const out = injectPageRuntimes(`<html><body>${TABS}</body></html>`);
    expect(out).toContain("<script data-buildrick-tabs-runtime>");
    expect(injectPageRuntimes(out)).toBe(out);

    document.body.innerHTML = out.slice(out.indexOf("<body>") + 6, out.indexOf("</body>"));
    for (const s of Array.from(document.querySelectorAll("script"))) {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function(s.textContent ?? "")();
    }
    blockTabs()[1].click();
    expect(panels().map(shown)).toEqual([false, true, false]);
  });
});

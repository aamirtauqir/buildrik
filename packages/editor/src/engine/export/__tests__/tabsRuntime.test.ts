// @vitest-environment jsdom
/**
 * Tabs runtime (C01 245:36832, B-21): pairs by key (or position, for blocks
 * saved before keys), the initial pair, ARIA, click + keyboard switching on a
 * published page, state only on the canvas.
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it } from "vitest";
import { initTabsRuntime } from "../tabsRuntime";

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

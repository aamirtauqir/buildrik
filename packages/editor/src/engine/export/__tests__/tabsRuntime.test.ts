/**
 * R4 P0 #2 (REA audit 2026-10-20): Tabs did nothing on any exported or
 * published site — no runtime shipped, so clicking "Tab 2" changed nothing.
 *
 * Markup is the Tabs block's as exported (blocks/Components/Tabs.tsx): the
 * per-element stylesheet hides panels 2 and 3 with `display:none`.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { initTabsRuntime } from "../tabsRuntime";
import { injectPageRuntimes } from "../publishPostProcess";

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

const tabs = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'));
const panels = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
const shown = (p: HTMLElement) => getComputedStyle(p).display !== "none" && !p.hidden;
const key = (el: HTMLElement, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("initTabsRuntime", () => {
  it("clicking a tab shows its panel, hides the others and moves aria-selected", () => {
    document.body.innerHTML = TABS;
    initTabsRuntime(document);
    tabs()[1].click();
    expect(tabs().map((t) => t.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);
    expect(panels().map(shown)).toEqual([false, true, false]);
  });

  it("links every tab to its panel and uses a roving tabindex", () => {
    document.body.innerHTML = TABS;
    initTabsRuntime(document);
    tabs().forEach((t, i) => {
      expect(t.getAttribute("aria-controls")).toBe(panels()[i].id);
      expect(panels()[i].getAttribute("aria-labelledby")).toBe(t.id);
    });
    expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1, -1]);
  });

  it("arrow keys, Home and End move selection and focus, wrapping at the ends", () => {
    document.body.innerHTML = TABS;
    initTabsRuntime(document);
    tabs()[0].focus();
    key(tabs()[0], "ArrowLeft");
    expect(document.activeElement).toBe(tabs()[2]);
    expect(shown(panels()[2])).toBe(true);
    key(tabs()[2], "ArrowRight");
    expect(document.activeElement).toBe(tabs()[0]);
    key(tabs()[0], "End");
    expect(tabs()[2].getAttribute("aria-selected")).toBe("true");
    key(tabs()[2], "Home");
    expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1, -1]);
  });

  it("is idempotent and its cleanup removes the listeners", () => {
    document.body.innerHTML = TABS;
    const stop = initTabsRuntime(document);
    initTabsRuntime(document);
    stop();
    tabs()[1].click();
    expect(tabs()[1].getAttribute("aria-selected")).toBe("false");
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
    tabs()[1].click();
    expect(panels().map(shown)).toEqual([false, true, false]);
  });
});

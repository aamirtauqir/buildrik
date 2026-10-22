/**
 * R4 P0 #3 (REA audit 2026-10-20): the Modal block's "Open Modal" button did
 * nothing on a published site — no trigger runtime shipped, and the overlay is
 * hidden by a static per-element `display:none`.
 *
 * Markup is the Modal block's as exported (blocks/Components/Modal.tsx).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import { initModalRuntime } from "../modalRuntime";
import { injectPageRuntimes } from "../publishPostProcess";

const MODAL = `<style>.ov{display:none;position:fixed}</style>
<button class="modal-trigger"><span>Open Modal</span></button>
<div class="modal-overlay ov" role="dialog" aria-modal="true">
  <div class="modal-content">
    <div class="modal-header"><h3>Modal Title</h3><button class="modal-close"><span>×</span></button></div>
    <div class="modal-body"><p>Body</p><a href="#x">Link</a></div>
  </div>
</div>`;

const trigger = () => document.querySelector<HTMLElement>(".modal-trigger")!;
const overlay = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const closeBtn = () => document.querySelector<HTMLElement>(".modal-close")!;
const link = () => document.querySelector<HTMLElement>(".modal-body a")!;
const isOpen = () => getComputedStyle(overlay()).display !== "none";
const key = (k: string, shiftKey = false) =>
  document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, shiftKey, bubbles: true }));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("initModalRuntime", () => {
  it("the trigger opens the dialog and focus moves inside it", () => {
    document.body.innerHTML = MODAL;
    initModalRuntime(document);
    expect(isOpen()).toBe(false);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    trigger().focus();
    trigger().click();
    expect(isOpen()).toBe(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(overlay().contains(document.activeElement)).toBe(true);
  });

  it("Escape closes it and focus returns to the trigger", () => {
    document.body.innerHTML = MODAL;
    initModalRuntime(document);
    trigger().focus();
    trigger().click();
    key("Escape");
    expect(isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger());
  });

  it("the close button and a backdrop click close it", () => {
    document.body.innerHTML = MODAL;
    initModalRuntime(document);
    trigger().click();
    closeBtn().click();
    expect(isOpen()).toBe(false);
    trigger().click();
    overlay().click();
    expect(isOpen()).toBe(false);
  });

  it("Tab is trapped inside the dialog", () => {
    document.body.innerHTML = MODAL;
    initModalRuntime(document);
    trigger().click();
    link().focus();
    key("Tab");
    expect(document.activeElement).toBe(closeBtn());
    key("Tab", true);
    expect(document.activeElement).toBe(link());
  });

  it("names the dialog by its heading and gives the × button a label", () => {
    document.body.innerHTML = MODAL;
    initModalRuntime(document);
    const labelledBy = overlay().getAttribute("aria-labelledby");
    expect(labelledBy && document.getElementById(labelledBy)?.textContent).toBe("Modal Title");
    expect(closeBtn().getAttribute("aria-label")).toBe("Close");
    expect(trigger().getAttribute("aria-controls")).toBe(overlay().id);
  });
});

describe("injectPageRuntimes — modal", () => {
  it("injects the modal runtime only on a page with a modal trigger, and the injected script works", () => {
    const plain = "<html><body><p>hi</p></body></html>";
    expect(injectPageRuntimes(plain)).toBe(plain);
    const out = injectPageRuntimes(`<html><body>${MODAL}</body></html>`);
    expect(out).toContain("<script data-buildrick-modal-runtime>");
    expect(injectPageRuntimes(out)).toBe(out);

    document.body.innerHTML = out.slice(out.indexOf("<body>") + 6, out.indexOf("</body>"));
    for (const s of Array.from(document.querySelectorAll("script"))) {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function(s.textContent ?? "")();
    }
    trigger().click();
    expect(isOpen()).toBe(true);
  });
});

// @vitest-environment jsdom
/**
 * Modal runtime (C07 / C18, B-17): a trigger opens its dialog by key (or, for
 * a modal saved before keys, the dialog after it); focus, trap, inertness,
 * Escape / backdrop / close button, focus return; canvas reveal only. And the
 * published Modal block's markup (R4 P0 #3, REA audit 2026-10-20): its "Open
 * Modal" button did nothing on a published site — no trigger runtime shipped.
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it } from "vitest";
import { initModalRuntime } from "../modalRuntime";
import { injectPageRuntimes } from "../publishPostProcess";

const page = (dialogAttrs = "") =>
  `<header id="hero"><button id="t" data-modal-target="modal-a">Contact us</button></header>` +
  `<main id="rest"><a href="#x">Elsewhere</a></main>` +
  `<div id="d" role="dialog" aria-modal="true" data-modal-key="modal-a" ${dialogAttrs} style="display: none">` +
  `<div class="box"><button id="close" data-modal-close>×</button><input id="field"></div></div>`;
const legacy =
  `<section><button class="modal-trigger" id="t">Open Modal</button>` +
  `<div class="modal-overlay" id="d" role="dialog" aria-modal="true" style="display: none">` +
  `<div class="modal-content"><button class="modal-close" id="close">×</button></div></div></section>`;

const $ = (id: string) => document.getElementById(id)!;
const shown = () => $("d").style.display !== "none";
const key = (k: string, extra: KeyboardEventInit = {}) => document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...extra }));

afterEach(() => { document.body.innerHTML = ""; });

describe("initModalRuntime", () => {
  it("opens from its trigger: focus inside, the rest inert, ARIA on the trigger", () => {
    document.body.innerHTML = page();
    initModalRuntime(document);
    expect(shown()).toBe(false);
    expect($("t").getAttribute("aria-haspopup")).toBe("dialog");
    expect($("t").getAttribute("aria-controls")).toBe("d");
    $("t").click();
    expect(shown()).toBe(true);
    expect(document.activeElement).toBe($("close"));
    expect($("hero").hasAttribute("inert")).toBe(true);
    expect($("rest").hasAttribute("inert")).toBe(true);
    expect($("t").getAttribute("aria-expanded")).toBe("true");
  });

  it("traps Tab, closes on Escape and returns focus to the trigger", () => {
    document.body.innerHTML = page();
    initModalRuntime(document);
    $("t").click();
    $("field").focus();
    key("Tab");
    expect(document.activeElement).toBe($("close"));
    key("Tab", { shiftKey: true });
    expect(document.activeElement).toBe($("field"));
    key("Escape");
    expect(shown()).toBe(false);
    expect($("hero").hasAttribute("inert")).toBe(false);
    expect(document.activeElement).toBe($("t"));
  });

  it("closes on the backdrop itself, not on its content; honours the switches", () => {
    document.body.innerHTML = page();
    initModalRuntime(document);
    $("t").click();
    (document.querySelector(".box") as HTMLElement).click();
    expect(shown()).toBe(true);
    $("d").click();
    expect(shown()).toBe(false);

    document.body.innerHTML = page('data-modal-escape="false" data-modal-backdrop="false"');
    initModalRuntime(document);
    $("t").click();
    key("Escape");
    $("d").click();
    expect(shown()).toBe(true);
    $("close").click();
    expect(shown()).toBe(false);
  });

  it("a modal saved before keys opens its own overlay and closes with its ×", () => {
    document.body.innerHTML = legacy;
    initModalRuntime(document);
    $("t").click();
    expect(shown()).toBe(true);
    $("close").click();
    expect(shown()).toBe(false);
  });

  it("opens on load when its initial state is open", () => {
    document.body.innerHTML = page('data-modal-initial="open"');
    initModalRuntime(document);
    expect(shown()).toBe(true);
  });

  it("on the canvas stays closed unless the selection is inside it — a selected trigger does not cover the canvas", () => {
    document.body.innerHTML = page();
    initModalRuntime(document, { interactive: false, reveal: document.getElementById("t") });
    expect(shown()).toBe(false);
    $("t").click();
    expect(shown()).toBe(false);
    document.body.innerHTML = page();
    initModalRuntime(document, { interactive: false, reveal: document.getElementById("field") });
    expect(shown()).toBe(true);
    expect($("hero").hasAttribute("inert")).toBe(false);
  });
});

describe("initModalRuntime — other dialogs", () => {
  it("leaves a role=dialog that is not a Modal block alone", () => {
    document.body.innerHTML = `<div id="other" role="dialog" style="display: block">Cookie notice</div>`;
    initModalRuntime(document);
    expect(document.getElementById("other")!.style.display).toBe("block");
  });
});

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
const keyOnFocus = (k: string, shiftKey = false) =>
  document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, shiftKey, bubbles: true }));

describe("initModalRuntime — the Modal block as published", () => {
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

  it("locks page scroll while open and restores it on close", () => {
    document.body.innerHTML = MODAL;
    document.body.style.overflow = "auto";
    initModalRuntime(document);
    trigger().click();
    expect(document.body.style.overflow).toBe("hidden");
    closeBtn().click();
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = "";
  });

  it("Escape closes it and focus returns to the trigger", () => {
    document.body.innerHTML = MODAL;
    initModalRuntime(document);
    trigger().focus();
    trigger().click();
    keyOnFocus("Escape");
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
    keyOnFocus("Tab");
    expect(document.activeElement).toBe(closeBtn());
    keyOnFocus("Tab", true);
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

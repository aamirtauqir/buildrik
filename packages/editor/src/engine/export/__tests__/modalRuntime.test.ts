// @vitest-environment jsdom
/**
 * Modal runtime (C07 / C18, B-17): a trigger opens its dialog by key (or, for
 * a modal saved before keys, the dialog after it); focus, trap, inertness,
 * Escape / backdrop / close button, focus return; canvas reveal only.
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it } from "vitest";
import { initModalRuntime } from "../modalRuntime";

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

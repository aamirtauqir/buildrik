// @vitest-environment jsdom
/**
 * Accordion runtime (board 13): the saved Open / Closed per item and "Allow
 * several open at once", honoured on the canvas (state only) and the
 * published page (state + header clicks).
 * @license BSD-3-Clause
 */
import { afterEach, describe, expect, it } from "vitest";
import { initAccordionRuntime } from "../accordionRuntime";

/** The block as the canvas renders it: classes on every part. */
function canvasMarkup(allow: string, states: Array<string | null>, openClass = [true, false, false]): string {
  return (
    `<div data-buildrick-type="accordion" class="accordion" ${allow}>` +
    states
      .map(
        (s, i) =>
          `<div class="accordion-item${openClass[i] ? " open" : ""}"${s ? ` data-accordion-state="${s}"` : ""}>` +
          `<button class="accordion-header">Q${i + 1}</button>` +
          `<div class="accordion-content"><p>A${i + 1}</p></div></div>`,
      )
      .join("") +
    "</div>"
  );
}

/** The block as the publish writer emits it: the `class` attribute is gone. */
function publishedMarkup(allow: string, states: string[]): string {
  return (
    `<div class="buildrick-el-a" data-allow-multiple="${allow}">` +
    states
      .map((s, i) => `<div class="buildrick-el-i${i}" data-accordion-state="${s}"><button>Q${i + 1}</button><div><p>A${i + 1}</p></div></div>`)
      .join("") +
    "</div>"
  );
}

const items = () => Array.from(document.querySelectorAll<HTMLElement>("[data-accordion-state], .accordion-item"));
const isOpen = (item: HTMLElement) => item.lastElementChild!.getAttribute("aria-hidden") !== "true";
const header = (i: number) => items()[i].querySelector("button")!;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("initAccordionRuntime", () => {
  it("shows the saved Open / Closed per item on the canvas, without click toggling", () => {
    document.body.innerHTML = canvasMarkup("", ["closed", "open", "closed"]);
    initAccordionRuntime(document, { interactive: false });
    expect(items().map(isOpen)).toEqual([false, true, false]);
    expect(header(1).getAttribute("aria-expanded")).toBe("true");
    header(0).click();
    expect(items().map(isOpen)).toEqual([false, true, false]);
  });

  it("falls back to the item's open class when it has no saved state", () => {
    document.body.innerHTML = canvasMarkup("", [null, null, null]);
    initAccordionRuntime(document, { interactive: false });
    expect(items().map(isOpen)).toEqual([true, false, false]);
  });

  it("published, one at a time: opening an item closes the others", () => {
    document.body.innerHTML = publishedMarkup("false", ["open", "closed", "closed"]);
    initAccordionRuntime(document);
    expect(items().map(isOpen)).toEqual([true, false, false]);
    header(2).click();
    expect(items().map(isOpen)).toEqual([false, false, true]);
    header(2).click();
    expect(items().map(isOpen)).toEqual([false, false, false]);
  });

  it("published, several open at once: items toggle independently", () => {
    document.body.innerHTML = publishedMarkup("true", ["open", "open", "closed"]);
    initAccordionRuntime(document);
    expect(items().map(isOpen)).toEqual([true, true, false]);
    header(2).click();
    expect(items().map(isOpen)).toEqual([true, true, true]);
  });

  it("one at a time keeps only the first item saved open", () => {
    document.body.innerHTML = publishedMarkup("false", ["open", "open", "closed"]);
    initAccordionRuntime(document);
    expect(items().map(isOpen)).toEqual([true, false, false]);
  });

  it("the canvas's bare data-allow-multiple (value \"true\") allows several", () => {
    document.body.innerHTML = canvasMarkup("data-allow-multiple", ["open", "open", "closed"]);
    initAccordionRuntime(document);
    expect(items().map(isOpen)).toEqual([true, true, false]);
  });

  it("cleanup removes the click listeners; a second init is a no-op", () => {
    document.body.innerHTML = publishedMarkup("true", ["closed", "closed"]);
    const stop = initAccordionRuntime(document);
    initAccordionRuntime(document);
    header(0).click();
    expect(items().map(isOpen)).toEqual([true, false]);
    stop();
    header(1).click();
    expect(items().map(isOpen)).toEqual([true, false]);
  });

  it("runs from its own source text, as the published page runs it", () => {
    document.body.innerHTML = publishedMarkup("false", ["closed", "open"]);
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const run = new Function("root", `return (${initAccordionRuntime.toString()})(root);`) as (r: ParentNode) => () => void;
    run(document);
    header(0).click();
    expect(items().map(isOpen)).toEqual([true, false]);
  });
});

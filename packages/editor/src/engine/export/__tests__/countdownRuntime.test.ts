// @vitest-environment jsdom
/**
 * Countdown runtime (board 11): ticks the value spans toward the end time,
 * read in the visitor's time zone, and does "When done" at zero.
 * @license BSD-3-Clause
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initCountdownRuntime } from "../countdownRuntime";

const GRID =
  '<div class="buildrick-countdown-grid">' +
  ["Days", "Hours", "Minutes", "Seconds"]
    .map((l) => `<div class="buildrick-countdown-unit"><span class="buildrick-countdown-value">00</span><span>${l}</span></div>`)
    .join("") +
  "</div>";

function mount(attrs: string): HTMLElement {
  document.body.innerHTML = `<div id="c" ${attrs}><h3>Launch in</h3>${GRID}</div>`;
  return document.getElementById("c")!;
}
const values = (el: HTMLElement) => Array.from(el.querySelectorAll(".buildrick-countdown-value"), (s) => s.textContent);

/* Local wall-clock times, like the "Ends at" field — no zone suffix. */
const START = new Date(2026, 11, 30, 22, 57, 30).getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(START);
});
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("initCountdownRuntime", () => {
  it("writes days / hours / minutes / seconds and ticks every second", () => {
    const el = mount('data-countdown-end="2026-12-31T23:59"');
    const stop = initCountdownRuntime(document);
    expect(values(el)).toEqual(["1", "01", "01", "30"]);
    vi.advanceTimersByTime(1000);
    expect(values(el)).toEqual(["1", "01", "01", "29"]);
    stop();
    vi.advanceTimersByTime(5000);
    expect(values(el)).toEqual(["1", "01", "01", "29"]);
  });

  it("When done = Show message: hides the units and shows the message", () => {
    const el = mount('data-countdown-end="2026-12-30T22:57" data-countdown-message="We are open!"');
    initCountdownRuntime(document);
    expect(values(el)).toEqual(["0", "00", "00", "00"]);
    expect((el.querySelector(".buildrick-countdown-grid") as HTMLElement).style.display).toBe("none");
    expect(el.querySelector(".buildrick-countdown-message")?.textContent).toBe("We are open!");
  });

  it("reaches zero while running and then shows the message", () => {
    const el = mount('data-countdown-end="2026-12-30T22:58" data-countdown-message="Open"');
    initCountdownRuntime(document);
    expect(el.querySelector(".buildrick-countdown-message")).toBeNull();
    vi.advanceTimersByTime(30_000);
    expect(el.querySelector(".buildrick-countdown-message")?.textContent).toBe("Open");
  });

  it("When done = Hide: removes the element on the page, dims it on the canvas", () => {
    const page = mount('data-countdown-end="2026-01-01T00:00" data-countdown-done="hide"');
    initCountdownRuntime(document);
    expect(page.style.display).toBe("none");
    const canvas = mount('data-countdown-end="2026-01-01T00:00" data-countdown-done="hide"');
    initCountdownRuntime(document, { editor: true });
    expect(canvas.style.display).toBe("");
    expect(canvas.style.opacity).toBe("0.4");
  });

  it("leaves a countdown with no end time (saved before v4) untouched, and runs once per element", () => {
    const old = mount("");
    initCountdownRuntime(document);
    expect(values(old)).toEqual(["00", "00", "00", "00"]);
    const el = mount('data-countdown-end="2026-12-31T23:59"');
    initCountdownRuntime(document);
    el.querySelector(".buildrick-countdown-value")!.textContent = "x";
    initCountdownRuntime(document);
    expect(el.querySelector(".buildrick-countdown-value")!.textContent).toBe("x");
  });

  it("runs from its own source text, as the published page runs it", () => {
    const el = mount('data-countdown-end="2026-12-31T23:59"');
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const run = new Function("root", `return (${initCountdownRuntime.toString()})(root);`) as (r: ParentNode) => () => void;
    const stop = run(document);
    expect(values(el)).toEqual(["1", "01", "01", "30"]);
    stop();
  });
});

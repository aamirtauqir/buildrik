// @vitest-environment jsdom
/**
 * Countdown / Accordion runtimes on the published page (Inspector v4 boards
 * 11, 13): injected only where the widget is, once, and the injected script
 * actually runs the widget.
 */
import { describe, it, expect, afterEach } from "vitest";
import { injectPageRuntimes } from "../publishPostProcess";

const COUNTDOWN = `<html><body>
<div data-countdown-end="2099-01-01T00:00"><div><span class="buildrick-countdown-value">12</span></div></div>
</body></html>`;
const ACCORDION = `<html><body>
<div data-allow-multiple="false">
  <div data-accordion-state="closed"><button>Q1</button><div><p>A1</p></div></div>
  <div data-accordion-state="open"><button>Q2</button><div><p>A2</p></div></div>
</div>
</body></html>`;

/** Runs the page's inline scripts against this document, as a browser would. */
function runScripts(html: string): void {
  document.body.innerHTML = html.slice(html.indexOf("<body>") + 6, html.indexOf("</body>"));
  for (const s of Array.from(document.querySelectorAll("script"))) {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function(s.textContent ?? "")();
  }
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("injectPageRuntimes", () => {
  it("leaves a page with neither widget untouched (incl. a countdown with no end time)", () => {
    const plain = "<html><body><p>hi</p></body></html>";
    expect(injectPageRuntimes(plain)).toBe(plain);
    const oldCountdown = '<html><body><div class="buildrick-countdown"><span>12</span></div></body></html>';
    expect(injectPageRuntimes(oldCountdown)).toBe(oldCountdown);
  });

  it("injects each runtime once, before </body>, only for the widget the page has", () => {
    const out = injectPageRuntimes(COUNTDOWN);
    expect(out).toContain("<script data-buildrick-countdown-runtime>");
    expect(out).not.toContain("data-buildrick-accordion-runtime");
    expect(out.indexOf("</script>")).toBeLessThan(out.indexOf("</body>"));
    expect(injectPageRuntimes(out)).toBe(out);
  });

  it("the injected countdown script ticks the page's countdown", () => {
    runScripts(injectPageRuntimes(COUNTDOWN));
    expect(document.querySelector(".buildrick-countdown-value")?.textContent).not.toBe("12");
  });

  it("the injected accordion script honours one-at-a-time on click", () => {
    runScripts(injectPageRuntimes(ACCORDION));
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-accordion-state]"));
    const open = () => items.map((i) => i.lastElementChild!.getAttribute("aria-hidden") !== "true");
    expect(open()).toEqual([false, true]);
    items[0].querySelector("button")!.click();
    expect(open()).toEqual([true, false]);
  });

  /* design-2l9 B-21 / B-17: the serialized runtimes switch tabs and open /
     close a dialog on the published page — a Tabs and a Modal saved before
     the models included (paired by position). */
  it("injects and runs the tabs runtime on a page with a tablist", () => {
    const page = `<html><body><div class="tabs"><div role="tablist">
<button role="tab" aria-selected="true">One</button><button role="tab" aria-selected="false">Two</button></div>
<div role="tabpanel">P1</div><div role="tabpanel" style="display: none">P2</div></div></body></html>`;
    const out = injectPageRuntimes(page);
    expect(out.match(/data-buildrick-tabs-runtime/g)).toHaveLength(1);
    expect(injectPageRuntimes(out)).toBe(out);
    runScripts(out);
    const tabs = document.querySelectorAll<HTMLElement>('[role="tab"]');
    const panels = document.querySelectorAll<HTMLElement>('[role="tabpanel"]');
    expect(panels[1].hidden).toBe(true);
    tabs[1].click();
    expect(panels[1].hidden).toBe(false);
    expect(panels[0].hidden).toBe(true);
  });

  it("injects and runs the modal runtime on a page with a dialog", () => {
    const page = `<html><body><button data-modal-target="m1">Open</button>
<div role="dialog" aria-modal="true" data-modal-key="m1" style="display: none"><button data-modal-close>×</button></div></body></html>`;
    const out = injectPageRuntimes(page);
    expect(out).toContain("data-buildrick-modal-runtime");
    expect(out).not.toContain("data-buildrick-tabs-runtime");
    runScripts(out);
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    document.querySelector<HTMLElement>("[data-modal-target]")!.click();
    expect(dialog.style.display).not.toBe("none");
    dialog.querySelector<HTMLElement>("[data-modal-close]")!.click();
    expect(dialog.style.display).toBe("none");
  });
});

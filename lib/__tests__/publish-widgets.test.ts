// @vitest-environment jsdom
/**
 * Countdown / Accordion runtimes on the published page (Inspector v4 boards
 * 11, 13): injected only where the widget is, once, and the injected script
 * actually runs the widget.
 */
import { describe, it, expect, afterEach } from "vitest";
import { wireWidgetRuntimes } from "../publish-widgets";

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

describe("wireWidgetRuntimes", () => {
  it("leaves a page with neither widget untouched (incl. a countdown with no end time)", () => {
    const plain = "<html><body><p>hi</p></body></html>";
    expect(wireWidgetRuntimes(plain)).toBe(plain);
    const oldCountdown = '<html><body><div class="buildrick-countdown"><span>12</span></div></body></html>';
    expect(wireWidgetRuntimes(oldCountdown)).toBe(oldCountdown);
  });

  it("injects each runtime once, before </body>, only for the widget the page has", () => {
    const out = wireWidgetRuntimes(COUNTDOWN);
    expect(out).toContain("<script data-buildrick-countdown-runtime>");
    expect(out).not.toContain("data-buildrick-accordion-runtime");
    expect(out.indexOf("</script>")).toBeLessThan(out.indexOf("</body>"));
    expect(wireWidgetRuntimes(out)).toBe(out);
  });

  it("the injected countdown script ticks the page's countdown", () => {
    runScripts(wireWidgetRuntimes(COUNTDOWN));
    expect(document.querySelector(".buildrick-countdown-value")?.textContent).not.toBe("12");
  });

  it("the injected accordion script honours one-at-a-time on click", () => {
    runScripts(wireWidgetRuntimes(ACCORDION));
    const items = Array.from(document.querySelectorAll<HTMLElement>("[data-accordion-state]"));
    const open = () => items.map((i) => i.lastElementChild!.getAttribute("aria-hidden") !== "true");
    expect(open()).toEqual([false, true]);
    items[0].querySelector("button")!.click();
    expect(open()).toEqual([true, false]);
  });
});

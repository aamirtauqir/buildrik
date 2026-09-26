// @vitest-environment jsdom
/**
 * L-1 [HIGH]: the canvas mounts the page's own HTML in the editor document, so
 * one ordinary click on a link element (to select it) followed its href and
 * navigated the whole editor away — /edit/S2 → /services, a 404, no prompt.
 * Nothing inside the canvas may navigate the editor: link activation (click,
 * middle-click, Enter — which the browser turns into a click) and form
 * submits are cancelled at the canvas root, whatever element they come from.
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useCanvasNavigationGuard } from "../useCanvasNavigationGuard";

function Frame() {
  const ref = React.useRef<HTMLDivElement>(null);
  useCanvasNavigationGuard(ref);
  return (
    <div ref={ref} data-testid="frame">
      <a href="/services" data-buildrick-id="link-28">
        <span data-testid="inner">Services</span>
      </a>
      <form action="/submit" data-testid="form">
        <button type="submit">Send</button>
      </form>
      <p data-testid="plain">Text</p>
    </div>
  );
}

const fire = (el: Element, type: string, init: MouseEventInit = {}) => {
  const ev = new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(ev);
  return ev;
};

afterEach(cleanup);

describe("useCanvasNavigationGuard", () => {
  it("a click on a link (or inside one) does not follow it", () => {
    const { getByTestId } = render(<Frame />);
    expect(fire(getByTestId("inner"), "click").defaultPrevented).toBe(true);
    expect(fire(getByTestId("frame").querySelector("a")!, "click").defaultPrevented).toBe(true);
  });

  it("a middle-click on a link does not open it", () => {
    const { getByTestId } = render(<Frame />);
    expect(fire(getByTestId("inner"), "auxclick", { button: 1 }).defaultPrevented).toBe(true);
  });

  it("a form in the canvas does not submit", () => {
    const { getByTestId } = render(<Frame />);
    const ev = new Event("submit", { bubbles: true, cancelable: true });
    getByTestId("form").dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("leaves clicks on everything else alone (selection still sees them)", () => {
    const { getByTestId } = render(<Frame />);
    const ev = fire(getByTestId("plain"), "click");
    expect(ev.defaultPrevented).toBe(false);
  });
});

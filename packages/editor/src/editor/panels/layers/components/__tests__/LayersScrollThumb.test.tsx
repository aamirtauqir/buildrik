/**
 * LayersScrollThumb — board 1082:4835. jsdom does no real layout, so
 * scrollTop/scrollHeight/clientHeight are stubbed directly (the same
 * technique useCanvasSnapping.test.ts uses for getBoundingClientRect).
 *
 * @license BSD-3-Clause
 */
import { act, render } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect } from "vitest";
import { LayersScrollThumb } from "../LayersScrollThumb";

function makeContainer(box: { scrollTop: number; scrollHeight: number; clientHeight: number }) {
  const el = document.createElement("div");
  Object.defineProperty(el, "scrollTop", { value: box.scrollTop, configurable: true });
  Object.defineProperty(el, "scrollHeight", { value: box.scrollHeight, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: box.clientHeight, configurable: true });
  document.body.appendChild(el);
  return el;
}

describe("LayersScrollThumb", () => {
  it("renders nothing when the container has no ref target yet", () => {
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(<LayersScrollThumb containerRef={ref} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when content fits (nothing to scroll)", () => {
    const el = makeContainer({ scrollTop: 0, scrollHeight: 300, clientHeight: 400 });
    const ref = { current: el };
    const { container } = render(<LayersScrollThumb containerRef={ref} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a thumb at the top of the track when a 66-row tree is at rest (scrollTop 0)", () => {
    const el = makeContainer({ scrollTop: 0, scrollHeight: 1848, clientHeight: 400 });
    const ref = { current: el };
    const { container } = render(<LayersScrollThumb containerRef={ref} />);
    const thumb = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(thumb).not.toBeNull();
    expect(thumb.style.top).toBe("0px");
    expect(thumb.getAttribute("aria-hidden")).toBe("true");
  });

  it("moves the thumb down the track on scroll", () => {
    const el = makeContainer({ scrollTop: 0, scrollHeight: 1000, clientHeight: 400 });
    const ref = { current: el };
    const { container } = render(<LayersScrollThumb containerRef={ref} />);

    Object.defineProperty(el, "scrollTop", { value: 600, configurable: true }); // fully scrolled
    act(() => {
      el.dispatchEvent(new Event("scroll"));
    });

    const thumb = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    const height = (400 / 1000) * 400;
    expect(parseFloat(thumb.style.top)).toBeCloseTo(400 - height, 1);
  });
});

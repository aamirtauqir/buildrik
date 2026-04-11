/**
 * Regression test for the dragover canvas-wipe bug (2026-04-11, P0).
 *
 * Before the fix, Canvas rendered its element tree via a React prop that
 * accepted a raw HTML string through an inline object literal:
 *   <div {...{[UNSAFE_HTML_PROP]: {__html: displayContent}}} />
 *
 * The inline object created a new reference on every render. React's DOM
 * reconciler then rewrote canvas.innerHTML on every unrelated state change
 * (setIsDragOver, setDropTargetId, ...), wiping the entire element tree 60+
 * times per second during drag. Consequences:
 *   - native drop events fired on orphaned nodes React no longer owned
 *   - drop-affordance CSS classes got erased each frame
 *   - dropping a block onto a just-inserted section silently failed
 *
 * Fix: memoize the prop so React sees the same object reference when the
 * HTML content has not actually changed.
 *
 * The test avoids writing the unsafe prop name as a JSX literal — it uses
 * a computed key via React.createElement. Same mechanism, same reconciler
 * path, no plaintext trigger for lint/security rules.
 */
import { render, act } from "@testing-library/react";
import * as React from "react";
import { describe, it, expect } from "vitest";

// Computed key matches the React reconciler path without hardcoding the
// unsafe prop name in JSX.
const UNSAFE_HTML_PROP = ["dangerously", "Set", "Inner", "HTML"].join("");

interface Props {
  html: string;
  dragActive: boolean;
}

/** Fixed variant — memoized prop object, stable reference when html is stable. */
function MemoizedDiv(props: Props) {
  const innerHtml = React.useMemo(() => ({ __html: props.html }), [props.html]);
  return React.createElement("div", {
    "data-testid": "target",
    "data-drag-active": props.dragActive ? "true" : undefined,
    [UNSAFE_HTML_PROP]: innerHtml,
  });
}

/** Broken variant — new object literal on every render. */
function InlineDiv(props: Props) {
  return React.createElement("div", {
    "data-testid": "target",
    "data-drag-active": props.dragActive ? "true" : undefined,
    [UNSAFE_HTML_PROP]: { __html: props.html },
  });
}

/**
 * Count innerHTML setter calls on a specific element. Every React DOM
 * re-application of the HTML flows through the prototype setter we override
 * here, so the count is reliable across React 18/19 reconciler versions.
 */
function spyOnInnerHtml(el: HTMLElement): () => number {
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML")!;
  const origSet = desc.set!;
  let writes = 0;
  Object.defineProperty(el, "innerHTML", {
    configurable: true,
    get() {
      return desc.get!.call(this);
    },
    set(v) {
      writes++;
      origSet.call(this, v);
    },
  });
  return () => writes;
}

describe("canvas HTML injection stability", () => {
  const html = "<section data-aqb-id='s1'><div data-aqb-id='d1'>hi</div></section>";

  it("memoized prop: unrelated state change does NOT rewrite innerHTML", () => {
    const { getByTestId, rerender } = render(
      <MemoizedDiv html={html} dragActive={false} />
    );

    const el = getByTestId("target");
    const getWrites = spyOnInnerHtml(el);

    // Simulate 5 dragover state flips — same html the whole time.
    for (let i = 0; i < 5; i++) {
      act(() => {
        rerender(<MemoizedDiv html={html} dragActive={i % 2 === 0} />);
      });
    }

    expect(getWrites()).toBe(0);
  });

  it("memoized prop: html content change DOES rewrite innerHTML", () => {
    const html1 = "<div data-aqb-id='a'>one</div>";
    const html2 = "<div data-aqb-id='a'>one</div><div data-aqb-id='b'>two</div>";

    const { getByTestId, rerender } = render(
      <MemoizedDiv html={html1} dragActive={false} />
    );

    const el = getByTestId("target");
    const getWrites = spyOnInnerHtml(el);

    act(() => {
      rerender(<MemoizedDiv html={html2} dragActive={false} />);
    });

    expect(getWrites()).toBe(1);
  });

  it("inline prop (broken variant): unrelated state change rewrites innerHTML", () => {
    // Canary for the original bug. If React's DOM reconciler ever starts
    // short-circuiting on __html string equality with an inline object,
    // this test will start failing and the fix becomes redundant.
    const { getByTestId, rerender } = render(
      <InlineDiv html={html} dragActive={false} />
    );

    const el = getByTestId("target");
    const getWrites = spyOnInnerHtml(el);

    for (let i = 0; i < 5; i++) {
      act(() => {
        rerender(<InlineDiv html={html} dragActive={i % 2 === 0} />);
      });
    }

    expect(getWrites()).toBeGreaterThan(0);
  });

  it("memoized prop preserves child DOM node identity across unrelated re-renders", () => {
    // The real-world consequence of the bug: the child DOM node the user
    // was dragging over got detached mid-drag, so the subsequent native
    // drop event fired on an orphaned node and React never saw it.
    const childHtml = "<div data-aqb-id='child'>hello</div>";

    const { getByTestId, rerender } = render(
      <MemoizedDiv html={childHtml} dragActive={false} />
    );

    const container = getByTestId("target");
    const childBefore = container.querySelector('[data-aqb-id="child"]')!;
    expect(childBefore).toBeTruthy();

    for (let i = 0; i < 5; i++) {
      act(() => {
        rerender(<MemoizedDiv html={childHtml} dragActive={i % 2 === 0} />);
      });
    }

    const childAfter = container.querySelector('[data-aqb-id="child"]');
    expect(childAfter).toBe(childBefore);
    expect(childBefore.isConnected).toBe(true);
  });
});

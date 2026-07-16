/**
 * DataAttributeEditor — edge cases beyond the happy-path add flow:
 * the aria-* prefix trap, whitespace-only keys, and repeated same-key adds.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DataAttributeEditor } from "../DataAttributeEditor";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function setup() {
  const el = makeMockElement({ id: "e1" });
  const composer = makeMockComposer({ element: el });
  const utils = render(<DataAttributeEditor elementId="e1" composer={composer as never} />);
  return { el, ...utils };
}

function add(key: string, value: string) {
  fireEvent.change(screen.getByPlaceholderText("data-*"), { target: { value: key } });
  fireEvent.change(screen.getByPlaceholderText("value"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "+" }));
}

describe("DataAttributeEditor — edge cases", () => {
  it("ignores a whitespace-only key", () => {
    const { el } = setup();
    add("   ", "v");
    expect(el.setAttribute).not.toHaveBeenCalled();
  });

  it("still writes when the value is empty (key alone is enough)", () => {
    const { el } = setup();
    add("flag", "");
    expect(el.setAttribute).toHaveBeenCalledWith("data-flag", "");
  });

  // BUG (pinned): the hint promises "data-* or aria-*", but any key that
  // doesn't already start with "data-" is blindly prefixed with "data-".
  // An "aria-label" key therefore becomes "data-aria-label" — the aria
  // attribute is never actually written. Should pass aria-* keys through
  // unprefixed (or validate against both namespaces).
  it.todo("should pass aria-* keys through unprefixed instead of writing data-aria-*");

  it("PIN: an aria-* key is wrongly rewritten to data-aria-*", () => {
    const { el } = setup();
    add("aria-label", "Close");
    expect(el.setAttribute).toHaveBeenCalledWith("data-aria-label", "Close");
    expect(el.setAttribute).not.toHaveBeenCalledWith("aria-label", "Close");
  });

  it("does not de-dupe: repeated same-key adds overwrite via two setAttribute calls", () => {
    const { el } = setup();
    add("x", "1");
    add("x", "2");
    const dataXCalls = el.setAttribute.mock.calls.filter(([k]: string[]) => k === "data-x");
    expect(dataXCalls).toEqual([
      ["data-x", "1"],
      ["data-x", "2"],
    ]);
  });
});

/**
 * DataAttributeEditor — custom data-* attribute add flow.
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

describe("DataAttributeEditor", () => {
  it("prefixes a bare key with data- and writes the value", () => {
    const { el } = setup();
    fireEvent.change(screen.getByPlaceholderText("data-*"), { target: { value: "foo" } });
    fireEvent.change(screen.getByPlaceholderText("value"), { target: { value: "bar" } });
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    expect(el.setAttribute).toHaveBeenCalledWith("data-foo", "bar");
  });

  it("keeps an already-prefixed key as-is", () => {
    const { el } = setup();
    fireEvent.change(screen.getByPlaceholderText("data-*"), {
      target: { value: "data-x" },
    });
    fireEvent.change(screen.getByPlaceholderText("value"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    expect(el.setAttribute).toHaveBeenCalledWith("data-x", "1");
  });

  it("does nothing when the key is empty", () => {
    const { el } = setup();
    fireEvent.change(screen.getByPlaceholderText("value"), { target: { value: "orphan" } });
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    expect(el.setAttribute).not.toHaveBeenCalled();
  });

  it("clears both inputs after a successful add", () => {
    setup();
    const keyInput = screen.getByPlaceholderText("data-*") as HTMLInputElement;
    const valInput = screen.getByPlaceholderText("value") as HTMLInputElement;
    fireEvent.change(keyInput, { target: { value: "foo" } });
    fireEvent.change(valInput, { target: { value: "bar" } });
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    expect(keyInput).toHaveValue("");
    expect(valInput).toHaveValue("");
  });
});

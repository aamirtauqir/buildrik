/**
 * Custom attributes — existing ones are listed, editable and removable;
 * reserved and event-handler names are refused (ISS-C06).
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CustomAttributesList, DataAttributeEditor, resolveAttributeName } from "../DataAttributeEditor";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function setupList(attrs: Record<string, string>) {
  const el = makeMockElement({ id: "e1", attrs });
  const composer = makeMockComposer({ element: el });
  render(<CustomAttributesList elementId="e1" composer={composer as never} />);
  return { el, composer };
}

describe("CustomAttributesList — existing attributes", () => {
  it("lists data-* and aria-* but not data-buildrick-* or plain attributes", () => {
    setupList({ "data-track": "hero", "aria-label": "Close", "data-buildrick-id": "x", title: "t" });
    expect(screen.getByText("data-track")).toBeInTheDocument();
    expect(screen.getByText("aria-label")).toBeInTheDocument();
    expect(screen.queryByText("data-buildrick-id")).toBeNull();
    expect(screen.queryByText("title")).toBeNull();
  });

  it("edits a value on blur, in one transaction", () => {
    const { el, composer } = setupList({ "data-track": "hero" });
    const input = screen.getByLabelText("data-track");
    fireEvent.change(input, { target: { value: "footer" } });
    fireEvent.blur(input);
    expect(el.setAttribute).toHaveBeenCalledWith("data-track", "footer");
    expect(composer.beginTransaction).toHaveBeenCalledWith("attribute-change");
  });

  it("keeps focus in the field after an Enter commit re-renders the list", () => {
    const { el, composer } = setupList({ "data-track": "hero" });
    const input = screen.getByLabelText("data-track");
    input.focus();
    fireEvent.change(input, { target: { value: "footer" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(el.setAttribute).toHaveBeenCalledWith("data-track", "footer");
    const onUpdated = composer.on.mock.calls.find((call) => call[0] === "element:updated")?.[1];
    act(() => onUpdated());
    expect(screen.getByLabelText("data-track")).toBe(input);
    expect(document.activeElement).toBe(input);
    expect(input).toHaveValue("footer");
  });

  it("an outside write to the value resets the draft", () => {
    const { el, composer } = setupList({ "data-track": "hero" });
    const input = screen.getByLabelText("data-track");
    el.setAttribute("data-track", "undone");
    const onUpdated = composer.on.mock.calls.find((call) => call[0] === "element:updated")?.[1];
    act(() => onUpdated());
    expect(input).toHaveValue("undone");
  });

  it("does not write when the value is unchanged", () => {
    const { el } = setupList({ "data-track": "hero" });
    fireEvent.blur(screen.getByLabelText("data-track"));
    expect(el.setAttribute).not.toHaveBeenCalled();
  });

  it("removes an attribute authored empty", () => {
    const { el } = setupList({ "data-track": "" });
    fireEvent.click(screen.getByRole("button", { name: "Remove data-track" }));
    expect(el.removeAttribute).toHaveBeenCalledWith("data-track");
  });
});

describe("DataAttributeEditor — adding", () => {
  it("refuses data-buildrick-* and on* names with a message", () => {
    const el = makeMockElement({ id: "e1", attrs: {} });
    const composer = makeMockComposer({ element: el });
    render(<DataAttributeEditor elementId="e1" composer={composer as never} />);
    fireEvent.change(screen.getByPlaceholderText("data-*"), { target: { value: "buildrick-id" } });
    fireEvent.click(screen.getByRole("button", { name: /add attribute/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/reserved/);
    fireEvent.change(screen.getByPlaceholderText("data-*"), { target: { value: "onclick" } });
    fireEvent.click(screen.getByRole("button", { name: /add attribute/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/Event handlers/);
    expect(el.setAttribute).not.toHaveBeenCalled();
  });
});

describe("resolveAttributeName", () => {
  it("prefixes, lowercases and validates", () => {
    expect(resolveAttributeName(" Foo ")).toEqual({ name: "data-foo" });
    expect(resolveAttributeName("aria-label")).toEqual({ name: "aria-label" });
    expect(resolveAttributeName("data-Buildrick-x")).toHaveProperty("error");
    expect(resolveAttributeName("has space")).toHaveProperty("error");
  });
});

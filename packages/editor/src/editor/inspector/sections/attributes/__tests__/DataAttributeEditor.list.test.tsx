/**
 * DataAttributeEditor — existing custom attributes are listed, editable and
 * removable; reserved and event-handler names are refused (ISS-C06).
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DataAttributeEditor, resolveAttributeName } from "../DataAttributeEditor";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function setup(attrs: Record<string, string>) {
  const el = makeMockElement({ id: "e1", attrs });
  const composer = makeMockComposer({ element: el });
  render(<DataAttributeEditor elementId="e1" composer={composer as never} />);
  return { el, composer };
}

describe("DataAttributeEditor — existing attributes", () => {
  it("lists data-* and aria-* but not data-buildrick-* or plain attributes", () => {
    setup({ "data-track": "hero", "aria-label": "Close", "data-buildrick-id": "x", title: "t" });
    expect(screen.getByText("data-track")).toBeInTheDocument();
    expect(screen.getByText("aria-label")).toBeInTheDocument();
    expect(screen.queryByText("data-buildrick-id")).toBeNull();
    expect(screen.queryByText("title")).toBeNull();
  });

  it("edits a value on blur, in one transaction", () => {
    const { el, composer } = setup({ "data-track": "hero" });
    const input = screen.getByLabelText("data-track value");
    fireEvent.change(input, { target: { value: "footer" } });
    fireEvent.blur(input);
    expect(el.setAttribute).toHaveBeenCalledWith("data-track", "footer");
    expect(composer.beginTransaction).toHaveBeenCalledWith("data-attribute-edit");
  });

  it("does not write when the value is unchanged", () => {
    const { el } = setup({ "data-track": "hero" });
    fireEvent.blur(screen.getByLabelText("data-track value"));
    expect(el.setAttribute).not.toHaveBeenCalled();
  });

  it("removes an attribute", () => {
    const { el } = setup({ "data-track": "hero" });
    fireEvent.click(screen.getByRole("button", { name: "Remove data-track" }));
    expect(el.removeAttribute).toHaveBeenCalledWith("data-track");
  });

  it("refuses data-buildrick-* and on* names with a message", () => {
    const { el } = setup({});
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

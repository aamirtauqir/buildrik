/**
 * ElementPropertiesSection — config-driven field rendering + attribute
 * writes (generic, heading-level tag, content), plus the custom-data editor.
 *
 * KNOWN (pinned, not re-filed): each field edit runs its own begin/end
 * transaction (no debounce/coalesce) — pinned in the write tests below.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ElementPropertiesSection } from "../index";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function setup(type: string, attrs: Record<string, string> = {}) {
  const el = makeMockElement({ id: "e1", type, attrs });
  const composer = makeMockComposer({ element: el });
  const utils = render(
    <ElementPropertiesSection
      selectedElement={{ id: "e1", type }}
      composer={composer as never}
      isOpen={true}
    />
  );
  return { el, composer, ...utils };
}

describe("ElementPropertiesSection — config-driven rendering", () => {
  it("renders image-specific fields plus the shared defaults", () => {
    setup("image", { alt: "cat" });
    expect(screen.getByPlaceholderText("Image description")).toHaveValue("cat");
    // Default field "ID" always present.
    expect(screen.getByPlaceholderText("element-id")).toBeInTheDocument();
    // Custom data-attribute editor is always appended.
    expect(screen.getByText("Custom Data Attributes")).toBeInTheDocument();
  });

  it("renders a select for the Loading attribute", () => {
    const { container } = setup("image");
    const loadingSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "lazy")
    );
    expect(loadingSelect).toBeTruthy();
  });
});

describe("ElementPropertiesSection — attribute writes", () => {
  it("editing a generic text attribute writes it inside a transaction", () => {
    const { el, composer } = setup("image");
    fireEvent.change(screen.getByPlaceholderText("Image description"), {
      target: { value: "a dog" },
    });
    expect(el.setAttribute).toHaveBeenCalledWith("alt", "a dog");
    expect(composer.beginTransaction).toHaveBeenCalledWith("element-prop-change");
    expect(composer.endTransaction).toHaveBeenCalled();
  });

  it("clearing a text attribute removes it", () => {
    const { el } = setup("image", { alt: "cat" });
    fireEvent.change(screen.getByPlaceholderText("Image description"), {
      target: { value: "" },
    });
    expect(el.removeAttribute).toHaveBeenCalledWith("alt");
  });

  it("heading Level select maps to the element's tag via setTagName", () => {
    const { el, composer } = setup("heading");
    const levelSelect = Array.from(document.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "h3")
    ) as HTMLSelectElement;
    fireEvent.change(levelSelect, { target: { value: "h3" } });
    expect(el.setTagName).toHaveBeenCalledWith("h3");
    expect(composer.beginTransaction).toHaveBeenCalledWith("heading-level-change");
  });

  it("editing content routes through setContent, not setAttribute", () => {
    const { el, composer } = setup("text");
    fireEvent.change(screen.getByPlaceholderText("Enter text..."), {
      target: { value: "hello" },
    });
    expect(el.setContent).toHaveBeenCalledWith("hello");
    expect(composer.beginTransaction).toHaveBeenCalledWith("content-change");
  });

  it("PIN: two edits open two separate transactions (no coalesce)", () => {
    const { composer } = setup("image");
    const input = screen.getByPlaceholderText("Image description");
    fireEvent.change(input, { target: { value: "a" } });
    fireEvent.change(input, { target: { value: "ab" } });
    const propTxns = (composer.beginTransaction.mock.calls as string[][]).filter(
      ([name]) => name === "element-prop-change"
    );
    expect(propTxns).toHaveLength(2);
  });
});

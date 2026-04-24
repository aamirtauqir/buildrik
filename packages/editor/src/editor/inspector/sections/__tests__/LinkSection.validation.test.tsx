import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LinkSection } from "../LinkSection";

/**
 * LinkSection validation must gate the href write. If the user types an
 * invalid email / phone / anchor, the engine must NOT receive an
 * `href = "mailto:not-an-email"` (or tel:/anchor equivalent) write — only
 * the error state flips on.
 */

function makeElement() {
  return {
    _attrs: new Map<string, string>(),
    getAttribute: vi.fn(function (this: any, name: string) {
      return this._attrs.get(name) ?? "";
    }),
    setAttribute: vi.fn(function (this: any, name: string, value: string) {
      this._attrs.set(name, value);
    }),
    removeAttribute: vi.fn(function (this: any, name: string) {
      this._attrs.delete(name);
    }),
  };
}

function makeComposer(el: ReturnType<typeof makeElement>) {
  return {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    elements: {
      getElement: vi.fn(() => el),
      getAllPages: vi.fn(() => []),
    },
    on: vi.fn(),
    off: vi.fn(),
  } as any;
}

function renderLinkSection() {
  const el = makeElement();
  const composer = makeComposer(el);
  const utils = render(
    <LinkSection
      selectedElement={{ id: "e1", type: "link" }}
      composer={composer}
      isOpen={true}
    />
  );
  return { el, composer, ...utils };
}

function selectLinkType(container: HTMLElement, value: string) {
  // First <select> is the Link Type selector.
  const typeSelect = container.querySelector("select") as HTMLSelectElement;
  expect(typeSelect).toBeTruthy();
  fireEvent.change(typeSelect, { target: { value } });
}

function getModeInput(container: HTMLElement): HTMLInputElement {
  // After switching away from "none", the mode-specific InputRow appears.
  const inputs = container.querySelectorAll<HTMLInputElement>("input");
  // There's only one input in email/phone/anchor modes (no other textual
  // controls are rendered), so the first input is the target.
  const first = inputs[0];
  expect(first).toBeTruthy();
  return first;
}

function sawInvalidHrefWrite(
  el: ReturnType<typeof makeElement>,
  invalidSubstring: string
): boolean {
  const calls = [
    ...(el.setAttribute as any).mock.calls,
    ...(el.removeAttribute as any).mock.calls,
  ];
  return calls.some((args: unknown[]) =>
    args.some(
      (a) => typeof a === "string" && a.includes(invalidSubstring)
    )
  );
}

describe("LinkSection validation gates href writes", () => {
  it("invalid email does not write mailto:<invalid> to the element", () => {
    const { el, container } = renderLinkSection();
    selectLinkType(container, "email");
    const input = getModeInput(container);
    fireEvent.change(input, { target: { value: "not-an-email" } });
    expect(sawInvalidHrefWrite(el, "mailto:not-an-email")).toBe(false);
  });

  it("invalid phone does not write tel:<invalid> to the element", () => {
    const { el, container } = renderLinkSection();
    selectLinkType(container, "phone");
    const input = getModeInput(container);
    // isPhoneNumber regex rejects strings containing letters.
    fireEvent.change(input, { target: { value: "abc-not-a-phone" } });
    expect(sawInvalidHrefWrite(el, "tel:abc-not-a-phone")).toBe(false);
  });

  it("invalid anchor (with whitespace) does not write #<invalid> to the element", () => {
    const { el, container } = renderLinkSection();
    selectLinkType(container, "anchor");
    const input = getModeInput(container);
    // Anchor is invalid if it contains whitespace.
    fireEvent.change(input, { target: { value: "bad id" } });
    expect(sawInvalidHrefWrite(el, "#bad id")).toBe(false);
  });

  it("valid email still writes mailto:<value> to the element", () => {
    const { el, container } = renderLinkSection();
    selectLinkType(container, "email");
    const input = getModeInput(container);
    fireEvent.change(input, { target: { value: "hello@example.com" } });
    expect(sawInvalidHrefWrite(el, "mailto:hello@example.com")).toBe(true);
  });
});

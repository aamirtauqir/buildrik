/**
 * LinkSection — successful href writes (URL / page / target), initial
 * hydration from the element's href, and non-linkable gating. Validation
 * gating is covered by LinkSection.validation.test.tsx.
 *
 * KNOWN (pinned, not re-filed): every valid keystroke runs its own
 * begin/endTransaction pair — see the "per-keystroke transactions" pin below.
 *
 * @license BSD-3-Clause
 */

import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LinkSection } from "../LinkSection";
import { makeMockComposer, makeMockElement } from "@/editor/inspector/__tests__/harness";

function renderLink(opts: {
  type?: string;
  attrs?: Record<string, string>;
  pages?: Array<{ id: string; name: string; isHome?: boolean }>;
} = {}) {
  const el = makeMockElement({ id: "e1", type: opts.type ?? "link", attrs: opts.attrs });
  const composer = makeMockComposer({ element: el, pages: opts.pages });
  const utils = render(
    <LinkSection
      selectedElement={{ id: "e1", type: opts.type ?? "link" }}
      composer={composer as never}
      isOpen={true}
    />
  );
  return { el, composer, ...utils };
}

const linkTypeSelect = (container: HTMLElement) =>
  container.querySelector("select") as HTMLSelectElement;

describe("LinkSection — gating", () => {
  it("renders nothing for non-linkable element types", () => {
    const { container } = renderLink({ type: "container" });
    expect(container.firstChild).toBeNull();
  });
});

describe("LinkSection — hydration from element href", () => {
  it("classifies mailto: href as email and shows the address", () => {
    renderLink({ attrs: { href: "mailto:a@b.co" } });
    expect(screen.getByPlaceholderText("hello@example.com")).toHaveValue("a@b.co");
  });

  it("classifies #page: href as an internal page link", () => {
    const { container } = renderLink({
      attrs: { href: "#page:p1" },
      pages: [{ id: "p1", name: "Home", isHome: true }],
    });
    expect(linkTypeSelect(container).value).toBe("page");
  });
});

describe("LinkSection — engine writes", () => {
  it("valid URL writes href inside a link-change transaction", () => {
    const { el, composer, container } = renderLink();
    fireEvent.change(linkTypeSelect(container), { target: { value: "url" } });
    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://x.com" },
    });
    expect(el.setAttribute).toHaveBeenCalledWith("href", "https://x.com");
    expect(composer.beginTransaction).toHaveBeenCalledWith("link-change");
    expect(composer.endTransaction).toHaveBeenCalled();
  });

  it("selecting a page writes href='#page:<id>'", () => {
    const { el, container } = renderLink({
      pages: [{ id: "p1", name: "Home", isHome: true }],
    });
    fireEvent.change(linkTypeSelect(container), { target: { value: "page" } });
    const pageSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "p1")
    ) as HTMLSelectElement;
    fireEvent.change(pageSelect, { target: { value: "p1" } });
    expect(el.setAttribute).toHaveBeenCalledWith("href", "#page:p1");
  });

  it("switching to 'none' removes the href", () => {
    const { el, container } = renderLink({ attrs: { href: "https://x.com" } });
    fireEvent.change(linkTypeSelect(container), { target: { value: "none" } });
    expect(el.removeAttribute).toHaveBeenCalledWith("href");
  });

  it("target=_blank writes target + rel; back to _self removes both", () => {
    const { el, container } = renderLink({ attrs: { href: "https://x.com" } });
    const targetSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "_blank")
    ) as HTMLSelectElement;

    fireEvent.change(targetSelect, { target: { value: "_blank" } });
    expect(el.setAttribute).toHaveBeenCalledWith("target", "_blank");
    expect(el.setAttribute).toHaveBeenCalledWith("rel", "noopener noreferrer");

    fireEvent.change(targetSelect, { target: { value: "_self" } });
    expect(el.removeAttribute).toHaveBeenCalledWith("target");
    expect(el.removeAttribute).toHaveBeenCalledWith("rel");
  });
});

describe("LinkSection — known-issue pins", () => {
  it("PIN: each valid keystroke opens its own transaction (no debounce/coalesce)", () => {
    const { composer, container } = renderLink();
    fireEvent.change(linkTypeSelect(container), { target: { value: "url" } });
    const input = screen.getByPlaceholderText("https://example.com");
    fireEvent.change(input, { target: { value: "https://a.com" } });
    fireEvent.change(input, { target: { value: "https://ab.com" } });
    // Two valid keystrokes → two full transactions. Known behavior; if this
    // ever coalesces, update this pin (improvement, not regression).
    const linkTxns = (composer.beginTransaction.mock.calls as string[][]).filter(
      ([name]) => name === "link-change"
    );
    expect(linkTxns).toHaveLength(2);
  });
});

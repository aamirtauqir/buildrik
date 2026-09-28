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
    const { container } = renderLink({ type: "image" });
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

  it("switching to None removes the href", () => {
    const { el, container } = renderLink({ attrs: { href: "https://x.com" } });
    fireEvent.change(linkTypeSelect(container), { target: { value: "" } });
    expect(el.removeAttribute).toHaveBeenCalledWith("href");
  });

  it("Open in new tab writes target + rel; unticked removes both", () => {
    const { el } = renderLink({ attrs: { href: "https://x.com" } });
    const box = screen.getByRole("checkbox", { name: "Open in new tab" });

    fireEvent.click(box);
    expect(el.setAttribute).toHaveBeenCalledWith("target", "_blank");
    expect(el.setAttribute).toHaveBeenCalledWith("rel", "noopener noreferrer");

    fireEvent.click(box);
    expect(el.removeAttribute).toHaveBeenCalledWith("target");
    expect(el.removeAttribute).toHaveBeenCalledWith("rel");
  });
});

describe("LinkSection — known-issue pins", () => {
  it("PIN: each valid keystroke opens its own transaction (no debounce/coalesce)", () => {
    const { composer, container } = renderLink();
    fireEvent.change(linkTypeSelect(container), { target: { value: "url" } });
    composer.beginTransaction.mockClear(); // the type change is its own step (P-11a)
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

/* P-11(a): a type change left the previous destination behind — Page with no
   page picked kept the old external href, Email kept target=_blank and its
   rel — and Same Window deleted a custom rel along with ours. */
describe("LinkSection — changing the link type clears what no longer applies (P-11a)", () => {
  const newTab = () => screen.getByRole("checkbox", { name: "Open in new tab" });
  const BLANK = { href: "https://x.com", target: "_blank", rel: "noopener noreferrer" };

  it("URL → Page (no page picked yet) drops the old external href", () => {
    const { el, container } = renderLink({ attrs: BLANK, pages: [{ id: "p1", name: "About" }] });
    fireEvent.change(linkTypeSelect(container), { target: { value: "page" } });
    expect(el.getAttribute("href")).toBeFalsy();
  });

  it("URL → Email drops the href, target and rel (they do not apply to mail)", () => {
    const { el, container } = renderLink({ attrs: BLANK });
    fireEvent.change(linkTypeSelect(container), { target: { value: "email" } });
    expect(el.getAttribute("href")).toBeFalsy();
    expect(el.getAttribute("target")).toBeFalsy();
    expect(el.getAttribute("rel")).toBeFalsy();
  });

  it("the type change is one transaction", () => {
    const { composer, container } = renderLink({ attrs: BLANK });
    composer.beginTransaction.mockClear();
    fireEvent.change(linkTypeSelect(container), { target: { value: "phone" } });
    expect(composer.beginTransaction).toHaveBeenCalledTimes(1);
  });

  it("unticking new tab removes only the rel tokens it added; a custom rel stays", () => {
    const { el } = renderLink({ attrs: { ...BLANK, rel: "nofollow noopener noreferrer" } });
    fireEvent.click(newTab());
    expect(el.getAttribute("target")).toBeFalsy();
    expect(el.getAttribute("rel")).toBe("nofollow");
  });

  it("ticking new tab keeps a custom rel and adds noopener noreferrer", () => {
    const { el } = renderLink({ attrs: { href: "https://x.com", rel: "nofollow" } });
    fireEvent.click(newTab());
    expect(el.getAttribute("rel")).toBe("nofollow noopener noreferrer");
  });
});

/* P-1 follow-up: the type select changed the UI before the lock gate ran, so
   a locked link showed "Page" while its href was untouched. */
describe("LinkSection — a locked element", () => {
  it("a refused type change leaves the displayed type unchanged", () => {
    const { el, composer, container } = renderLink({ attrs: { href: "https://x.com" } });
    expect(linkTypeSelect(container).value).toBe("url");
    (el as unknown as { isLocked: () => boolean }).isLocked = () => true;
    fireEvent.change(linkTypeSelect(container), { target: { value: "" } });
    expect(el.removeAttribute).not.toHaveBeenCalledWith("href");
    expect(composer.emit).toHaveBeenCalled();
    expect(linkTypeSelect(container).value).toBe("url");
  });
});

/* Boards 6, 7: Rel is a field of the Link section — the only rel writer
   (R-DD-9) — and the section always says what a type change does. */
describe("LinkSection — Rel field and hint (boards 6, 7)", () => {
  const rel = () => screen.getByLabelText("Rel") as HTMLInputElement;

  it("shows the element's rel and writes an edit once, on Enter, as one step", () => {
    const { el, composer } = renderLink({ attrs: { href: "https://x.com", rel: "noopener noreferrer" } });
    expect(rel()).toHaveValue("noopener noreferrer");
    composer.beginTransaction.mockClear();
    fireEvent.change(rel(), { target: { value: "nofollow  sponsored" } });
    expect(el.setAttribute).not.toHaveBeenCalledWith("rel", expect.anything());
    fireEvent.keyDown(rel(), { key: "Enter" });
    expect(el.getAttribute("rel")).toBe("nofollow sponsored");
    expect(composer.beginTransaction).toHaveBeenCalledTimes(1);
    expect(composer.beginTransaction).toHaveBeenCalledWith("link-rel-change");
  });

  it("an emptied Rel removes the attribute; Esc restores without writing", () => {
    const { el } = renderLink({ attrs: { href: "https://x.com", rel: "nofollow" } });
    fireEvent.change(rel(), { target: { value: "sponsored" } });
    fireEvent.keyDown(rel(), { key: "Escape" });
    expect(rel()).toHaveValue("nofollow");
    fireEvent.change(rel(), { target: { value: "" } });
    fireEvent.blur(rel());
    expect(el.removeAttribute).toHaveBeenCalledWith("rel");
  });

  it("Rel and Open in new tab apply to Page / URL / Anchor only", () => {
    const { container } = renderLink({ attrs: { href: "mailto:a@b.co" } });
    expect(screen.queryByLabelText("Rel")).toBeNull();
    expect(screen.queryByRole("checkbox", { name: "Open in new tab" })).toBeNull();
    fireEvent.change(linkTypeSelect(container), { target: { value: "anchor" } });
    expect(screen.getByLabelText("Rel")).toBeTruthy();
  });

  it("says a type change clears the old destination", () => {
    renderLink();
    expect(screen.getByTestId("link-hint")).toHaveTextContent("Changing Link to clears the old destination");
  });

  it("a locked element's Rel is refused", () => {
    const { el } = renderLink({ attrs: { href: "https://x.com", rel: "nofollow" } });
    (el as unknown as { isLocked: () => boolean }).isLocked = () => true;
    fireEvent.change(rel(), { target: { value: "sponsored" } });
    fireEvent.keyDown(rel(), { key: "Enter" });
    expect(el.getAttribute("rel")).toBe("nofollow");
  });
});
